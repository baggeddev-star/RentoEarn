// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BillboardMarket
 * @notice Escrow contract for X profile billboard rentals
 * @dev Platform authority can manage campaign states, funds held in contract
 */
contract BillboardMarket is Ownable, ReentrancyGuard {
    enum CampaignState {
        Deposited,
        Approved,
        Verifying,
        Live,
        Expired,
        Refunded,
        CanceledHard
    }

    struct Campaign {
        uint256 campaignId;
        address sponsor;
        address creator;
        uint256 amount;
        uint256 duration;
        CampaignState state;
        uint64 startTs;
        uint64 endTs;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => bool) public campaignExists;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed sponsor,
        address indexed creator,
        uint256 amount,
        uint256 duration
    );

    event CampaignAccepted(uint256 indexed campaignId, address indexed creator);
    
    event CampaignRejected(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 refundAmount
    );

    event CampaignVerifying(uint256 indexed campaignId);
    
    event CampaignLive(
        uint256 indexed campaignId,
        uint64 startTs,
        uint64 endTs
    );

    event CampaignExpired(uint256 indexed campaignId);
    
    event CampaignHardCanceled(
        uint256 indexed campaignId,
        uint256 refundAmount,
        address indexed sponsor
    );

    event CampaignClaimed(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    error CampaignAlreadyExists();
    error CampaignNotFound();
    error InvalidState();
    error Unauthorized();
    error InvalidTimestamps();
    error CampaignNotExpired();
    error InsufficientDeposit();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new campaign and deposit ETH to escrow
     * @param campaignId Unique campaign identifier
     * @param creator Address of the creator who will display the ad
     * @param duration Campaign duration in seconds
     */
    function createCampaignAndDeposit(
        uint256 campaignId,
        address creator,
        uint256 duration
    ) external payable nonReentrant {
        if (campaignExists[campaignId]) revert CampaignAlreadyExists();
        if (msg.value == 0) revert InsufficientDeposit();

        campaigns[campaignId] = Campaign({
            campaignId: campaignId,
            sponsor: msg.sender,
            creator: creator,
            amount: msg.value,
            duration: duration,
            state: CampaignState.Deposited,
            startTs: 0,
            endTs: 0
        });

        campaignExists[campaignId] = true;

        emit CampaignCreated(campaignId, msg.sender, creator, msg.value, duration);
    }

    /**
     * @notice Creator accepts the campaign
     * @param campaignId Campaign to accept
     */
    function creatorAccept(uint256 campaignId) external {
        Campaign storage campaign = _getCampaign(campaignId);
        
        if (campaign.state != CampaignState.Deposited) revert InvalidState();
        if (msg.sender != campaign.creator) revert Unauthorized();

        campaign.state = CampaignState.Approved;

        emit CampaignAccepted(campaignId, campaign.creator);
    }

    /**
     * @notice Creator rejects the campaign, refunding sponsor
     * @param campaignId Campaign to reject
     */
    function creatorReject(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = _getCampaign(campaignId);
        
        if (campaign.state != CampaignState.Deposited) revert InvalidState();
        if (msg.sender != campaign.creator) revert Unauthorized();

        uint256 refundAmount = campaign.amount;
        address sponsor = campaign.sponsor;
        
        campaign.state = CampaignState.CanceledHard;
        campaign.amount = 0;

        (bool success, ) = sponsor.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit CampaignRejected(campaignId, campaign.creator, refundAmount);
    }

    /**
     * @notice Platform sets campaign to verifying state
     * @param campaignId Campaign to update
     */
    function platformSetVerifying(uint256 campaignId) external onlyOwner {
        Campaign storage campaign = _getCampaign(campaignId);
        
        if (campaign.state != CampaignState.Approved) revert InvalidState();

        campaign.state = CampaignState.Verifying;

        emit CampaignVerifying(campaignId);
    }

    /**
     * @notice Platform sets campaign to live state with timestamps
     * @param campaignId Campaign to update
     * @param startTs Start timestamp
     * @param endTs End timestamp
     */
    function platformSetLive(
        uint256 campaignId,
        uint64 startTs,
        uint64 endTs
    ) external onlyOwner {
        Campaign storage campaign = _getCampaign(campaignId);
        
        if (campaign.state != CampaignState.Verifying) revert InvalidState();
        if (endTs <= startTs) revert InvalidTimestamps();

        campaign.state = CampaignState.Live;
        campaign.startTs = startTs;
        campaign.endTs = endTs;

        emit CampaignLive(campaignId, startTs, endTs);
    }

    /**
     * @notice Platform sets campaign to expired state
     * @param campaignId Campaign to update
     */
    function platformSetExpired(uint256 campaignId) external onlyOwner {
        Campaign storage campaign = _getCampaign(campaignId);
        
        if (campaign.state != CampaignState.Live) revert InvalidState();
        if (block.timestamp < campaign.endTs) revert CampaignNotExpired();

        campaign.state = CampaignState.Expired;

        emit CampaignExpired(campaignId);
    }

    /**
     * @notice Platform hard cancels campaign and refunds all ETH to sponsor
     * @param campaignId Campaign to cancel
     */
    function platformHardCancelAndRefund(uint256 campaignId) external onlyOwner nonReentrant {
        Campaign storage campaign = _getCampaign(campaignId);
        
        if (campaign.state == CampaignState.Refunded || 
            campaign.state == CampaignState.CanceledHard ||
            campaign.state == CampaignState.Expired) {
            revert InvalidState();
        }

        uint256 refundAmount = campaign.amount;
        address sponsor = campaign.sponsor;
        
        campaign.state = CampaignState.CanceledHard;
        campaign.amount = 0;

        if (refundAmount > 0) {
            (bool success, ) = sponsor.call{value: refundAmount}("");
            require(success, "Refund failed");
        }

        emit CampaignHardCanceled(campaignId, refundAmount, sponsor);
    }

    /**
     * @notice Creator claims funds after campaign expires
     * @param campaignId Campaign to claim
     */
    function creatorClaim(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = _getCampaign(campaignId);
        
        if (campaign.state != CampaignState.Expired) revert InvalidState();
        if (msg.sender != campaign.creator) revert Unauthorized();

        uint256 claimAmount = campaign.amount;
        
        campaign.state = CampaignState.Refunded;
        campaign.amount = 0;

        (bool success, ) = msg.sender.call{value: claimAmount}("");
        require(success, "Claim failed");

        emit CampaignClaimed(campaignId, campaign.creator, claimAmount);
    }

    /**
     * @notice Get campaign details
     * @param campaignId Campaign to query
     */
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        if (!campaignExists[campaignId]) revert CampaignNotFound();
        return campaigns[campaignId];
    }

    function _getCampaign(uint256 campaignId) internal view returns (Campaign storage) {
        if (!campaignExists[campaignId]) revert CampaignNotFound();
        return campaigns[campaignId];
    }
}
