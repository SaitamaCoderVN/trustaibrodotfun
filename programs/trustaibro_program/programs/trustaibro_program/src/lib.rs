// TrustAI Bro - Simple Betting Program for AI Prisoner's Dilemma
// Demo version with SOL betting only
// Deploy to devnet: anchor deploy --provider.cluster devnet

use anchor_lang::prelude::*;

declare_id!("4ke9FgyExgpUFnct3cPAcFT94tCwSPPXTts9Y1QdHXNK");

#[program]
pub mod trustaibro_program {
    use super::*;

    /// Initialize a betting market for a match
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        match_id: String,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.pool = ctx.accounts.pool.key();
        market.match_id = match_id;
        market.is_settled = false;
        market.winning_ai = 255; // 255 = not set
        market.total_pool = 0;
        market.player1_pool = 0;
        market.player2_pool = 0;
        market.created_at = Clock::get()?.unix_timestamp;
        market.bump = ctx.bumps.market;
        market.pool_bump = ctx.bumps.pool;
        
        msg!("Market initialized for match: {}", market.match_id);
        Ok(())
    }

    /// Place a bet on player1 (ai_index = 0) or player2 (ai_index = 1)
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        ai_index: u8,
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.is_settled, ErrorCode::MarketSettled);
        require!(ai_index < 2, ErrorCode::InvalidAiIndex);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer SOL from user to pool
        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Update market pools
        market.total_pool = market.total_pool.checked_add(amount).unwrap();
        
        if ai_index == 0 {
            market.player1_pool = market.player1_pool.checked_add(amount).unwrap();
        } else {
            market.player2_pool = market.player2_pool.checked_add(amount).unwrap();
        }

        // Create bet account (init ensures it doesn't exist)
        let bet = &mut ctx.accounts.bet;
        bet.user = ctx.accounts.user.key();
        bet.market = market.key();
        bet.ai_index = ai_index;
        bet.amount = amount;
        bet.claimed = false;
        bet.timestamp = Clock::get()?.unix_timestamp;
        bet.bump = ctx.bumps.bet;

        msg!("Bet placed: {} SOL on AI {}", amount as f64 / 1e9, ai_index);
        Ok(())
    }

    /// Settle the market after match ends (only authority can call)
    pub fn settle_market(
        ctx: Context<SettleMarket>,
        winning_ai: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.is_settled, ErrorCode::MarketSettled);
        require!(ctx.accounts.authority.key() == market.authority, ErrorCode::Unauthorized);
        // Allow 0 (player1), 1 (player2), or 255 (draw)
        require!(
            winning_ai < 2 || winning_ai == 255,
            ErrorCode::InvalidAiIndex
        );

        market.is_settled = true;
        market.winning_ai = winning_ai;

        msg!("Market settled. Winner: AI {}", winning_ai);
        Ok(())
    }

    /// Deposit SOL into pool (for testing purposes - anyone can deposit)
    pub fn deposit_to_pool(
        ctx: Context<DepositToPool>,
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.is_settled, ErrorCode::MarketSettled);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer SOL from user to pool
        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Update total pool (but not player pools - this is just a deposit)
        market.total_pool = market.total_pool.checked_add(amount).unwrap();

        msg!("Deposited {} SOL into pool", amount as f64 / 1e9);
        Ok(())
    }

    /// Claim winnings if user bet on the winning AI
    /// If draw (winning_ai = 255), all users can claim refund (1x bet)
    /// If winner exists, only winner can claim 2x bet
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(market.is_settled, ErrorCode::MarketNotSettled);
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);

        // Check if it's a draw (winning_ai = 255)
        let is_draw = market.winning_ai == 255;
        
        if is_draw {
            // Draw: All users can claim refund (1x their bet)
            // No need to check if user bet on winner
        } else {
            // Not a draw: Only winner can claim
            require!(bet.ai_index == market.winning_ai, ErrorCode::NotWinner);
        }

        // Calculate user's winnings
        let user_winnings = if is_draw {
            // Draw: Refund only (1x bet)
            bet.amount
        } else {
            // Winner: 2x bet
            bet.amount
                .checked_mul(2)
                .ok_or(ErrorCode::InvalidAmount)?
        };

        // Ensure pool has enough funds
        require!(
            market.total_pool >= user_winnings,
            ErrorCode::NoWinningPool
        );

        bet.claimed = true;

        // Transfer winnings from pool to user
        let pool_seeds = &[
            b"pool",
            market.match_id.as_bytes(),
            &[market.pool_bump],
        ];
        let signer_seeds = &[&pool_seeds[..]];

        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: ctx.accounts.pool.to_account_info(),
            to: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
            signer_seeds,
        );
        anchor_lang::system_program::transfer(cpi_ctx, user_winnings)?;

        // Update market total pool
        let market = &mut ctx.accounts.market;
        market.total_pool = market.total_pool
            .checked_sub(user_winnings)
            .ok_or(ErrorCode::InvalidAmount)?;

        if is_draw {
            msg!("Refund claimed (draw): {} SOL (refund of {} SOL bet)", 
                 user_winnings as f64 / 1e9, 
                 bet.amount as f64 / 1e9);
        } else {
            msg!("Winnings claimed: {} SOL (2x bet of {} SOL)", 
                 user_winnings as f64 / 1e9, 
                 bet.amount as f64 / 1e9);
        }
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", match_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Pool PDA for holding SOL
    #[account(
        seeds = [b"pool", match_id.as_bytes()],
        bump
    )]
    pub pool: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ai_index: u8, amount: u64)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: Pool PDA
    #[account(
        mut,
        seeds = [b"pool", market.match_id.as_bytes()],
        bump
    )]
    pub pool: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DepositToPool<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    /// CHECK: Pool PDA
    #[account(
        mut,
        seeds = [b"pool", market.match_id.as_bytes()],
        bump = market.pool_bump
    )]
    pub pool: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        constraint = bet.market == market.key(),
        constraint = bet.user == user.key()
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: Pool PDA
    #[account(
        mut,
        seeds = [b"pool", market.match_id.as_bytes()],
        bump = market.pool_bump
    )]
    pub pool: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub pool: Pubkey,
    #[max_len(64)]
    pub match_id: String,
    pub is_settled: bool,
    pub winning_ai: u8, // 0 = player1, 1 = player2, 255 = not set
    pub total_pool: u64,
    pub player1_pool: u64,
    pub player2_pool: u64,
    pub created_at: i64,
    pub bump: u8,
    pub pool_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub user: Pubkey,
    pub market: Pubkey,
    pub ai_index: u8, // 0 = player1, 1 = player2
    pub amount: u64,
    pub claimed: bool,
    pub timestamp: i64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Market has already been settled")]
    MarketSettled,
    #[msg("Market has not been settled yet")]
    MarketNotSettled,
    #[msg("Invalid AI index (must be 0, 1, or 255 for draw)")]
    InvalidAiIndex,
    #[msg("Invalid bet amount")]
    InvalidAmount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Bet has already been claimed")]
    AlreadyClaimed,
    #[msg("Bet did not win")]
    NotWinner,
    #[msg("No winning pool")]
    NoWinningPool,
}
