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
  useGetBattleAllocations,
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
import { TokenCard, type TokenData } from "@/components/app/battles/TokenCard";
import { EmptySlot } from "@/components/app/battles/EmptySlot";
import { useDebounce } from "@/utils/debounce";
import { useTokenDetailsMap } from "@/hooks/useTokenDetailsMap";
import { ConnectWalletPrompt } from "@/components/shared/ConnectWalletPrompt";

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

export default function Battles() {
  const { address } = useAccount();
  const { user, isLoading: isLoadingUser, isAuthenticated } = useAuthStore();

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
  // Debounced search query to prevent excessive filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [allTokens, setAllTokens] = useState<any[]>([]);
  const [isLoadingAllTokens, setIsLoadingAllTokens] = useState(false);

  // NFT Allocation state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocationBattle, setAllocationBattle] = useState<Battle | null>(null);
  const [supportingSide, setSupportingSide] = useState<
    "memeA" | "memeB" | null
  >(null);
  // Use Set for O(1) lookups instead of array O(n) lookups
  const [selectedNFTs, setSelectedNFTs] = useState<Set<bigint>>(new Set());

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

  const { data: nftAddress, isLoading: isLoadingNftAddress } = useGetWarriorNFT(supportedTokenAddress);

  // Fetch user's active NFTs for the supported token
  // Enable immediate refetch when modal opens
  const { data: activeNFTs, isLoading: isLoadingNFTs, refetch: refetchActiveNFTs } = useUserActiveNfts(
    nftAddress as `0x${string}`,
    address
  );

  // Get user's current allocations for this specific battle to prevent re-allocation
  const {
    data: userBattleAllocations,
    refetch: refetchBattleAllocations,
    isLoading: isLoadingAllocations,
    error: allocationsError
  } = useGetBattleAllocations(
    allocationBattle?.battleId,
    address,
    supportedTokenAddress
  );


  // Get list of NFT IDs already allocated to this battle
  // userBattleAllocations is a tuple: [battleId, user, supportedMeme, nftsIds[], claimed, getBack]
  // nftsIds is at index 3
  const allocatedNFTsArray = userBattleAllocations
    ? (userBattleAllocations as any)[3] as bigint[] | undefined
    : undefined;
  const allocatedNFTIds = allocatedNFTsArray && Array.isArray(allocatedNFTsArray)
    ? allocatedNFTsArray
    : [];

  // Helper function to check if an NFT is already allocated to this battle
  const isNFTAllocated = (nftId: bigint): boolean => {
    // Only check if we have valid allocation data
    if (!allocatedNFTIds || allocatedNFTIds.length === 0) {
      return false;
    }
    return allocatedNFTIds.some((allocatedId) => allocatedId === nftId);
  };

  // For display purposes, we'll show all active NFTs but disable allocated ones
  const availableNFTsForBattle = activeNFTs || [];

  // Refetch NFTs and allocations immediately when allocation modal opens
  // Wait for allocationBattle and supportedTokenAddress to be set
  useEffect(() => {
    if (showAllocateModal && nftAddress && allocationBattle && supportedTokenAddress) {
      refetchActiveNFTs();
      // Small delay to ensure state is fully updated before refetching allocations
      setTimeout(() => {
        refetchBattleAllocations();
      }, 100);
    }
  }, [showAllocateModal, nftAddress, allocationBattle, supportedTokenAddress, refetchActiveNFTs, refetchBattleAllocations]);

  // Fetch total NFT balance to show locked count
  const { data: totalBalance } = useWarriorBalance(
    nftAddress as `0x${string}`,
    address
  );

  // Calculate NFT counts
  const totalNFTs = totalBalance ? Number(totalBalance) : 0;
  const alreadyAllocatedToThisBattle = allocatedNFTIds.length;
  const availableNFTsCount = (activeNFTs?.length || 0) - alreadyAllocatedToThisBattle;
  const lockedInOtherBattles = totalNFTs - (activeNFTs?.length || 0);
  const totalUnavailable = alreadyAllocatedToThisBattle + lockedInOtherBattles;

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
      // Refetch active NFTs to remove allocated ones from the list
      refetchActiveNFTs();
      // Refetch battle allocations to update the "already allocated" count
      refetchBattleAllocations();
      // Reset allocation state
      setSelectedNFTs(new Set());
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
    // AbortController for cleanup on unmount or dependency change
    const abortController = new AbortController();

    const fetchAllTokens = async () => {
      if (showTokenSelector && selectingFor === "memeB") {
        setIsLoadingAllTokens(true);
        try {
          const response = await apiClient.get<{ tokens: any[] }>(
            API_ENDPOINTS.TOKENS,
            { signal: abortController.signal }
          );
          // Only update state if request wasn't aborted
          if (!abortController.signal.aborted) {
            setAllTokens(response.data.tokens || []);
          }
        } catch (error: any) {
          // Ignore abort errors
          if (error.name !== 'AbortError' && !abortController.signal.aborted) {
            setAllTokens([]);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoadingAllTokens(false);
          }
        }
      }
    };

    fetchAllTokens();

    // Cleanup function to abort ongoing request
    return () => {
      abortController.abort();
    };
  }, [showTokenSelector, selectingFor]);

  // Handle opening token selector
  const handleOpenTokenSelector = (forSlot: "memeA" | "memeB") => {
    setSelectingFor(forSlot);
    setSearchQuery(""); // Clear search query when opening modal
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
    setSelectedNFTs(new Set());
    setShowAllocateModal(true);
  };

  // Handle NFT selection toggle (using Set for O(1) operations)
  const toggleNFTSelection = (nftId: bigint) => {
    setSelectedNFTs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nftId)) {
        newSet.delete(nftId);
      } else {
        newSet.add(nftId);
      }
      return newSet;
    });
  };

  // Handle NFT allocation
  const handleAllocateNFTs = () => {
    if (
      !allocationBattle ||
      !address ||
      !supportingSide ||
      selectedNFTs.size === 0
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
      nftsIds: Array.from(selectedNFTs), // Convert Set to array for contract call
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
  // Added null safety checks to ensure tokens load correctly
  const availableTokens = useMemo(() => {
    if (!user?.token || !Array.isArray(user.token)) {
      return [];
    }

    return user.token.filter(
      (t) =>
        t && // Token exists
        t.address && // Has valid address
        typeof t.address === "string" && // Address is a string
        t.userId === user.id && // User is the creator
        !isTokenInBattle(t.address as `0x${string}`) // Not currently in battle
    );
  }, [user?.token, user?.id, battles]); // Recompute when user tokens or battles change

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

  // Helper: Calculate battle progress percentages for both sides
  const calculateBattleProgress = (battle: Battle) => {
    const scoreA = calculateBattleScore(battle.heatA, battle.memeANftsAllocated);
    const scoreB = calculateBattleScore(battle.heatB, battle.memeBNftsAllocated);
    const total = scoreA + scoreB;
    const percentageA = total > 0 ? (scoreA / total) * 100 : 50;
    const percentageB = 100 - percentageA;

    return { scoreA, scoreB, total, percentageA, percentageB };
  };

  // Helper: Format address for display
  const formatAddress = (address: string | undefined): string => {
    if (!address || typeof address !== 'string' || address.length < 10) {
      return "N/A";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Extract unique token addresses from all battles for fetching metadata
  const tokenAddresses = useMemo(() => {
    if (!battles || battles.length === 0) return [];

    const uniqueAddresses = new Set<string>();
    battles.forEach((battle) => {
      if (battle.memeA) uniqueAddresses.add(battle.memeA.toLowerCase());
      if (battle.memeB) uniqueAddresses.add(battle.memeB.toLowerCase());
    });

    return Array.from(uniqueAddresses);
  }, [battles]);

  // Fetch token details using shared hook (includes ticker and address fields)
  const { tokenDetailsMap } = useTokenDetailsMap(tokenAddresses, {
    includeExtendedFields: true,
  });

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
        {/* Create Battle Section - gated behind authentication */}
        {!isAuthenticated || !address ? (
          <div className="max-w-4xl mx-auto">
            <ConnectWalletPrompt
              variant="card"
              message="Connect your wallet to create and participate in meme battles"
            />
          </div>
        ) : (
          <>
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
          </>
        )}

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
                                    {battle.memeA &&
                                    typeof battle.memeA === "string" &&
                                    battle.memeA.length >= 10
                                      ? `${battle.memeA.slice(
                                          0,
                                          6
                                        )}...${battle.memeA.slice(-4)}`
                                      : battle.memeA || "N/A"}
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
                                    {battle.memeB &&
                                    typeof battle.memeB === "string" &&
                                    battle.memeB.length >= 10
                                      ? `${battle.memeB.slice(
                                          0,
                                          6
                                        )}...${battle.memeB.slice(-4)}`
                                      : battle.memeB || "N/A"}
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
                                    {battle.memeA &&
                                    typeof battle.memeA === "string" &&
                                    battle.memeA.length >= 10
                                      ? `${battle.memeA.slice(
                                          0,
                                          6
                                        )}...${battle.memeA.slice(-4)}`
                                      : battle.memeA || "N/A"}
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
                                    {battle.memeB &&
                                    typeof battle.memeB === "string" &&
                                    battle.memeB.length >= 10
                                      ? `${battle.memeB.slice(
                                          0,
                                          6
                                        )}...${battle.memeB.slice(-4)}`
                                      : battle.memeB || "N/A"}
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
                        <>
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-neutral-400 mb-2">
                              <span className="text-green-400">Meme A</span>
                              <span className="text-orange-400">Meme B</span>
                            </div>
                            <div className="w-full bg-gradient-to-r from-green-500/30 to-orange-500/30 rounded-full h-2 overflow-hidden flex">
                              {(() => {
                                const { percentageA, percentageB } = calculateBattleProgress(battle);
                                return (
                                  <>
                                    <div
                                      className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                                      style={{ width: `${percentageA}%` }}
                                    />
                                    <div
                                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-500"
                                      style={{ width: `${percentageB}%` }}
                                    />
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Countdown Timer - Prominent Display */}
                          <div className="mb-4 bg-neutral-800 border border-neutral-700 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-400" />
                              <span className="text-neutral-300 text-sm font-medium">
                                Time Remaining
                              </span>
                            </div>
                            <span className="text-green-400 font-bold text-base">
                              {getTimeRemaining(battle.endTime)}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Battle Result Display (for completed battles and draws) */}
                      {(battle.status === 3 || battle.status === 4) && (
                        <div className="mb-4">
                          {battle.status === 4 ? (
                            /* Draw Result */
                            <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                <h3 className="text-yellow-400 font-bold text-lg">
                                  It's a Draw!
                                </h3>
                              </div>
                              <p className="text-neutral-300 text-sm text-center">
                                Both sides tied with equal scores
                              </p>
                              {(() => {
                                const { scoreA, scoreB } = calculateBattleProgress(battle);
                                return (
                                  <div className="mt-3 flex justify-center gap-4 text-sm">
                                    <div className="text-neutral-400">
                                      Final Score: <span className="text-white font-semibold">{scoreA.toFixed(1)}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : battle.winner !== "0x0000000000000000000000000000000000000000" ? (
                            /* Winner Result */
                            (() => {
                              const { scoreA, scoreB } = calculateBattleProgress(battle);
                              const memeAWon = battle.winner.toLowerCase() === battle.memeA.toLowerCase();
                              const winnerDetails = getTokenDetails(battle.winner);
                              const loserDetails = getTokenDetails(memeAWon ? battle.memeB : battle.memeA);
                              const winnerScore = memeAWon ? scoreA : scoreB;
                              const loserScore = memeAWon ? scoreB : scoreA;

                              return (
                                <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
                                  <div className="flex items-center justify-center gap-2 mb-3">
                                    <Trophy className="w-5 h-5 text-green-400" />
                                    <h3 className="text-green-400 font-bold text-lg">
                                      Battle Complete!
                                    </h3>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-green-500/20 rounded-lg p-2">
                                      <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-green-400" />
                                        <span className="text-green-400 font-semibold text-sm">Winner:</span>
                                        <span className="text-white font-bold">{winnerDetails.name}</span>
                                      </div>
                                      <span className="text-green-400 font-bold">{winnerScore.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-neutral-800 rounded-lg p-2">
                                      <div className="flex items-center gap-2">
                                        <X className="w-4 h-4 text-neutral-500" />
                                        <span className="text-neutral-500 font-semibold text-sm">Lost:</span>
                                        <span className="text-neutral-400">{loserDetails.name}</span>
                                      </div>
                                      <span className="text-neutral-400">{loserScore.toFixed(1)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            /* Ended but no winner (edge case) */
                            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-center">
                              <p className="text-neutral-400 text-sm">Battle ended</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Battle Footer */}
                      <div className="flex items-center justify-end pt-4 border-t border-neutral-800 gap-2">
                        <div className="flex gap-2">
                          {/* Allocate NFTs button for active battles only */}
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
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                                      title={`Support ${memeADetails.name}`}
                                    >
                                      Support {memeADetails.name}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenAllocation(battle, "memeB")
                                      }
                                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                                      title={`Support ${memeBDetails.name}`}
                                    >
                                      Support {memeBDetails.name}
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* Battle ended - show info message instead of support buttons */}
                          {(battle.status === 3 || battle.status === 4 || battle.status === 5) && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 italic">
                              <Clock className="w-3 h-3" />
                              <span>Battle has ended</span>
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

                    // Filter tokens based on debounced search query (only for Meme B)
                    // Using debounced query improves performance by reducing filtering frequency
                    const filteredTokens =
                      selectingFor === "memeB" && debouncedSearchQuery
                        ? tokenList.filter((token) => {
                            const query = debouncedSearchQuery.toLowerCase();
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

                          // Safely format creator address with null checks
                          const creatorAddress =
                            token.userId &&
                            typeof token.userId === "string" &&
                            token.userId.length >= 10
                              ? `${token.userId.slice(
                                  0,
                                  6
                                )}...${token.userId.slice(-4)}`
                              : "Unknown";

                          const tokenData: TokenData = {
                            address: token.address as `0x${string}`,
                            name: token.metadata?.name || "Unnamed Token",
                            ticker: token.metadata?.ticker || "???",
                            image: imageUrl,
                            creator: creatorAddress,
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
                                  {token.address &&
                                  typeof token.address === "string" &&
                                  token.address.length >= 10
                                    ? `${token.address.slice(
                                        0,
                                        6
                                      )}...${token.address.slice(-4)}`
                                    : token.address || "N/A"}
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
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllocateModal(false)}
          >
            <div
              className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users
                      className={`w-6 h-6 ${
                        supportingSide === "memeA" ? "text-green-500" : "text-orange-500"
                      }`}
                    />
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
                {(isLoadingNftAddress || isLoadingNFTs) && !activeNFTs ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                    <p className="text-neutral-400">
                      Loading your Warrior NFTs...
                    </p>
                    <p className="text-xs text-neutral-500 mt-2">
                      {isLoadingNftAddress ? "Fetching NFT contract..." : "Loading warriors..."}
                    </p>
                  </div>
                ) : !activeNFTs || activeNFTs.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No Available Warriors
                    </h3>
                    <p className="text-neutral-400 text-sm mb-4">
                      {alreadyAllocatedToThisBattle > 0
                        ? `You have already allocated ${alreadyAllocatedToThisBattle} warrior${alreadyAllocatedToThisBattle > 1 ? 's' : ''} to this battle.`
                        : "You don't have any available Warrior NFTs for this token."}
                    </p>
                    {alreadyAllocatedToThisBattle === 0 && (
                      <Link
                        to="/app/mint"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        Mint Warriors
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Show subtle loading indicator while refreshing */}
                    {(isLoadingNftAddress || isLoadingNFTs) && availableNFTsForBattle && (
                      <div className="mb-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 p-2 rounded-lg flex items-center gap-2 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Refreshing warriors...</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="text-sm text-neutral-400 mb-2">
                        Select NFTs to allocate ({selectedNFTs.size} selected)
                        • {availableNFTsCount} available for this battle / {totalNFTs} total
                      </p>
                      {alreadyAllocatedToThisBattle > 0 && (
                        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded px-3 py-2 mb-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            ✅ {alreadyAllocatedToThisBattle} Warrior
                            {alreadyAllocatedToThisBattle > 1 ? "s" : ""} already allocated to this battle
                          </span>
                        </div>
                      )}
                      {lockedInOtherBattles > 0 && (
                        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2">
                          <Shield className="w-3 h-3" />
                          <span>
                            🔒 {lockedInOtherBattles} Warrior
                            {lockedInOtherBattles > 1 ? "s are" : " is"} locked in other battles
                          </span>
                        </div>
                      )}
                    </div>

                    {/* NFT Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                      {availableNFTsForBattle.map((nftId) => {
                        const isAllocated = isNFTAllocated(nftId);
                        return (
                          <button
                            key={nftId.toString()}
                            onClick={() => !isAllocated && toggleNFTSelection(nftId)}
                            disabled={isAllocated}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isAllocated
                                ? "border-neutral-600 bg-neutral-800/50 opacity-50 cursor-not-allowed"
                                : selectedNFTs.has(nftId)
                                ? supportingSide === "memeA"
                                  ? "border-green-500 bg-green-500/10 cursor-pointer"
                                  : "border-orange-500 bg-orange-500/10 cursor-pointer"
                                : "border-neutral-700 bg-neutral-800 hover:border-neutral-600 cursor-pointer"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">
                                {isAllocated ? "🔒" : "⚔️"}
                              </div>
                              <p className={`font-semibold text-sm ${isAllocated ? "text-neutral-500" : "text-white"}`}>
                                Warrior #{nftId.toString()}
                              </p>
                              {isAllocated ? (
                                <div className="mt-2">
                                  <p className="text-xs text-neutral-500">
                                    Already Allocated
                                  </p>
                                </div>
                              ) : selectedNFTs.has(nftId) ? (
                                <div className="mt-2">
                                  <CheckCircle
                                    className={`w-5 h-5 mx-auto ${
                                      supportingSide === "memeA"
                                        ? "text-green-500"
                                        : "text-orange-500"
                                    }`}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Info Box - Color matches supported token */}
                    <div
                      className={`p-3 rounded-lg mb-4 text-sm ${
                        supportingSide === "memeA"
                          ? "bg-green-500/10 border border-green-500 text-green-400"
                          : "bg-orange-500/10 border border-orange-500 text-orange-400"
                      }`}
                    >
                      <Shield className="w-4 h-4 inline mr-2" />
                      Selected NFTs will be locked for the duration of the
                      battle. They contribute to your side's total support value
                      (40% of battle score).
                    </div>

                    {/* Allocate Button - Color matches supported token */}
                    <button
                      onClick={handleAllocateNFTs}
                      disabled={
                        selectedNFTs.size === 0 ||
                        isAllocatePending ||
                        isAllocateConfirming
                      }
                      className={`w-full disabled:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        supportingSide === "memeA"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-orange-600 hover:bg-orange-700"
                      }`}
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
                          Allocate {selectedNFTs.size} NFT
                          {selectedNFTs.size !== 1 ? "s" : ""}
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
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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
                  <div className="bg-neutral-800 rounded-lg p-4 border-2 border-green-500/30">
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
                            <h3 className="text-lg font-semibold text-green-400 mb-2">
                              {tokenDetails.name}
                            </h3>
                            <p className="text-white font-mono text-xs break-all">
                              {detailsBattle.memeA &&
                              typeof detailsBattle.memeA === "string" &&
                              detailsBattle.memeA.length >= 10
                                ? `${detailsBattle.memeA.slice(
                                    0,
                                    6
                                  )}...${detailsBattle.memeA.slice(-4)}`
                                : detailsBattle.memeA || "N/A"}
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
                  <div className="bg-neutral-800 rounded-lg p-4 border-2 border-orange-500/30">
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
                            <h3 className="text-lg font-semibold text-orange-400 mb-2">
                              {tokenDetails.name}
                            </h3>
                            <p className="text-white font-mono text-xs break-all">
                              {detailsBattle.memeB &&
                              typeof detailsBattle.memeB === "string" &&
                              detailsBattle.memeB.length >= 10
                                ? `${detailsBattle.memeB.slice(
                                    0,
                                    6
                                  )}...${detailsBattle.memeB.slice(-4)}`
                                : detailsBattle.memeB || "N/A"}
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
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-green-400 font-medium">Meme A</span>
                          <span className="text-orange-400 font-medium">Meme B</span>
                        </div>
                        <div className="w-full bg-gradient-to-r from-green-500/20 to-orange-500/20 rounded-full h-4 overflow-hidden flex">
                          {(() => {
                            const { percentageA, percentageB } = calculateBattleProgress(detailsBattle);
                            return (
                              <>
                                <div
                                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                                  style={{ width: `${percentageA}%` }}
                                />
                                <div
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-500"
                                  style={{ width: `${percentageB}%` }}
                                />
                              </>
                            );
                          })()}
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
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                          >
                            Support {memeADetails.name}
                          </button>
                          <button
                            onClick={() => {
                              setShowDetailsModal(false);
                              handleOpenAllocation(detailsBattle, "memeB");
                            }}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
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
