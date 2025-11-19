import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  Swords,
  Trophy,
  Flame,
  Loader2,
  Clock,
  Users,
  Link as LinkIcon,
  Plus,
  CheckCircle,
  AlertCircle,
  Shield,
  X,
} from "lucide-react";
import { Link } from "react-router";
import {
  useGetBattles,
  useGetUserClaimableBattles,
  useChallengeBattle,
  useAcceptBattle,
  useAllocateNftsToBattle,
  useGetUserBattles,
  useGetBattleCooldown,
  useGetBattleCooldownDuration,
  useGetBattleDuration,
} from "@/hooks/contracts/useMemedBattle";
import { useAuthStore } from "@/store/auth";
import { useGetWarriorNFT } from "@/hooks/contracts/useMemedFactory";
import {
  useUserActiveNfts,
  useWarriorBalance,
} from "@/hooks/contracts/useMemedWarriorNFT";
import { useTokenHeat } from "@/hooks/contracts/useMemedFactory";
import top from "@/assets/images/battle-top.svg";
import bottom from "@/assets/images/battle-bottom.svg";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import { Search } from "lucide-react";

// Battle status enum matching contract
// 0 = NOT_STARTED (initial state, not used)
// 1 = CHALLENGED (challenge sent, awaiting acceptance)
// 2 = STARTED (battle active, NFT allocation happening)
// 3 = RESOLVED (battle completed, winner determined)
// 4 = DRAW (battle ended in a draw)
// 5 = REJECTED (challenge was rejected)
type BattleStatus = 0 | 1 | 2 | 3 | 4 | 5;

// Battle data structure from contract
interface Battle {
  battleId: bigint;
  memeA: `0x${string}`;
  memeB: `0x${string}`;
  memeANftsAllocated: bigint;
  memeBNftsAllocated: bigint;
  heatA: bigint;
  heatB: bigint;
  startTime: bigint;
  endTime: bigint;
  status: BattleStatus;
  winner: `0x${string}`;
  totalReward: bigint;
}

// Token data for selection
interface TokenData {
  address: `0x${string}`;
  name: string;
  ticker: string;
  image: string;
  creator: string;
  heat?: bigint;
  marketCap?: string;
}

