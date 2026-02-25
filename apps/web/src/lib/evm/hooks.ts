import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { BILLBOARD_MARKET_ABI, CONTRACT_ADDRESS } from './abi';

export function useCreateCampaign() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createCampaign = async (
    campaignId: bigint,
    creator: `0x${string}`,
    duration: bigint,
    amountEth: string
  ) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: BILLBOARD_MARKET_ABI,
      functionName: 'createCampaignAndDeposit',
      args: [campaignId, creator, duration],
      value: parseEther(amountEth),
    });
  };

  return {
    createCampaign,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCreatorAccept() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const accept = async (campaignId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: BILLBOARD_MARKET_ABI,
      functionName: 'creatorAccept',
      args: [campaignId],
    });
  };

  return { accept, hash, isPending, isConfirming, isSuccess, error };
}

export function useCreatorReject() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const reject = async (campaignId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: BILLBOARD_MARKET_ABI,
      functionName: 'creatorReject',
      args: [campaignId],
    });
  };

  return { reject, hash, isPending, isConfirming, isSuccess, error };
}

export function useCreatorClaim() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claim = async (campaignId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: BILLBOARD_MARKET_ABI,
      functionName: 'creatorClaim',
      args: [campaignId],
    });
  };

  return { claim, hash, isPending, isConfirming, isSuccess, error };
}
