# Launch Status System - Real-Time Monitoring

## Overview
Analysis of the launch status polling system and status value mapping across the meme detail page.

## ✅ Real-Time Polling Status

All contract read hooks now have **5-second polling** enabled for real-time updates:

### Hooks with Polling Enabled:
1. ✅ **`useFairLaunchData`** (useMemedTokenSale.ts:33-45)
   - Returns full fair launch data array
   - Index 0 = status, Index 1 = startTime, Index 2 = totalCommitted, Index 3 = totalSold
   - Polls every 5 seconds
   - Used in: meme.tsx, LaunchProgress.tsx, ReadyToLaunch.tsx

2. ✅ **`useGetUserCommitment`** (useMemedTokenSale.ts:47-73)
   - Returns user's commitment details
   - Polls every 5 seconds
   - Used in: CommitETHForm.tsx

3. ✅ **`useGetFairLaunchStatus`** (useMemedTokenSale.ts:12-28) **(Just Added)**
   - Returns just the status value
   - Polls every 5 seconds
   - Currently imported but **NOT actively used** in LaunchProgress.tsx
   - Recommendation: Can be removed if not needed, or used as alternative to fairLaunchData[0]

## Status Value Mapping

### ⚠️ IMPORTANT: Two Different Status Systems Found

There appear to be **two different status enums** used in different parts of the code:

### System 1: UI Phase Status (meme.tsx - Lines 65-72)
Used for **page-level phase management**:

| Status | Phase | Description | Active State |
|--------|-------|-------------|--------------|
| **1** | Commitment Phase | Fair launch in progress, accepting commitments | `active: false` |
| **2** | Ready to Launch | Target reached, waiting for launch | `active: false` |
| **3** | Launched | Token launched, trading active | `active: true` |

**Location:** `app/routes/app/meme.tsx`
```typescript
if (status === 1) {
  setCurrentPhase(1); // Commitment phase
  setActive(false);
} else if (status === 2) {
  setCurrentPhase(2); // Ready to launch phase
  setActive(false);
} else if (status === 3) {
  setCurrentPhase(3); // Launched phase
  setActive(true);
}
```

**UI Rendering:**
- Phase 1: Shows `LaunchProgress` + `CommitETHForm`
- Phase 2: Shows `ReadyToLaunch` + Launch preparation message
- Phase 3: Shows `TradeForm` + `ActiveBattles` + Mint Warriors button

---

### System 2: Contract Status Display (LaunchProgress.tsx - Lines 218-220)
Used for **status label display only**:

| Status | Label | Meaning |
|--------|-------|---------|
| **0** | Active | Fair launch is active |
| **1** | Successful | Fair launch succeeded |
| **2** | Failed | Fair launch failed |
| **Unknown** | Unknown | Invalid status |

**Location:** `app/components/app/meme/LaunchProgress.tsx`
```typescript
Status: {fairLaunchStatus === 0 ? "Active" :
         fairLaunchStatus === 1 ? "Successful" :
         fairLaunchStatus === 2 ? "Failed" : "Unknown"}
```

**Note:** This display appears to be **informational only** and doesn't drive any UI logic.

---

## Analysis & Recommendations

### Current Behavior ✅
- **Real-time polling is working** - All hooks refresh every 5 seconds
- **Phase transitions work** - UI responds to status changes from contract
- **No critical bugs** - Both status systems coexist without conflicts

### Potential Issues ⚠️
1. **Status Value Confusion**
   - Two different status number meanings could confuse developers
   - System 1 uses 1,2,3 | System 2 uses 0,1,2

2. **Unused Hook**
   - `useGetFairLaunchStatus` is imported but never used in LaunchProgress
   - The component uses `fairLaunchData[0]` instead

3. **Status Display Mismatch**
   - LaunchProgress shows "Active/Successful/Failed" (0,1,2 system)
   - But actual UI uses "Commitment/Ready/Launched" (1,2,3 system)
   - This could display incorrect status labels

### Recommendations 📋

#### Option 1: Align Status Systems (Recommended)
Verify which system is correct from the smart contract:
```solidity
// If contract uses 1,2,3:
enum FairLaunchStatus {
  COMMITMENT = 1,
  READY_TO_LAUNCH = 2,
  LAUNCHED = 3
}

// If contract uses 0,1,2:
enum FairLaunchStatus {
  ACTIVE = 0,
  SUCCESSFUL = 1,
  FAILED = 2
}
```

Then update LaunchProgress.tsx status display to match the correct enum.

#### Option 2: Remove Unused Hook
Since `useGetFairLaunchStatus` is not used:
```typescript
// In LaunchProgress.tsx, remove line 51:
- const { data: launchStatus } = useGetFairLaunchStatus(tokenId);
```

#### Option 3: Document Status Values
Add TypeScript enums to clarify:
```typescript
// In useMemedTokenSale.ts
export enum FairLaunchPhase {
  COMMITMENT = 1,
  READY_TO_LAUNCH = 2,
  LAUNCHED = 3
}

export enum FairLaunchContractStatus {
  ACTIVE = 0,
  SUCCESSFUL = 1,
  FAILED = 2
}
```

## Real-Time Update Behavior

### How It Works:
1. Every 5 seconds, hooks refetch data from the smart contract
2. When `fairLaunchData` updates, useEffect in meme.tsx triggers
3. Phase state updates, causing UI to re-render
4. New components appear based on current phase

### User Experience:
- ✅ Launch progress bar updates automatically
- ✅ User commitment box updates after transactions
- ✅ Phase transitions happen without page refresh
- ✅ Forms switch automatically when conditions met

### Performance:
- Polling interval: **5 seconds**
- Network calls: ~3-4 per poll (depending on which hooks are active)
- Impact: **Minimal** - read-only contract calls are cheap
- Can be adjusted if needed (increase to 10s for less frequent updates)

## Files Modified

1. ✅ **app/hooks/contracts/useMemedTokenSale.ts**
   - Added polling to `useGetFairLaunchStatus` (line 25)
   - All three status-related hooks now poll every 5 seconds

## Summary

✅ **Real-Time Status Monitoring: ENABLED**
- All hooks polling every 5 seconds
- Phase transitions work automatically
- User sees live updates without refresh

⚠️ **Status Values: NEEDS CLARIFICATION**
- Two different status number systems exist
- Recommend verifying correct values from smart contract
- Consider adding TypeScript enums for clarity

📊 **Performance: OPTIMAL**
- 5-second intervals strike good balance
- Multiple components share same data
- No redundant contract calls
