# Use Contract getBattleScore Function

## Goal
Replace client-side battle score calculation in ActiveBattles component with contract's `getBattleScore` function to ensure single source of truth and accuracy.

## Todo Items
- [x] Create `useGetBattleScore` hook in useMemedBattle.ts
- [x] Update ActiveBattles component to use the new hook
- [x] Remove client-side `calculateBattleScore` function
- [x] Test that percentages display correctly

## Implementation Details

### Contract Function
Located at `/Users/a0000/projects/memed/app/abi/memedBattle.ts:536-548`

Returns:
- `scoreA`: Final score for meme A
- `scoreB`: Final score for meme B
- `heatScoreA`: Heat component for A
- `heatScoreB`: Heat component for B
- `valueScoreA`: NFT value component for A
- `valueScoreB`: NFT value component for B

### Changes Required
1. Add hook to call contract function with battleId
2. Use returned scores to calculate percentages
3. Handle loading/error states

## Review

### Changes Summary

#### 1. Added `useGetBattleScore` Hook
**File**: `/Users/a0000/projects/memed/app/hooks/contracts/useMemedBattle.ts:298-322`

Created a new hook that calls the contract's `getBattleScore` function:
- Takes `battleId` as parameter
- Returns tuple: `[scoreA, scoreB, heatScoreA, heatScoreB, valueScoreA, valueScoreB]`
- Configured with 5-second refetch interval for live score updates
- Uses proper TypeScript types and documentation

#### 2. Refactored ActiveBattles Component
**File**: `/Users/a0000/projects/memed/app/components/app/meme/ActiveBattles.tsx`

**Added BattleCardWithScore Component** (lines 40-66):
- New component that wraps BattleCard
- Fetches battle scores using `useGetBattleScore` hook
- Calculates percentages from contract-returned scores
- Each battle card has its own independent score query

**Updated Main Component** (lines 175-196):
- Removed client-side `calculateBattleScore` function
- Removed manual score calculation: `(Heat × 0.6) + (NFTs × 0.4)`
- Simplified map function to just extract token details
- Renders `BattleCardWithScore` instead of `BattleCard` directly

### Benefits

1. **Single Source of Truth**: Battle scores now come directly from the contract, ensuring consistency with backend calculations
2. **Live Updates**: Scores refresh every 5 seconds to show real-time battle progress
3. **Accuracy**: No risk of client-side calculation drift or formula mismatch
4. **Maintainability**: If scoring algorithm changes in contract, no frontend updates needed
5. **Component Separation**: Clean separation of concerns with dedicated component for score fetching

### Security Notes

- All data comes from blockchain contract (read-only)
- No user input or manipulation possible
- Standard Wagmi hooks with proper type safety
- No sensitive information exposed
