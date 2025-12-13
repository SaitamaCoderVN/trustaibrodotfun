import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN, Wallet, Idl } from '@coral-xyz/anchor';
import { IDL, getIDLSync } from './idl';

const PROGRAM_ID = new PublicKey('4ke9FgyExgpUFnct3cPAcFT94tCwSPPXTts9Y1QdHXNK');

export interface MarketData {
  authority: PublicKey;
  pool: PublicKey;
  matchId: string; // IDL uses match_id but Anchor converts to camelCase
  isSettled: boolean; // IDL uses is_settled
  winningAi: number; // IDL uses winning_ai
  totalPool: BN; // IDL uses total_pool
  player1Pool: BN; // IDL uses player1_pool
  player2Pool: BN; // IDL uses player2_pool
  createdAt: BN; // IDL uses created_at
  bump: number;
  poolBump: number; // IDL uses pool_bump
}

export interface BetData {
  user: PublicKey;
  market: PublicKey;
  aiIndex: number; // IDL uses ai_index
  amount: BN;
  claimed: boolean;
  timestamp: BN;
  bump: number;
}

export class BettingClient {
  private program: Program;
  private connection: Connection;
  private wallet: Wallet;

  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection;
    this.wallet = wallet;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    
    // Try to get IDL, fallback to empty object if not available
    let idl: Idl;
    try {
      idl = getIDLSync();
    } catch {
      idl = IDL;
    }
    
