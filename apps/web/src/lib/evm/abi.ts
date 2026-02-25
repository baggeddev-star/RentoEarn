export const BILLBOARD_MARKET_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "CampaignAlreadyExists",
    type: "error"
  },
  {
    inputs: [],
    name: "CampaignNotExpired",
    type: "error"
  },
  {
    inputs: [],
    name: "CampaignNotFound",
    type: "error"
  },
  {
    inputs: [],
    name: "InsufficientDeposit",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidState",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidTimestamps",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" }
    ],
    name: "OwnableInvalidOwner",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" }
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error"
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error"
  },
  {
    inputs: [],
    name: "Unauthorized",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" }
    ],
    name: "CampaignAccepted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "CampaignClaimed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" },
      { indexed: true, internalType: "address", name: "sponsor", type: "address" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "duration", type: "uint256" }
    ],
    name: "CampaignCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "CampaignExpired",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "refundAmount", type: "uint256" },
      { indexed: true, internalType: "address", name: "sponsor", type: "address" }
    ],
    name: "CampaignHardCanceled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" },
      { indexed: false, internalType: "uint64", name: "startTs", type: "uint64" },
      { indexed: false, internalType: "uint64", name: "endTs", type: "uint64" }
    ],
    name: "CampaignLive",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "refundAmount", type: "uint256" }
    ],
    name: "CampaignRejected",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "CampaignVerifying",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "campaignExists",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "campaigns",
    outputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" },
      { internalType: "address", name: "sponsor", type: "address" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "duration", type: "uint256" },
      { internalType: "enum BillboardMarket.CampaignState", name: "state", type: "uint8" },
      { internalType: "uint64", name: "startTs", type: "uint64" },
      { internalType: "uint64", name: "endTs", type: "uint64" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "duration", type: "uint256" }
    ],
    name: "createCampaignAndDeposit",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "creatorAccept",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "creatorClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "creatorReject",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "campaignId", type: "uint256" },
          { internalType: "address", name: "sponsor", type: "address" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "duration", type: "uint256" },
          { internalType: "enum BillboardMarket.CampaignState", name: "state", type: "uint8" },
          { internalType: "uint64", name: "startTs", type: "uint64" },
          { internalType: "uint64", name: "endTs", type: "uint64" }
        ],
        internalType: "struct BillboardMarket.Campaign",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      { internalType: "address", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "platformHardCancelAndRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "platformSetExpired",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" },
      { internalType: "uint64", name: "startTs", type: "uint64" },
      { internalType: "uint64", name: "endTs", type: "uint64" }
    ],
    name: "platformSetLive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" }
    ],
    name: "platformSetVerifying",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newOwner", type: "address" }
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
