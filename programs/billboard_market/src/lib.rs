use anchor_lang::prelude::*;

declare_id!("79Za2f2rCStCvfTv74JPhDBS9BEW48mx9gNXaLvgFRdt");

#[program]
pub mod billboard_market {
    use super::*;

    /// Create a new campaign and deposit SOL to escrow.
    /// Sponsor signs this transaction.
    pub fn create_campaign_and_deposit(
        ctx: Context<CreateCampaignAndDeposit>,
        campaign_id: u64,
        creator: Pubkey,
        amount: u64,
        duration: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let vault = &mut ctx.accounts.vault;

        // Initialize campaign
        campaign.campaign_id = campaign_id;
        campaign.sponsor = ctx.accounts.sponsor.key();
        campaign.creator = creator;
        campaign.amount = amount;
        campaign.duration = duration;
        campaign.state = CampaignState::Deposited;
        campaign.start_ts = 0;
        campaign.end_ts = 0;
        campaign.bump = ctx.bumps.campaign;
        campaign.vault_bump = ctx.bumps.vault;

        // Transfer SOL from sponsor to vault
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.sponsor.key(),
            &vault.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.sponsor.to_account_info(),
                vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(CampaignCreated {
            campaign_id,
            sponsor: ctx.accounts.sponsor.key(),
            creator,
            amount,
            duration,
        });

        Ok(())
    }

    /// Creator accepts the campaign.
    /// Creator signs this transaction.
    pub fn creator_accept(ctx: Context<CreatorAction>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        require!(
            campaign.state == CampaignState::Deposited,
            BillboardError::InvalidState
        );
        require!(
            ctx.accounts.signer.key() == campaign.creator,
            BillboardError::Unauthorized
        );

        campaign.state = CampaignState::Approved;

        emit!(CampaignAccepted {
            campaign_id: campaign.campaign_id,
            creator: campaign.creator,
        });

        Ok(())
    }

    /// Creator rejects the campaign.
    /// Creator signs this transaction. Allows refund.
    pub fn creator_reject(ctx: Context<CreatorReject>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let vault = &ctx.accounts.vault;

        require!(
            campaign.state == CampaignState::Deposited,
            BillboardError::InvalidState
        );
        require!(
            ctx.accounts.signer.key() == campaign.creator,
            BillboardError::Unauthorized
        );

        // Transfer all SOL back to sponsor
        let vault_balance = vault.to_account_info().lamports();
        let rent_exempt = Rent::get()?.minimum_balance(0);
        let transfer_amount = vault_balance.saturating_sub(rent_exempt);

        if transfer_amount > 0 {
            **vault.to_account_info().try_borrow_mut_lamports()? -= transfer_amount;
            **ctx.accounts.sponsor.try_borrow_mut_lamports()? += transfer_amount;
        }

        campaign.state = CampaignState::CanceledHard;

        emit!(CampaignRejected {
            campaign_id: campaign.campaign_id,
            creator: campaign.creator,
            refund_amount: transfer_amount,
        });

        Ok(())
    }

    /// Platform sets campaign to verifying state.
    /// Platform authority signs this transaction.
    pub fn platform_set_verifying(ctx: Context<PlatformAction>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        require!(
            campaign.state == CampaignState::Approved,
            BillboardError::InvalidState
        );

        campaign.state = CampaignState::Verifying;

        emit!(CampaignVerifying {
            campaign_id: campaign.campaign_id,
        });

        Ok(())
    }

    /// Platform sets campaign to live state with timestamps.
    /// Platform authority signs this transaction.
    pub fn platform_set_live(
        ctx: Context<PlatformAction>,
        start_ts: i64,
        end_ts: i64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        require!(
            campaign.state == CampaignState::Verifying,
            BillboardError::InvalidState
        );
        require!(end_ts > start_ts, BillboardError::InvalidTimestamps);

        campaign.state = CampaignState::Live;
        campaign.start_ts = start_ts;
        campaign.end_ts = end_ts;

        emit!(CampaignLive {
            campaign_id: campaign.campaign_id,
            start_ts,
            end_ts,
        });

        Ok(())
    }

    /// Platform sets campaign to expired state.
    /// Platform authority signs this transaction.
    pub fn platform_set_expired(ctx: Context<PlatformAction>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        require!(
            campaign.state == CampaignState::Live,
            BillboardError::InvalidState
        );

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= campaign.end_ts,
            BillboardError::CampaignNotExpired
        );

        campaign.state = CampaignState::Expired;

        emit!(CampaignExpired {
            campaign_id: campaign.campaign_id,
        });