// Visual Card Component for Selected Token
function TokenCard({
  token,
  onRemove,
}: {
  token: TokenData;
  onRemove?: () => void;
}) {
  // Fetch real-time heat for this token
  const { data: heatData } = useTokenHeat(token.address);
  const heat = heatData || token.heat || 0n;

  return (
    <div className="w-full max-w-sm bg-neutral-900 rounded-lg overflow-hidden shadow-xl flex flex-col justify-between p-2 relative">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 z-10 bg-neutral-800 hover:bg-red-900/40 border border-neutral-700 hover:border-red-500/50 rounded-full p-1.5 transition-all"
        >
          <X className="w-4 h-4 text-neutral-400 hover:text-red-400 transition-colors" />
        </button>
      )}

      <div className="h-72 flex items-center justify-center bg-neutral-800 rounded-lg overflow-hidden">
        <img
          src={token.image}
          alt={token.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="pb-3 pt-2">
        <div className="text-white font-bold text-lg mb-2 truncate">
          {token.name}
        </div>
        <div className="flex justify-between items-center text-xs gap-3">
          <div>
            <p className="text-gray-400 truncate">Created by {token.creator}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <div className="flex items-center gap-1">
              <Flame size={14} className="text-orange-500" />
              <span>{Number(heat).toLocaleString()}</span>
            </div>
            {token.marketCap && (
              <div>
                <span className="text-green-400">MC:</span>
                <span className="ml-1">{token.marketCap}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty Selection Slot Component
function EmptySlot({
  onClick,
  label = "Select meme to start Battle",
}: {
  onClick: () => void;
  label?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-full max-w-sm bg-neutral-900 rounded-2xl border-4 border-neutral-800 border-dashed shadow-2xl">
      <div
        className="flex flex-col items-center justify-center py-32 px-8 cursor-pointer transition-all duration-200 hover:bg-neutral-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <div
          className={`w-16 h-16 rounded-full border-2 border-neutral-500 flex items-center justify-center mb-6 transition-all duration-200 ${
            isHovered ? "border-neutral-400 scale-105" : ""
          }`}
        >
          <Plus
            size={24}
            className={`text-neutral-500 transition-colors duration-200 ${
              isHovered ? "text-neutral-400" : ""
            }`}
          />
        </div>

        <p
          className={`text-neutral-500 text-base font-medium transition-colors duration-200 text-center ${
            isHovered ? "text-neutral-400" : ""
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

export default function Battles() {
  const { address } = useAccount();
  const { user, isLoading: isLoadingUser } = useAuthStore();

  // Fetch all battles from contract with auto-refresh every 10 seconds
  const {
    data: battlesData,
    isLoading: isLoadingBattles,
    refetch: refetchBattles,
  } = useGetBattles();

  // Fetch user's claimable battles for rewards indicator
  const { data: claimableData } = useGetUserClaimableBattles(address);

  // Challenge battle hook
  const {
    challengeBattle,
    isPending: isChallengePending,
    isConfirming: isChallengeConfirming,
    isConfirmed: isChallengeConfirmed,
    error: challengeError,
  } = useChallengeBattle();

  // Accept battle hook
  const {
    acceptBattle,
    isPending: isAcceptPending,
    isConfirming: isAcceptConfirming,
    isConfirmed: isAcceptConfirmed,
    error: acceptError,
  } = useAcceptBattle();

  // Track which battle is being accepted to hide it immediately
  const [acceptingBattleId, setAcceptingBattleId] = useState<bigint | null>(
    null
  );
  const [acceptedBattleIds, setAcceptedBattleIds] = useState<Set<bigint>>(
    new Set()
  );

  // Track which battle is being rejected
  const [rejectingBattleId, setRejectingBattleId] = useState<bigint | null>(
    null
  );
  const [rejectedBattleIds, setRejectedBattleIds] = useState<Set<bigint>>(
    new Set()
  );

  // Battle filtering state
  const [statusFilter, setStatusFilter] = useState<"all" | BattleStatus>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Battle creation state - using TokenData instead of addresses
  const [selectedMemeA, setSelectedMemeA] = useState<TokenData | null>(null);
  const [selectedMemeB, setSelectedMemeB] = useState<TokenData | null>(null);

  // Token selection modal state
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"memeA" | "memeB" | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allTokens, setAllTokens] = useState<any[]>([]);
  const [isLoadingAllTokens, setIsLoadingAllTokens] = useState(false);

  // NFT Allocation state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocationBattle, setAllocationBattle] = useState<Battle | null>(null);
  const [supportingSide, setSupportingSide] = useState<
    "memeA" | "memeB" | null
  >(null);
  const [selectedNFTs, setSelectedNFTs] = useState<bigint[]>([]);

  // Battle Details Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBattle, setDetailsBattle] = useState<Battle | null>(null);

  // Countdown timer state - updates every second
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Allocate NFTs hook
  const {
    allocateNfts,
    isPending: isAllocatePending,
    isConfirming: isAllocateConfirming,
    isConfirmed: isAllocateConfirmed,
    error: allocateError,
  } = useAllocateNftsToBattle();

  // Get NFT address for selected allocation battle
  const supportedTokenAddress =
    supportingSide === "memeA"
      ? allocationBattle?.memeA
      : supportingSide === "memeB"
      ? allocationBattle?.memeB
      : undefined;

  const { data: nftAddress } = useGetWarriorNFT(supportedTokenAddress);

  // Fetch user's active NFTs for the supported token
  const { data: activeNFTs, isLoading: isLoadingNFTs } = useUserActiveNfts(
    nftAddress as `0x${string}`,
    address
  );

  // Fetch total NFT balance to show locked count
  const { data: totalBalance } = useWarriorBalance(
    nftAddress as `0x${string}`,
    address
  );

  // Calculate NFT counts
  const totalNFTs = totalBalance ? Number(totalBalance) : 0;
  const availableNFTs = activeNFTs?.length || 0;
  const lockedNFTs = totalNFTs - availableNFTs;

  // Parse battles data from contract response
  const battles: Battle[] = (battlesData as Battle[]) || [];

  // Filter battles by status
  const filteredBattles = battles.filter((battle) => {
    if (statusFilter === "all") return true;
    return battle.status === statusFilter;
  });

  // Paginate battles
  const totalPages = Math.ceil(filteredBattles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBattles = filteredBattles.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Handle successful battle creation
  useEffect(() => {
    if (isChallengeConfirmed) {
      // Refetch battles to show the new battle
      refetchBattles();
      // Reset form
      setSelectedMemeA(null);
      setSelectedMemeB(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChallengeConfirmed]);

  // Handle successful battle acceptance
  useEffect(() => {
    if (isAcceptConfirmed && acceptingBattleId !== null) {
      // Add to accepted battles set to hide from pending challenges
      setAcceptedBattleIds((prev) => new Set(prev).add(acceptingBattleId));
      // Refetch battles to update battle status from Pending to Active
      refetchBattles();
      // Reset accepting battle ID after a delay to allow UI to update
      setTimeout(() => setAcceptingBattleId(null), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAcceptConfirmed, acceptingBattleId]);

  // Handle successful battle rejection
  useEffect(() => {
    if (isAcceptConfirmed && rejectingBattleId !== null) {
      // Add to rejected battles set to hide from pending challenges
      setRejectedBattleIds((prev) => new Set(prev).add(rejectingBattleId));
      // Refetch battles to update battle status
      refetchBattles();
      // Reset rejecting battle ID after a delay to allow UI to update
      setTimeout(() => setRejectingBattleId(null), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAcceptConfirmed, rejectingBattleId]);

  // Reset accepting/rejecting battle ID on error
  useEffect(() => {
    if (acceptError) {
      setAcceptingBattleId(null);
      setRejectingBattleId(null);
    }
  }, [acceptError]);

  // Handle successful NFT allocation
  useEffect(() => {
    if (isAllocateConfirmed) {
      // Refetch battles to update NFT counts
      refetchBattles();
      // Reset allocation state
      setSelectedNFTs([]);
      setShowAllocateModal(false);
      setAllocationBattle(null);
      setSupportingSide(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllocateConfirmed]);

  // Real-time countdown timer - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch all tokens when selecting opponent (Meme B)
  useEffect(() => {
    const fetchAllTokens = async () => {
      if (showTokenSelector && selectingFor === "memeB") {
        setIsLoadingAllTokens(true);
        try {
          const response = await apiClient.get<{ tokens: any[] }>(
            API_ENDPOINTS.TOKENS
          );
          setAllTokens(response.data.tokens || []);
        } catch (error) {
          console.error("Failed to fetch all tokens:", error);
          setAllTokens([]);
        } finally {
          setIsLoadingAllTokens(false);
        }
      }
    };

    fetchAllTokens();
  }, [showTokenSelector, selectingFor]);

  // Handle opening token selector
  const handleOpenTokenSelector = (forSlot: "memeA" | "memeB") => {
    setSelectingFor(forSlot);
    setShowTokenSelector(true);
  };

  // Handle token selection from modal
  const handleSelectToken = (token: TokenData) => {
    if (selectingFor === "memeA") {
      // Prevent selecting same token for both A and B
      if (selectedMemeB && selectedMemeB.address === token.address) {
        alert(
          "This token is already selected for Meme B. Please choose a different token."
        );
        return;
      }
      setSelectedMemeA(token);
    } else if (selectingFor === "memeB") {
      // Prevent selecting same token for both A and B
      if (selectedMemeA && selectedMemeA.address === token.address) {
        alert(
          "This token is already selected for Meme A. Please choose a different token."
        );
        return;
      }
      setSelectedMemeB(token);
    }
    setShowTokenSelector(false);
    setSelectingFor(null);
  };

  // Handle battle creation
  const handleCreateBattle = () => {
    if (!selectedMemeA || !selectedMemeB) {
      return;
    }

    challengeBattle(selectedMemeA.address, selectedMemeB.address);
  };

  // Open NFT allocation modal
  const handleOpenAllocation = (battle: Battle, side: "memeA" | "memeB") => {
    setAllocationBattle(battle);
    setSupportingSide(side);
    setSelectedNFTs([]);
    setShowAllocateModal(true);
  };

  // Handle NFT selection toggle
  const toggleNFTSelection = (nftId: bigint) => {
    setSelectedNFTs((prev) =>
      prev.includes(nftId)
        ? prev.filter((id) => id !== nftId)
        : [...prev, nftId]
    );
  };

  // Handle NFT allocation
  const handleAllocateNFTs = () => {
    if (
      !allocationBattle ||
      !address ||
      !supportingSide ||
      selectedNFTs.length === 0
    ) {
      return;
    }

    const supportedMeme =
      supportingSide === "memeA"
        ? allocationBattle.memeA
        : allocationBattle.memeB;

    allocateNfts({
      battleId: allocationBattle.battleId,
      user: address,
      supportedMeme,
      nftsIds: selectedNFTs,
    });
  };

  // Check if a token is in an active battle or cooldown
  // Returns battle info if in battle, null otherwise
  const getTokenBattleStatus = (tokenAddress: `0x${string}`) => {
    return battles.find(
      (battle) =>
        (battle.memeA.toLowerCase() === tokenAddress.toLowerCase() ||
          battle.memeB.toLowerCase() === tokenAddress.toLowerCase()) &&
        (battle.status === 1 || battle.status === 2) // CHALLENGED or STARTED
    );
  };

  // Legacy function for backwards compatibility
  const isTokenInBattle = (tokenAddress: `0x${string}`): boolean => {
    return !!getTokenBattleStatus(tokenAddress);
  };

  // Get list of tokens created by the current user that can challenge
  // Permission: Only token creators can initiate battles
  const availableTokens =
    user?.token?.filter(
      (t) =>
        t.address &&
        t.userId === user.id && // Check if user is the creator
        !isTokenInBattle(t.address as `0x${string}`)
    ) || [];

  // Get all token addresses created by the user (for checking pending challenges)
  const userTokenAddresses =
    user?.token
      ?.filter((t) => t.userId === user.id)
      .map((t) => t.address?.toLowerCase()) || [];

  // Get pending challenges to the user's tokens (where user's token is challenged - Meme B)
  // Exclude battles that are being accepted, rejected, or have been accepted/rejected
  const pendingChallenges = battles.filter(
    (battle) =>
      battle.status === 1 && // CHALLENGED status
      userTokenAddresses.includes(battle.memeB.toLowerCase()) &&
      !acceptedBattleIds.has(battle.battleId) && // Not already accepted
      !rejectedBattleIds.has(battle.battleId) // Not already rejected
  );

  // Handler for accepting a battle
  const handleAcceptBattle = (battleId: bigint) => {
    setAcceptingBattleId(battleId);
    acceptBattle(battleId, true);
  };

  // Handler for rejecting a battle
  const handleRejectBattle = (battleId: bigint) => {
    setRejectingBattleId(battleId);
    acceptBattle(battleId, false);
  };

  // Helper to get status label
  const getStatusLabel = (status: BattleStatus): string => {
    switch (status) {
      case 0:
        return "Not Started";
      case 1:
        return "Challenged";
      case 2:
        return "Active";
      case 3:
        return "Resolved";
      case 4:
        return "Draw";
      case 5:
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  // Helper to get status color
  const getStatusColor = (status: BattleStatus): string => {
    switch (status) {
      case 0:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500";
      case 1:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case 2:
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case 3:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500";
      case 4:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case 5:
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500";
    }
  };

  // Helper to format time remaining (uses real-time currentTime state)
  const getTimeRemaining = (endTime: bigint): string => {
    const end = Number(endTime);
    const remaining = end - currentTime;

    if (remaining <= 0) return "Ended";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Open battle details modal
  const handleOpenDetails = (battle: Battle) => {
    setDetailsBattle(battle);
    setShowDetailsModal(true);
  };

  // Calculate battle score (Heat 60% + NFTs 40%)
  const calculateBattleScore = (heat: bigint, nfts: bigint): number => {
    const heatScore = Number(heat) * 0.6;
    const nftScore = Number(nfts) * 0.4;
    return heatScore + nftScore;
  };

  // State to hold token details map
  const [tokenDetailsMap, setTokenDetailsMap] = useState<
    Record<
      string,
      { name: string; ticker: string; image: string; address: string }
    >
  >({});

  // Effect to initialize token details when user data or battles load
  useEffect(() => {
    let cancelled = false; // To prevent state updates on unmounted components

    const buildTokenDetailsMap = async () => {
      const newTokenDetailsMap: Record<
        string,
        { name: string; ticker: string; image: string; address: `0x${string}` }
      > = {};

      // Add user's tokens first
      if (user?.token && !cancelled) {
        user.token.forEach((token) => {
          if (token.address && !cancelled) {
            const addressKey = token.address.toLowerCase();
            newTokenDetailsMap[addressKey] = {
              name:
                token.metadata?.name ||
                `${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
              ticker: token.metadata?.ticker || "???",
              image:
                token.image?.s3Key || (token.metadata as any)?.imageKey || "",
              address: token.address as `0x${string}`,
            };
          }
        });
      }

      // Combine all unique token addresses from battles to fetch additional details
      if (battles && battles.length > 0 && !cancelled) {
        const uniqueAddresses = new Set<string>();
        battles.forEach((battle) => {
          if (battle.memeA) uniqueAddresses.add(battle.memeA.toLowerCase());
          if (battle.memeB) uniqueAddresses.add(battle.memeB.toLowerCase());
        });

        // Fetch details for tokens not in user's token list
        for (const address of uniqueAddresses) {
          if (cancelled) break;
          const addressKey = address.toLowerCase();
          console.log(addressKey);
          if (!newTokenDetailsMap[addressKey]) {
            try {
              // Try to fetch token details by address from the API
              console.log(
                `Fetching token by address: /api/token-by-address/${address}`
              );
              const response = await apiClient.get(
                `/api/token-by-address/${address}`
              );
              const responseData = response.data as any;

              if (
                responseData &&
                responseData.metadata &&
                typeof responseData.metadata === "object" &&
                !cancelled
              ) {
                const tokenMetadata = responseData.metadata as {
                  name?: string;
                  ticker?: string;
                  imageKey?: string;
                };
                console.log(
                  `Successfully fetched token ${address} by address:`,
                  responseData
                );
                newTokenDetailsMap[addressKey] = {
                  name:
                    tokenMetadata.name ||
                    `${address.slice(0, 6)}...${address.slice(-4)}`,
                  ticker: tokenMetadata.ticker || "???",
                  image: tokenMetadata.imageKey || "",
                  address: responseData.address || (address as `0x${string}`),
                };
              } else if (!cancelled) {
                console.log(`Token ${address} not found via direct API call`);
              }
            } catch (error) {
              if (cancelled) return;
              // Fallback to fetching all tokens and filtering
              try {
                const allTokensResponse = await apiClient.get("/api/tokens");
                console.log(
                  "Fetching all tokens from /api/tokens endpoint:",
                  allTokensResponse
                );
                // Type assertion for the response data
                const allTokensData = allTokensResponse.data as
                  | { tokens?: any[] }
                  | any[];
                const allTokens = Array.isArray(allTokensData)
                  ? allTokensData
                  : allTokensData &&
                    "tokens" in allTokensData &&
                    Array.isArray(allTokensData.tokens)
                  ? allTokensData.tokens
                  : [];
                console.log(
                  "Fetched all tokens from /tokens endpoint:",
                  allTokens
                );
                const tokenData = allTokens.find((t: any) => {
                  // Type guard to check if the token object has an address property
                  return (
                    t &&
                    typeof t === "object" &&
                    "address" in t &&
                    t.address &&
                    typeof t.address === "string" &&
                    t.address.toLowerCase() === addressKey
                  );
                });

                if (
                  tokenData &&
                  tokenData.metadata &&
                  typeof tokenData.metadata === "object" &&
                  !cancelled
                ) {
                  const tokenMetadata = tokenData.metadata as {
                    name?: string;
                    ticker?: string;
                    imageKey?: string;
                  };
                  console.log(
                    `Found token ${address} in all tokens:`,
                    tokenData
                  );
                  newTokenDetailsMap[addressKey] = {
                    name:
                      tokenMetadata.name ||
                      `${address.slice(0, 6)}...${address.slice(-4)}`,
                    ticker: tokenMetadata.ticker || "???",
                    image: tokenMetadata.imageKey || "",
                    address: tokenData.address || (address as `0x${string}`),
                  };
                } else if (!cancelled) {
                  console.log(`Token ${address} not found in all tokens`);
                  // If all methods fail, use address as fallback
                  newTokenDetailsMap[addressKey] = {
                    name: `${address.slice(0, 6)}...${address.slice(-4)}`,
                    ticker: "???",
                    image: "",
                    address: address as `0x${string}`,
                  };
                }
              } catch (fallbackError) {
                if (!cancelled) {
                  // If everything fails, use address as fallback
                  newTokenDetailsMap[addressKey] = {
                    name: `${address.slice(0, 6)}...${address.slice(-4)}`,
                    ticker: "???",
                    image: "",
                    address: address as `0x${string}`,
                  };
                }
              }
            }
          }
        }
      }

      if (!cancelled) {
        setTokenDetailsMap(newTokenDetailsMap);
      }
    };

    buildTokenDetailsMap();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, battles]);

  // Synchronous helper function to get token details by address
  const getTokenDetails = useCallback(
    (address: `0x${string}`) => {
      const addressKey = address.toLowerCase();

      // First, try to find in the token details map
      if (tokenDetailsMap[addressKey]) {
        return tokenDetailsMap[addressKey];
      }

      // If not found in the map, return address as fallback
      return {
        name: `${address.slice(0, 6)}...${address.slice(-4)}`,
        ticker: "???",
        image: "",
        address: address,
      };
    },
    [tokenDetailsMap]
  );

  return (
    <div className="min-h-screen text-white">
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Wallet connection check */}
        {!address ? (
          <div className="max-w-4xl mx-auto bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-4 rounded-lg text-center">
            ⚠️ Please connect your wallet to participate in battles
          </div>
        ) : null}

        {/* Top Decorative SVG */}
        <div className="flex items-center justify-between w-full">
          <img src={top} alt="" className="w-full" />
        </div>

        {/* Token Selection Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 xl:gap-32 justify-items-center max-w-6xl mx-auto">
          {/* Meme A Selection */}
          {selectedMemeA ? (
            <TokenCard
              token={selectedMemeA}
              onRemove={() => setSelectedMemeA(null)}
            />
          ) : (
            <EmptySlot
              onClick={() => handleOpenTokenSelector("memeA")}
              label="Select first meme"
            />
          )}

          {/* Meme B Selection */}
          {selectedMemeB ? (
            <TokenCard
              token={selectedMemeB}
              onRemove={() => setSelectedMemeB(null)}
            />
          ) : (
            <EmptySlot
              onClick={() => handleOpenTokenSelector("memeB")}
              label="Select meme to start Battle"
            />
          )}
        </div>

        {/* Bottom Decorative SVG with Start Battle Button */}
        <div className="flex items-center justify-between w-full relative py-10">
          <img src={bottom} alt="" className="w-full" />

          <button
            onClick={handleCreateBattle}
            disabled={
              !selectedMemeA ||
              !selectedMemeB ||
              isChallengePending ||
              isChallengeConfirming ||
              !address
            }
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-t from-primary-900 to-black text-white px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform cursor-pointer font-semibold"
          >
            {isChallengePending || isChallengeConfirming ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {isChallengePending ? "Confirm..." : "Creating..."}
              </div>
            ) : (
              "START BATTLE"
            )}
          </button>
        </div>

        {/* Success/Error Messages */}
        {isChallengeConfirmed && (
          <div className="max-w-4xl mx-auto bg-green-500/10 border border-green-500 text-green-400 p-4 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Battle created successfully!</span>
          </div>
        )}

        {challengeError && (
          <div className="max-w-4xl mx-auto bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>
              Error: {challengeError.message || "Failed to create battle"}
            </span>
          </div>
        )}

        {/* Pending Challenges Section - Show challenges to user's tokens */}
        {pendingChallenges.length > 0 && address && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Swords className="w-6 h-6 text-yellow-400" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Challenges to Your Tokens
                    <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-bold px-2 py-1 rounded-full">
                      {pendingChallenges.length}
                    </span>
                  </h2>
                  <p className="text-neutral-300 text-sm">
                    Your tokens have been challenged to battle. Accept or ignore
                    to let them expire.
                  </p>
                </div>
              </div>

              {/* Accept Success/Error Messages */}
              {isAcceptConfirmed && (
                <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Battle accepted successfully!</span>
                </div>
              )}
              {acceptError && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Error: {acceptError.message || "Failed to accept battle"}
                  </span>
                </div>
              )}

              {/* Pending Challenges List */}
              <div className="space-y-3">
                {pendingChallenges.map((battle) => (
                  <div
                    key={Number(battle.battleId)}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-yellow-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex flex-col items-center">
                            {(() => {
                              const challengerDetails = getTokenDetails(
                                battle.memeA
                              );

                              return (
                                <div>
                                  {challengerDetails.image ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden mb-1">
                                      <img
                                        src={challengerDetails.image}
                                        alt={challengerDetails.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (
                                            e.target as HTMLImageElement
                                          ).style.display = "none";
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-neutral-700 flex items-center justify-center mb-1 text-xs">
                                      {challengerDetails.name.substring(0, 3)}
                                    </div>
                                  )}
                                  <p className="text-xs text-neutral-500">
                                    Challenger
                                  </p>
                                  <p className="text-white font-semibold text-sm max-w-[80px] truncate">
                                    {challengerDetails.name}
                                  </p>
                                  <p className="text-white font-mono text-xs">
                                    {battle.memeA.slice(0, 6)}...
                                    {battle.memeA.slice(-4)}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                          <span className="text-red-500 font-bold text-lg">
                            VS
                          </span>
                          <div className="flex flex-col items-center">
                            {(() => {
                              const yourTokenDetails = getTokenDetails(
                                battle.memeB
                              );
                              return (
                                <div>
                                  {yourTokenDetails.image ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden mb-1">
                                      <img
                                        src={yourTokenDetails.image}
                                        alt={yourTokenDetails.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (
                                            e.target as HTMLImageElement
                                          ).style.display = "none";
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-neutral-700 flex items-center justify-center mb-1 text-xs">
                                      {yourTokenDetails.name.substring(0, 3)}
                                    </div>
                                  )}
                                  <p className="text-xs text-neutral-500">
                                    Challenged
                                  </p>
                                  <p className="text-white font-semibold text-sm max-w-[80px] truncate">
                                    {yourTokenDetails.name}
                                  </p>
                                  <p className="text-white font-mono text-xs">
                                    {battle.memeB.slice(0, 6)}...
                                    {battle.memeB.slice(-4)}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Battle #{Number(battle.battleId)}
                          </span>
                          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/30">
                            Pending
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptBattle(battle.battleId)}
                          disabled={
                            (acceptingBattleId === battle.battleId ||
                              rejectingBattleId === battle.battleId) &&
                            (isAcceptPending || isAcceptConfirming)
                          }
                          className="cursor-pointer bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 hover:border-green-500/60 disabled:bg-neutral-800 disabled:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 text-green-400 px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2"
                        >
                          {acceptingBattleId === battle.battleId &&
                          (isAcceptPending || isAcceptConfirming) ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {isAcceptPending ? "Confirm..." : "Accepting..."}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectBattle(battle.battleId)}
                          disabled={
                            (acceptingBattleId === battle.battleId ||
                              rejectingBattleId === battle.battleId) &&
                            (isAcceptPending || isAcceptConfirming)
                          }
                          className="cursor-pointer bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 disabled:bg-neutral-800 disabled:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 text-red-400 px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2"
                        >
                          {rejectingBattleId === battle.battleId &&
                          (isAcceptPending || isAcceptConfirming) ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {isAcceptPending ? "Confirm..." : "Rejecting..."}
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rewards Indicator Banner */}
        {claimableData && claimableData[2] > 0n && (
          <div className="max-w-6xl mx-auto bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Battle Rewards Available!
                  </h3>
                </div>
                <p className="text-neutral-300 text-sm">
                  You have {claimableData[0].length} battle reward
                  {claimableData[0].length === 1 ? "" : "s"} to claim worth{" "}
                  {formatEther(claimableData[2])} tokens
                </p>
              </div>
              <Link
                to="/app/rewards"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Claim Rewards
                <LinkIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Existing Battles Section */}
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Swords className="w-6 h-6 text-red-500" />
              Active Battles
            </h2>
          </div>

          {/* Battle Status Filter Tabs */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-green-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              All Battles ({battles.length})
            </button>
            <button
              onClick={() => setStatusFilter(2)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 2
                  ? "bg-green-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              Active ({battles.filter((b) => b.status === 2).length})
            </button>
            <button
              onClick={() => setStatusFilter(1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 1
                  ? "bg-green-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              Pending ({battles.filter((b) => b.status === 1).length})
            </button>
            <button
              onClick={() => setStatusFilter(3)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 3
                  ? "bg-green-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              Completed ({battles.filter((b) => b.status === 3).length})
            </button>
            <button
              onClick={() => setStatusFilter(4)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 4
                  ? "bg-green-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              Draw ({battles.filter((b) => b.status === 4).length})
            </button>
            <button
              onClick={() => setStatusFilter(5)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 5
                  ? "bg-green-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              Rejected ({battles.filter((b) => b.status === 5).length})
            </button>
          </div>

          {/* Battles Grid - Loading State */}
          {isLoadingBattles && !battlesData ? (
            <div className="flex flex-col items-center justify-center py-12 bg-neutral-900 rounded-lg border border-neutral-800">
              <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
              <p className="text-neutral-400">Loading battles...</p>
            </div>
          ) : filteredBattles.length === 0 ? (
            // Empty State
            <div className="text-center py-12 bg-neutral-900 rounded-lg border border-neutral-800">
              <Swords className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No {statusFilter !== "all" ? getStatusLabel(statusFilter) : ""}{" "}
                Battles Found
              </h3>
              <p className="text-neutral-400 mb-6">
                {statusFilter !== "all"
                  ? `There are no ${getStatusLabel(
                      statusFilter
                    ).toLowerCase()} battles at the moment.`
                  : "No battles have been created yet. Be the first to start a battle!"}
              </p>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  View All Battles
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Battles Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {paginatedBattles.map((battle) => {
                  // Get border color based on status
                  const borderColor =
                    battle.status === 1
                      ? "border-yellow-500/30 hover:border-yellow-500/50" // CHALLENGED (Pending)
                      : battle.status === 2
                      ? "border-green-500/30 hover:border-green-500/50" // STARTED (Active)
                      : "border-neutral-800 hover:border-neutral-700"; // NOT_STARTED or RESOLVED

                  return (
                    <div
                      key={Number(battle.battleId)}
                      className={`bg-neutral-900 border rounded-lg p-6 transition-colors ${borderColor}`}
                    >
                      {/* Battle Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Swords className="w-5 h-5 text-red-500" />
                          <span className="text-neutral-400 text-sm">
                            Battle #{Number(battle.battleId)}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(
                            battle.status
                          )}`}
                        >
                          {getStatusLabel(battle.status)}
                        </span>
                      </div>

                      {/* Battle Participants */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {/* Meme A */}
                        <div className="text-center">
                          {(() => {
                            const tokenDetails = getTokenDetails(battle.memeA);
                            return (
                              <div>
                                {tokenDetails.image ? (
                                  <div className="mx-auto mb-2 w-16 h-16 rounded-lg overflow-hidden">
                                    <img
                                      src={tokenDetails.image}
                                      alt={tokenDetails.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="mx-auto mb-2 w-16 h-16 rounded-lg bg-neutral-700 flex items-center justify-center text-xs">
                                    {tokenDetails.name.substring(0, 3)}
                                  </div>
                                )}
                                <div className="bg-neutral-800 rounded-lg p-3 mb-2">
                                  <p className="text-xs text-neutral-500 mb-1">
                                    {tokenDetails.name}
                                  </p>
                                  <p className="text-white font-mono text-xs truncate">
                                    {battle.memeA.slice(0, 6)}...
                                    {battle.memeA.slice(-4)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    <span className="text-neutral-400">
                                      {Number(battle.heatA).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <Users className="w-3 h-3 text-blue-400" />
                                    <span className="text-neutral-400">
                                      {Number(battle.memeANftsAllocated)} NFTs
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* VS */}
                        <div className="flex items-center justify-center">
                          <span className="text-2xl font-bold text-red-500">
                            VS
                          </span>
                        </div>

                        {/* Meme B */}
                        <div className="text-center">
                          {(() => {
                            const tokenDetails = getTokenDetails(battle.memeB);
                            return (
                              <div>
                                {tokenDetails.image ? (
                                  <div className="mx-auto mb-2 w-16 h-16 rounded-lg overflow-hidden">
                                    <img
                                      src={tokenDetails.image}
                                      alt={tokenDetails.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="mx-auto mb-2 w-16 h-16 rounded-lg bg-neutral-700 flex items-center justify-center text-xs">
                                    {tokenDetails.name.substring(0, 3)}
                                  </div>
                                )}
                                <div className="bg-neutral-800 rounded-lg p-3 mb-2">
                                  <p className="text-xs text-neutral-500 mb-1">
                                    {tokenDetails.name}
                                  </p>
                                  <p className="text-white font-mono text-xs truncate">
                                    {battle.memeB.slice(0, 6)}...
                                    {battle.memeB.slice(-4)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    <span className="text-neutral-400">
                                      {Number(battle.heatB).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <Users className="w-3 h-3 text-blue-400" />
                                    <span className="text-neutral-400">
                                      {Number(battle.memeBNftsAllocated)} NFTs
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Battle Progress Bar (for active battles) */}
                      {battle.status === 2 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-neutral-400 mb-2">
                            <span>Meme A</span>
                            <span>Meme B</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                              style={{
                                width: `${
                                  battle.heatA + battle.heatB > 0n
                                    ? (Number(battle.heatA) /
                                        Number(battle.heatA + battle.heatB)) *
                                      100
                                    : 50
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Battle Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800 gap-2">
                        {battle.status === 2 && (
                          <div className="flex items-center gap-2 text-sm text-neutral-400">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(battle.endTime)}</span>
                          </div>
                        )}
                        {battle.status === 3 &&
                          battle.winner !==
                            ("0x0000000000000000000000000000000000000000" as `0x${string}`) && (
                            <div className="flex items-center gap-2 text-sm text-green-400">
                              <Trophy className="w-4 h-4" />
                              <span>
                                Winner: {battle.winner.slice(0, 6)}...
                                {battle.winner.slice(-4)}
                              </span>
                            </div>
                          )}
                        <div className="ml-auto flex gap-2">
                          {/* Allocate NFTs button for active battles */}
                          {battle.status === 2 && address && (
                            <div className="flex gap-1">
                              {(() => {
                                const memeADetails = getTokenDetails(
                                  battle.memeA
                                );
                                const memeBDetails = getTokenDetails(
                                  battle.memeB
                                );
                                return (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleOpenAllocation(battle, "memeA")
                                      }
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                                      title={`Support ${memeADetails.name}`}
                                    >
                                      Support {memeADetails.name}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenAllocation(battle, "memeB")
                                      }
                                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                                      title={`Support ${memeBDetails.name}`}
                                    >
                                      Support {memeBDetails.name}
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          <button
                            onClick={() => handleOpenDetails(battle)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-neutral-400">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredBattles.length)} of{" "}
                    {filteredBattles.length} battles
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      ← Prev
                    </button>
                    <span className="text-neutral-400 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* End Existing Battles Section */}

        {/* Token Selector Modal */}
        {showTokenSelector && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">
                      {selectingFor === "memeA"
                        ? "Select Your Token"
                        : "Search Opponent Token"}
                    </h2>
                    <p className="text-sm text-neutral-400">
                      {selectingFor === "memeA"
                        ? "Choose one of your tokens to battle"
                        : "Search and select any token to challenge"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTokenSelector(false);
                      setSelectingFor(null);
                      setSearchQuery("");
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Search Bar - Show for both Meme A and Meme B selection */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={
                      selectingFor === "memeA"
                        ? "Search your tokens by name, ticker, or address..."
                        : "Search all tokens by name, ticker, or address..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-green-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Token Grid */}
              <div className="p-6">
                {(
                  selectingFor === "memeA" ? isLoadingUser : isLoadingAllTokens
                ) ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                    <p className="text-neutral-400">
                      {selectingFor === "memeA"
                        ? "Loading your tokens..."
                        : "Loading all tokens..."}
                    </p>
                  </div>
                ) : (
                  (() => {
                    // Get the appropriate token list based on selection
                    const tokenList =
                      selectingFor === "memeA" ? availableTokens : allTokens;

                    // Filter tokens based on search query (only for Meme B)
                    const filteredTokens =
                      selectingFor === "memeB" && searchQuery
                        ? tokenList.filter((token) => {
                            const query = searchQuery.toLowerCase();
                            return (
                              token.metadata?.name
                                ?.toLowerCase()
                                .includes(query) ||
                              token.metadata?.ticker
                                ?.toLowerCase()
                                .includes(query) ||
                              token.address?.toLowerCase().includes(query)
                            );
                          })
                        : tokenList;

                    if (filteredTokens.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <AlertCircle className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {searchQuery
                              ? "No Tokens Found"
                              : "No Available Tokens"}
                          </h3>
                          <p className="text-neutral-400 text-sm mb-4">
                            {searchQuery
                              ? `No tokens match "${searchQuery}"`
                              : selectingFor === "memeA"
                              ? "You haven't launched any tokens yet, or they're all currently in battles."
                              : "No tokens available to challenge."}
                          </p>
                          {!searchQuery && selectingFor === "memeA" && (
                            <Link
                              to="/app/launch"
                              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                            >
                              Launch a Token
                            </Link>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTokens.map((token) => {
                          // Get image using correct priority: token.image.s3Key > metadata.imageKey > fallback
                          const imageUrl =
                            token.image?.s3Key ||
                            (token.metadata as any)?.imageKey ||
                            "";

                          const tokenData: TokenData = {
                            address: token.address as `0x${string}`,
                            name: token.metadata?.name || "Unnamed Token",
                            ticker: token.metadata?.ticker || "???",
                            image: imageUrl,
                            creator: token.userId
                              ? `${token.userId.slice(
                                  0,
                                  6
                                )}...${token.userId.slice(-4)}`
                              : "Unknown",
                          };

                          // Check if token is already selected for the opposite slot
                          const isAlreadySelected =
                            (selectingFor === "memeA" &&
                              selectedMemeB?.address === token.address) ||
                            (selectingFor === "memeB" &&
                              selectedMemeA?.address === token.address);

                          // Check if user would be creating a battle between their own tokens
                          const isSameToken =
                            selectingFor === "memeB" &&
                            selectedMemeA &&
                            selectedMemeA.address === token.address;

                          // Check if user is trying to create a battle between two of their own tokens
                          const isOwnTokenBattle =
                            selectingFor === "memeB" && // When selecting for Meme B
                            selectedMemeA && // And Meme A is already selected
                            user?.token?.some(
                              (t) =>
                                t.address === selectedMemeA.address &&
                                t.userId === user.id
                            ) && // Meme A is user's token
                            user?.token?.some(
                              (t) =>
                                t.address === token.address &&
                                t.userId === user.id
                            ); // Meme B is also user's token

                          // Check if token is in battle/cooldown
                          const battleStatus = getTokenBattleStatus(
                            token.address as `0x${string}`
                          );
                          const inBattle = !!battleStatus;
                          const isDisabled = Boolean(
                            inBattle ||
                              isAlreadySelected ||
                              isSameToken ||
                              isOwnTokenBattle
                          );

                          return (
                            <button
                              key={token.id}
                              onClick={() =>
                                !isDisabled && handleSelectToken(tokenData)
                              }
                              disabled={isDisabled}
                              title={
                                isDisabled
                                  ? isSameToken
                                    ? "This token is already selected"
                                    : isOwnTokenBattle
                                    ? "Cannot battle against your own token"
                                    : inBattle
                                    ? "Token is currently in a battle"
                                    : ""
                                  : undefined
                              }
                              className={`bg-neutral-800 rounded-xl p-4 border-2 transition-all relative ${
                                isDisabled
                                  ? "border-neutral-700 opacity-50 cursor-not-allowed"
                                  : "border-neutral-700 hover:border-green-500 cursor-pointer group"
                              }`}
                            >
                              {/* Cooldown/Battle Badge */}
                              {inBattle && (
                                <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-2 py-1 rounded flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  In Battle
                                </div>
                              )}
                              <div className="aspect-square w-full bg-neutral-700 rounded-lg overflow-hidden mb-3">
                                {tokenData.image ? (
                                  <img
                                    src={tokenData.image}
                                    alt={tokenData.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-4xl">
                                    🎭
                                  </div>
                                )}
                              </div>
                              <h3 className="text-white font-semibold text-lg mb-1 truncate">
                                {tokenData.name}
                              </h3>
                              <p className="text-neutral-400 text-sm truncate">
                                ${tokenData.ticker}
                              </p>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-neutral-500">
                                  Created by{" "}
                                  <span className="font-mono">
                                    {tokenData.creator}
                                  </span>
                                </p>
                                <p className="text-xs text-neutral-600 font-mono">
                                  {token.address.slice(0, 6)}...
                                  {token.address.slice(-4)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {/* NFT Allocation Modal */}
        {showAllocateModal && allocationBattle && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    <h2 className="text-xl font-semibold text-white">
                      Allocate Warrior NFTs
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAllocateModal(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-neutral-400">
                  {(() => {
                    const tokenAddress =
                      supportingSide === "memeA"
                        ? allocationBattle?.memeA
                        : allocationBattle?.memeB;

                    if (!tokenAddress)
                      return `Supporting in Battle #${Number(
                        allocationBattle?.battleId
                      )}`;

                    const tokenDetails = getTokenDetails(tokenAddress);
                    return `Supporting ${tokenDetails.name} in Battle #${Number(
                      allocationBattle.battleId
                    )}`;
                  })()}
                </p>
              </div>

              {/* Success Message */}
              {isAllocateConfirmed && (
                <div className="mx-6 mt-4 bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">NFTs allocated successfully!</span>
                </div>
              )}

              {/* Error Message */}
              {allocateError && (
                <div className="mx-6 mt-4 bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Error: {allocateError.message || "Failed to allocate NFTs"}
                  </span>
                </div>
              )}

              {/* NFT Selection */}
              <div className="p-6">
                {isLoadingNFTs ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-neutral-400">
                      Loading your Warrior NFTs...
                    </p>
                  </div>
                ) : !activeNFTs || activeNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No Available Warriors
                    </h3>
                    <p className="text-neutral-400 text-sm mb-4">
                      You don't have any available Warrior NFTs for this token.
                    </p>
                    <Link
                      to="/app/mint"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Mint Warriors
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-neutral-400 mb-2">
                        Select NFTs to allocate ({selectedNFTs.length} selected)
                        • {availableNFTs} available / {totalNFTs} total
                      </p>
                      {lockedNFTs > 0 && (
                        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2">
                          <Shield className="w-3 h-3" />
                          <span>
                            🔒 {lockedNFTs} Warrior
                            {lockedNFTs > 1 ? "s are" : " is"} currently locked
                            in other battles
                          </span>
                        </div>
                      )}
                    </div>

                    {/* NFT Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                      {activeNFTs.map((nftId) => (
                        <button
                          key={nftId.toString()}
                          onClick={() => toggleNFTSelection(nftId)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedNFTs.includes(nftId)
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">⚔️</div>
                            <p className="text-white font-semibold text-sm">
                              Warrior #{nftId.toString()}
                            </p>
                            {selectedNFTs.includes(nftId) && (
                              <div className="mt-2">
                                <CheckCircle className="w-5 h-5 text-blue-500 mx-auto" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500/10 border border-blue-500 text-blue-400 p-3 rounded-lg mb-4 text-sm">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Selected NFTs will be locked for the duration of the
                      battle. They contribute to your side's total support value
                      (40% of battle score).
                    </div>

                    {/* Allocate Button */}
                    <button
                      onClick={handleAllocateNFTs}
                      disabled={
                        selectedNFTs.length === 0 ||
                        isAllocatePending ||
                        isAllocateConfirming
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isAllocatePending || isAllocateConfirming ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isAllocatePending
                            ? "Confirm in Wallet..."
                            : "Allocating NFTs..."}
                        </>
                      ) : (
                        <>
                          <Users className="w-5 h-5" />
                          Allocate {selectedNFTs.length} NFT
                          {selectedNFTs.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Battle Details Modal */}
        {showDetailsModal && detailsBattle && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Swords className="w-6 h-6 text-red-500" />
                    <h2 className="text-2xl font-semibold text-white">
                      Battle #{Number(detailsBattle.battleId)} Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <span
                  className={`inline-block text-xs px-3 py-1 rounded-full border ${getStatusColor(
                    detailsBattle.status
                  )}`}
                >
                  {getStatusLabel(detailsBattle.status)}
                </span>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Battle Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Meme A */}
                  <div className="bg-neutral-800 rounded-lg p-4 border-2 border-blue-500/30">
                    {(() => {
                      const tokenDetails = getTokenDetails(detailsBattle.memeA);
                      return (
                        <div>
                          {tokenDetails.image ? (
                            <div className="mx-auto mb-3 w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={tokenDetails.image}
                                alt={tokenDetails.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="mx-auto mb-3 w-16 h-16 rounded-lg bg-neutral-700 flex items-center justify-center text-xs">
                              {tokenDetails.name.substring(0, 3)}
                            </div>
                          )}
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-blue-400 mb-2">
                              {tokenDetails.name}
                            </h3>
                            <p className="text-white font-mono text-xs break-all">
                              {detailsBattle.memeA.slice(0, 6)}...
                              {detailsBattle.memeA.slice(-4)}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <Flame className="w-4 h-4 text-orange-400" />
                                <span>Heat Score</span>
                              </div>
                              <span className="text-white font-semibold">
                                {Number(detailsBattle.heatA).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span>NFTs Allocated</span>
                              </div>
                              <span className="text-white font-semibold">
                                {Number(detailsBattle.memeANftsAllocated)}
                              </span>
                            </div>
                            <div className="pt-3 border-t border-neutral-700">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-400">
                                  Total Score
                                </span>
                                <span className="text-white font-bold text-lg">
                                  {calculateBattleScore(
                                    detailsBattle.heatA,
                                    detailsBattle.memeANftsAllocated
                                  ).toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1">
                                (Heat × 60% + NFTs × 40%)
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Meme B */}
                  <div className="bg-neutral-800 rounded-lg p-4 border-2 border-purple-500/30">
                    {(() => {
                      const tokenDetails = getTokenDetails(detailsBattle.memeB);
                      return (
                        <div>
                          {tokenDetails.image ? (
                            <div className="mx-auto mb-3 w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={tokenDetails.image}
                                alt={tokenDetails.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="mx-auto mb-3 w-16 h-16 rounded-lg bg-neutral-700 flex items-center justify-center text-xs">
                              {tokenDetails.name.substring(0, 3)}
                            </div>
                          )}
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-purple-400 mb-2">
                              {tokenDetails.name}
                            </h3>
                            <p className="text-white font-mono text-xs break-all">
                              {detailsBattle.memeB.slice(0, 6)}...
                              {detailsBattle.memeB.slice(-4)}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <Flame className="w-4 h-4 text-orange-400" />
                                <span>Heat Score</span>
                              </div>
                              <span className="text-white font-semibold">
                                {Number(detailsBattle.heatB).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span>NFTs Allocated</span>
                              </div>
                              <span className="text-white font-semibold">
                                {Number(detailsBattle.memeBNftsAllocated)}
                              </span>
                            </div>
                            <div className="pt-3 border-t border-neutral-700">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-400">
                                  Total Score
                                </span>
                                <span className="text-white font-bold text-lg">
                                  {calculateBattleScore(
                                    detailsBattle.heatB,
                                    detailsBattle.memeBNftsAllocated
                                  ).toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1">
                                (Heat × 60% + NFTs × 40%)
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Battle Progress Visualization */}
                {detailsBattle.status === 2 && (
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Battle Progress
                    </h3>
                    <div className="space-y-4">
                      {/* Score Comparison */}
                      <div>
                        <div className="flex justify-between text-sm text-neutral-400 mb-2">
                          <span>Meme A Leading</span>
                          <span>Meme B Leading</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                            style={{
                              width: `${(() => {
                                const scoreA = calculateBattleScore(
                                  detailsBattle.heatA,
                                  detailsBattle.memeANftsAllocated
                                );
                                const scoreB = calculateBattleScore(
                                  detailsBattle.heatB,
                                  detailsBattle.memeBNftsAllocated
                                );
                                const total = scoreA + scoreB;
                                return total > 0 ? (scoreA / total) * 100 : 50;
                              })()}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500 mt-1">
                          <span>
                            {(() => {
                              const scoreA = calculateBattleScore(
                                detailsBattle.heatA,
                                detailsBattle.memeANftsAllocated
                              );
                              const scoreB = calculateBattleScore(
                                detailsBattle.heatB,
                                detailsBattle.memeBNftsAllocated
                              );
                              const total = scoreA + scoreB;
                              return total > 0
                                ? ((scoreA / total) * 100).toFixed(1)
                                : "50.0";
                            })()}
                            %
                          </span>
                          <span>
                            {(() => {
                              const scoreA = calculateBattleScore(
                                detailsBattle.heatA,
                                detailsBattle.memeANftsAllocated
                              );
                              const scoreB = calculateBattleScore(
                                detailsBattle.heatB,
                                detailsBattle.memeBNftsAllocated
                              );
                              const total = scoreA + scoreB;
                              return total > 0
                                ? ((scoreB / total) * 100).toFixed(1)
                                : "50.0";
                            })()}
                            %
                          </span>
                        </div>
                      </div>

                      {/* Time Remaining */}
                      <div className="flex items-center justify-between bg-neutral-700 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-400" />
                          <span className="text-white font-semibold">
                            Time Remaining
                          </span>
                        </div>
                        <span className="text-green-400 font-bold text-lg">
                          {getTimeRemaining(detailsBattle.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Winner Section (for completed battles) */}
                {detailsBattle.status === 3 && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="w-8 h-8 text-green-400" />
                      <h3 className="text-2xl font-semibold text-white">
                        Battle Complete!
                      </h3>
                    </div>
                    {detailsBattle.winner !==
                      ("0x0000000000000000000000000000000000000000" as `0x${string}`) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-300">Winner:</span>
                          <span className="text-green-400 font-mono font-semibold">
                            {detailsBattle.winner}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-300">
                            Total Reward:
                          </span>
                          <span className="text-white font-bold">
                            {formatEther(detailsBattle.totalReward)} tokens
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Battle Info */}
                <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Battle Scoring Formula
                  </h3>
                  <div className="text-sm text-blue-400 space-y-1">
                    <p>
                      • <strong>60%</strong> - Heat Score (platform engagement)
                    </p>
                    <p>
                      • <strong>40%</strong> - NFT Support (community backing)
                    </p>
                    <p className="text-xs text-blue-300 mt-2">
                      The side with the highest combined score wins!
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {detailsBattle.status === 2 && address && (
                  <div className="flex gap-3">
                    {(() => {
                      const memeADetails = getTokenDetails(detailsBattle.memeA);
                      const memeBDetails = getTokenDetails(detailsBattle.memeB);
                      return (
                        <>
                          <button
                            onClick={() => {
                              setShowDetailsModal(false);
                              handleOpenAllocation(detailsBattle, "memeA");
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                          >
                            Support {memeADetails.name}
                          </button>
                          <button
                            onClick={() => {
                              setShowDetailsModal(false);
                              handleOpenAllocation(detailsBattle, "memeB");
                            }}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                          >
                            Support {memeBDetails.name}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
