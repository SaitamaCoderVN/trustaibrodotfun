// Neural Dilemma - Solana Betting Pool Program (Anchor Framework)
// Deploy to devnet: anchor deploy --provider.cluster devnet
//
// Program ID: [Will be generated on first deploy]
//
// Instructions:
// 1. create_market - Create a new betting market for a tournament
// 2. place_bet - Place a bet on an AI agent
// 3. settle_market - Settle the market after tournament ends
// 4. claim_winnings - Claim winnings from a winning bet

use anchor_lang::prelude::*;

declare_id!("NeuralDi1emma111111111111111111111111111111");

#[program]
pub mod neural_dilemma {
    use super::*;

    pub fn create_market(
        ctx: Context<CreateMarket>,
        match_id: String,
        num_options: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.pool = ctx.accounts.pool.key();
        market.match_id = match_id;
        market.is_settled = false;
        market.winning_ai = 255;
        market.total_pool = 0;
        market.num_options = num_options;
        market.option_pools = vec![0u64; num_options as usize];
        market.created_at = Clock::get()?.unix_timestamp;
        market.bump = ctx.bumps.market;
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        ai_index: u8,
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.is_settled, ErrorCode::MarketSettled);
        require!(ai_index < market.num_options, ErrorCode::InvalidAiIndex);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        market.total_pool = market.total_pool.checked_add(amount).unwrap();
        market.option_pools[ai_index as usize] = market.option_pools[ai_index as usize]
            .checked_add(amount)
            .unwrap();

        let bet = &mut ctx.accounts.bet;
        bet.user = ctx.accounts.user.key();
        bet.market = market.key();
        bet.ai = ai_index;
        bet.amount = amount;
        bet.claimed = false;
        bet.timestamp = Clock::get()?.unix_timestamp;
        bet.bump = ctx.bumps.bet;

        Ok(())
    }

    pub fn settle_market(
        ctx: Context<SettleMarket>,
        winning_ai: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.is_settled, ErrorCode::MarketSettled);
        require!(ctx.accounts.authority.key() == market.authority, ErrorCode::Unauthorized);
        require!(winning_ai < market.num_options, ErrorCode::InvalidAiIndex);

        market.is_settled = true;
        market.winning_ai = winning_ai;

        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(market.is_settled, ErrorCode::MarketNotSettled);
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        require!(bet.ai == market.winning_ai, ErrorCode::NotWinner);

        let winning_pool = market.option_pools[market.winning_ai as usize];
        require!(winning_pool > 0, ErrorCode::NoWinningPool);

        let user_share = (bet.amount as u128)
            .checked_mul(market.total_pool as u128)
            .unwrap()
            .checked_div(winning_pool as u128)
            .unwrap() as u64;

        bet.claimed = true;

        let pool_seeds = &[
            b"pool",
            market.match_id.as_bytes(),
            &[ctx.accounts.pool.to_account_info().data.borrow()[0]],
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
        anchor_lang::system_program::transfer(cpi_ctx, user_share)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(match_id: String, num_options: u8)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE + (num_options as usize * 8),
        seeds = [b"market", match_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Pool PDA for holding funds
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

    /// CHECK: Pool PDA for holding funds
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
        bump
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
    pub winning_ai: u8,
    pub total_pool: u64,
    pub num_options: u8,
    #[max_len(10)]
    pub option_pools: Vec<u64>,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub user: Pubkey,
    pub market: Pubkey,
    pub ai: u8,
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
    #[msg("Invalid AI index")]
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