    this.program = new Program(idl as any, provider);
  }

  /**
   * Retry helper with exponential backoff for rate limit errors
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limit error (429)
        const isRateLimit = error?.message?.includes('429') || 
                           error?.message?.includes('rate limit') ||
                           error?.message?.includes('rate limits exceeded') ||
                           error?.code === 429;
        
        if (isRateLimit && attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If not rate limit or last attempt, throw immediately
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Get market PDA
   */
  getMarketPDA(matchId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('market'), Buffer.from(matchId)],
      PROGRAM_ID
    );
  }

  /**
   * Get pool PDA
   */
  getPoolPDA(matchId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), Buffer.from(matchId)],
      PROGRAM_ID
    );
  }

  /**
   * Get bet PDA
   */
  getBetPDA(market: PublicKey, user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bet'), market.toBuffer(), user.toBuffer()],
      PROGRAM_ID
    );
  }

  /**
   * Initialize a market for a match
   */
  async initializeMarket(matchId: string): Promise<string> {
    const [marketPDA] = this.getMarketPDA(matchId);
    const [poolPDA] = this.getPoolPDA(matchId);

    const tx = await this.program.methods
      .initializeMarket(matchId)
      .accounts({
        market: marketPDA,
        pool: poolPDA,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Place a bet on player1 (aiIndex = 0) or player2 (aiIndex = 1)
   */
  async placeBet(
    matchId: string,
    aiIndex: number,
    amount: number // Amount in SOL
  ): Promise<string> {
    const [marketPDA] = this.getMarketPDA(matchId);
    const [poolPDA] = this.getPoolPDA(matchId);
    const [betPDA] = this.getBetPDA(marketPDA, this.wallet.publicKey);

    // Convert SOL to lamports with proper precision
    // Use string to avoid floating point precision issues
    const amountInLamports = Math.round(amount * 1e9);
    const amountLamports = new BN(amountInLamports);

    console.log(`Placing bet: ${amount} SOL = ${amountLamports.toString()} lamports`);

    try {
      const tx = await this.program.methods
        .placeBet(aiIndex, amountLamports)
        .accounts({
          market: marketPDA,
          bet: betPDA,
          pool: poolPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`Bet placed successfully. Transaction: ${tx}`);
      return tx;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      console.error('Amount attempted:', amount, 'SOL =', amountLamports.toString(), 'lamports');
      throw error;
    }
  }

  /**
   * Initialize market and place bet in a single transaction
   * This combines both operations to save on transaction fees
   */
  async initializeMarketAndPlaceBet(
    matchId: string,
    aiIndex: number,
    amount: number // Amount in SOL
  ): Promise<string> {
    const [marketPDA] = this.getMarketPDA(matchId);
    const [poolPDA] = this.getPoolPDA(matchId);
    const [betPDA] = this.getBetPDA(marketPDA, this.wallet.publicKey);

    // Convert SOL to lamports
    const amountInLamports = Math.round(amount * 1e9);
    const amountLamports = new BN(amountInLamports);

    console.log(`Initializing market and placing bet: ${amount} SOL = ${amountLamports.toString()} lamports`);

    try {
      // Build both instructions
      const initializeIx = await this.program.methods
        .initializeMarket(matchId)
        .accounts({
          market: marketPDA,
          pool: poolPDA,
          authority: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const placeBetIx = await this.program.methods
        .placeBet(aiIndex, amountLamports)
        .accounts({
          market: marketPDA,
          bet: betPDA,
          pool: poolPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction with both instructions
      const transaction = new Transaction().add(initializeIx, placeBetIx);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      // Sign and send transaction
      const signedTx = await this.wallet.signTransaction(transaction);
      const tx = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Wait for confirmation
      await this.connection.confirmTransaction(tx, 'confirmed');

      console.log(`Market initialized and bet placed successfully. Transaction: ${tx}`);
      return tx;
    } catch (error: any) {
      console.error('Error initializing market and placing bet:', error);
      console.error('Amount attempted:', amount, 'SOL =', amountLamports.toString(), 'lamports');
      throw error;
    }
  }

  /**
   * Deposit SOL into pool (for testing - anyone can deposit)
   * Automatically initializes market if it doesn't exist
   */
  async depositToPool(matchId: string, amount: number): Promise<string> {
    const [marketPDA, marketBump] = this.getMarketPDA(matchId);
    const [poolPDA, poolBump] = this.getPoolPDA(matchId);

    // Convert SOL to lamports
    const amountInLamports = Math.round(amount * 1e9);
    const amountLamports = new BN(amountInLamports);

    console.log(`Depositing ${amount} SOL = ${amountLamports.toString()} lamports into pool`);

    try {
      // Check if market exists
      const market = await this.getMarket(matchId);
      const marketExists = market !== null;

      // If market doesn't exist, initialize it first
      if (!marketExists) {
        console.log('Market not found, initializing market and depositing...');
        
        const initializeMarketIx = await this.program.methods
          .initializeMarket(matchId)
          .accounts({
            market: marketPDA,
            pool: poolPDA,
            authority: this.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();

        const depositIx = await this.program.methods
          .depositToPool(amountLamports)
          .accounts({
            market: marketPDA,
            pool: poolPDA,
            user: this.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();

        // Create transaction with both instructions
        const transaction = new Transaction().add(initializeMarketIx, depositIx);

        // Get recent blockhash with retry
        const { blockhash } = await this.retryWithBackoff(
          () => this.connection.getLatestBlockhash('confirmed'),
          3,
          1000
        );
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;

        // Sign and send transaction with retry
        const signedTx = await this.wallet.signTransaction(transaction);
        const tx = await this.retryWithBackoff(
          () => this.connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          }),
          3,
          1500
        );

        // Wait for confirmation with retry
        await this.retryWithBackoff(
          () => this.connection.confirmTransaction(tx, 'confirmed'),
          3,
          2000
        );

        console.log(`Market initialized and deposit successful. Transaction: ${tx}`);
        return tx;
      } else {
        // Market exists, just deposit with retry logic
        // Build deposit instruction
        const depositIx = await this.program.methods
          .depositToPool(amountLamports)
          .accounts({
            market: marketPDA,
            pool: poolPDA,
            user: this.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        
        // Use retry logic for deposit
        const depositTx = await this.retryWithBackoff(
          async () => {
            const { blockhash } = await this.retryWithBackoff(
              () => this.connection.getLatestBlockhash('confirmed'),
              3,
              1000
            );
            
            const transaction = new Transaction();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.wallet.publicKey;
            transaction.add(depositIx);
            
            const signedTx = await this.wallet.signTransaction(transaction);
            const tx = await this.retryWithBackoff(
              () => this.connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: false,
                maxRetries: 3,
              }),
              3,
              1500
            );
            
            await this.retryWithBackoff(
              () => this.connection.confirmTransaction(tx, 'confirmed'),
              3,
              2000
            );
            
            return tx;
          },
          3,
          1500
        );

        console.log(`Deposit successful. Transaction: ${depositTx}`);
        return depositTx;
      }
    } catch (error: any) {
      console.error('Error depositing to pool:', error);
      throw error;
    }
  }

  /**
   * Settle market (only authority)
   */
  async settleMarket(matchId: string, winningAi: number): Promise<string> {
    const [marketPDA] = this.getMarketPDA(matchId);

    const tx = await this.program.methods
      .settleMarket(winningAi)
      .accounts({
        market: marketPDA,
        authority: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  /**
   * Claim winnings with retry logic for rate limits
   */
  async claimWinnings(matchId: string): Promise<string> {
    const [marketPDA] = this.getMarketPDA(matchId);
    const [poolPDA] = this.getPoolPDA(matchId);
    const [betPDA] = this.getBetPDA(marketPDA, this.wallet.publicKey);

    return this.retryWithBackoff(async () => {
      // Get recent blockhash with retry
      const { blockhash } = await this.retryWithBackoff(
        () => this.connection.getLatestBlockhash('confirmed'),
        3,
        1000
      );

      // Build instruction
      const claimIx = await this.program.methods
        .claimWinnings()
        .accounts({
          market: marketPDA,
          bet: betPDA,
          pool: poolPDA,
          user: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      transaction.add(claimIx);

      // Sign and send with retry
      const signedTx = await this.wallet.signTransaction(transaction);
      const tx = await this.retryWithBackoff(
        () => this.connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        }),
        3,
        1500
      );

      // Wait for confirmation with retry
      await this.retryWithBackoff(
        () => this.connection.confirmTransaction(tx, 'confirmed'),
        3,
        2000
      );

      return tx;
    }, 3, 2000); // 3 retries, starting with 2s delay
  }

  /**
   * Fetch market data
   */
  async getMarket(matchId: string): Promise<MarketData | null> {
    try {
      const [marketPDA] = this.getMarketPDA(matchId);
      const market = await (this.program.account as any).market.fetch(marketPDA);
      return market as MarketData;
    } catch (error: any) {
      // Suppress "Account does not exist" errors - this is normal when market hasn't been initialized
      if (error?.message?.includes('Account does not exist')) {
        return null;
      }
      console.error('Error fetching market:', error);
      return null;
    }
  }

  /**
   * Fetch user's bet
   */
  async getBet(matchId: string, user: PublicKey): Promise<BetData | null> {
    try {
      const [marketPDA] = this.getMarketPDA(matchId);
      const [betPDA] = this.getBetPDA(marketPDA, user);
      const bet = await (this.program.account as any).bet.fetch(betPDA);
      return bet as BetData;
    } catch (error: any) {
      // Suppress "Account does not exist" errors - this is normal when user hasn't bet yet
      if (error?.message?.includes('Account does not exist')) {
        return null;
      }
      console.error('Error fetching bet:', error);
      return null;
    }
  }
}

/**
 * Hook to use betting client
 */
export function useBettingClient() {
  const { connection } = useConnection();
  const wallet = useWallet();

  if (!wallet.publicKey || !wallet.signTransaction) {
    return null;
  }

  const walletAdapter = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  } as Wallet;

  return new BettingClient(connection, walletAdapter);
}