        Ok(())
    }

    /// Platform hard cancels campaign and refunds all SOL to sponsor.
    /// Platform authority signs this transaction.
    /// This is the HARD CANCEL - one strike and it's over.
    pub fn platform_hard_cancel_and_refund(ctx: Context<PlatformCancelAndRefund>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let vault = &ctx.accounts.vault;

        // Can only cancel from these states
        require!(
            matches!(
                campaign.state,
                CampaignState::Deposited
                    | CampaignState::Approved
                    | CampaignState::Verifying
                    | CampaignState::Live
            ),
            BillboardError::InvalidState
        );

        // Transfer ALL SOL back to sponsor - strict v1 rule
        let vault_balance = vault.to_account_info().lamports();
        let rent_exempt = Rent::get()?.minimum_balance(0);
        let transfer_amount = vault_balance.saturating_sub(rent_exempt);

        if transfer_amount > 0 {
            **vault.to_account_info().try_borrow_mut_lamports()? -= transfer_amount;
            **ctx.accounts.sponsor.try_borrow_mut_lamports()? += transfer_amount;
        }

        campaign.state = CampaignState::CanceledHard;

        emit!(CampaignHardCanceled {
            campaign_id: campaign.campaign_id,
            refund_amount: transfer_amount,
            sponsor: campaign.sponsor,
        });

        Ok(())
    }

    /// Creator claims funds after campaign expires.
    /// Creator signs this transaction.
    pub fn creator_claim(ctx: Context<CreatorClaim>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let vault = &ctx.accounts.vault;

        require!(
            campaign.state == CampaignState::Expired,
            BillboardError::InvalidState
        );
        require!(
            ctx.accounts.creator.key() == campaign.creator,
            BillboardError::Unauthorized
        );

        // Transfer all SOL to creator (no platform fee in v1)
        let vault_balance = vault.to_account_info().lamports();
        let rent_exempt = Rent::get()?.minimum_balance(0);
        let transfer_amount = vault_balance.saturating_sub(rent_exempt);

        if transfer_amount > 0 {
            **vault.to_account_info().try_borrow_mut_lamports()? -= transfer_amount;
            **ctx.accounts.creator.try_borrow_mut_lamports()? += transfer_amount;
        }

        campaign.state = CampaignState::Refunded; // Using Refunded as "funds transferred" state

        emit!(CampaignClaimed {
            campaign_id: campaign.campaign_id,
            creator: campaign.creator,
            amount: transfer_amount,
        });

        Ok(())
    }
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
#[instruction(campaign_id: u64)]
pub struct CreateCampaignAndDeposit<'info> {
    #[account(mut)]
    pub sponsor: Signer<'info>,

    #[account(
        init,
        payer = sponsor,
        space = 8 + Campaign::INIT_SPACE,
        seeds = [b"campaign", campaign_id.to_le_bytes().as_ref()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: Vault PDA to hold SOL
    #[account(
        mut,
        seeds = [b"vault", campaign_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatorAction<'info> {
    pub signer: Signer<'info>,

    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
pub struct CreatorReject<'info> {
    pub signer: Signer<'info>,

    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: Vault PDA holding SOL
    #[account(
        mut,
        seeds = [b"vault", campaign.campaign_id.to_le_bytes().as_ref()],
        bump = campaign.vault_bump
    )]
    pub vault: AccountInfo<'info>,

    /// CHECK: Sponsor to receive refund
    #[account(
        mut,
        constraint = sponsor.key() == campaign.sponsor @ BillboardError::InvalidSponsor
    )]
    pub sponsor: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct PlatformAction<'info> {
    pub platform_authority: Signer<'info>,

    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
pub struct PlatformCancelAndRefund<'info> {
    pub platform_authority: Signer<'info>,

    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: Vault PDA holding SOL
    #[account(
        mut,
        seeds = [b"vault", campaign.campaign_id.to_le_bytes().as_ref()],
        bump = campaign.vault_bump
    )]
    pub vault: AccountInfo<'info>,

    /// CHECK: Sponsor to receive refund
    #[account(
        mut,
        constraint = sponsor.key() == campaign.sponsor @ BillboardError::InvalidSponsor
    )]
    pub sponsor: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreatorClaim<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: Vault PDA holding SOL
    #[account(
        mut,
        seeds = [b"vault", campaign.campaign_id.to_le_bytes().as_ref()],
        bump = campaign.vault_bump
    )]
    pub vault: AccountInfo<'info>,
}

// ============================================================================
// State
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Campaign {
    pub campaign_id: u64,
    pub sponsor: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
    pub duration: u64,
    pub state: CampaignState,
    pub start_ts: i64,
    pub end_ts: i64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CampaignState {
    Deposited,
    Approved,
    Verifying,
    Live,
    Expired,
    Refunded,
    CanceledHard,
}

impl Default for CampaignState {
    fn default() -> Self {
        CampaignState::Deposited
    }
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum BillboardError {
    #[msg("Invalid state transition")]
    InvalidState,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid sponsor")]
    InvalidSponsor,
    #[msg("Invalid timestamps")]
    InvalidTimestamps,
    #[msg("Campaign has not expired yet")]
    CampaignNotExpired,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct CampaignCreated {
    pub campaign_id: u64,
    pub sponsor: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
    pub duration: u64,
}

#[event]
pub struct CampaignAccepted {
    pub campaign_id: u64,
    pub creator: Pubkey,
}

#[event]
pub struct CampaignRejected {
    pub campaign_id: u64,
    pub creator: Pubkey,
    pub refund_amount: u64,
}

#[event]
pub struct CampaignVerifying {
    pub campaign_id: u64,
}

#[event]
pub struct CampaignLive {
    pub campaign_id: u64,
    pub start_ts: i64,
    pub end_ts: i64,
}

#[event]
pub struct CampaignExpired {
    pub campaign_id: u64,
}

#[event]
pub struct CampaignHardCanceled {
    pub campaign_id: u64,
    pub refund_amount: u64,
    pub sponsor: Pubkey,
}

#[event]
pub struct CampaignClaimed {
    pub campaign_id: u64,
    pub creator: Pubkey,
    pub amount: u64,
}
