# Fix Approval to Commit Flow

## Problem
After approving tokens, the user still sees the "Approve" button instead of the "Commit" button. The UI doesn't update immediately after approval completes.

## Root Cause
The `usePaymentTokenAllowance` hook was not polling for updates. It only fetched allowance data:
1. On component mount
2. When manually calling `refetchAllowance()`

**The Issue:**
- User clicks "Approve" button
- Transaction confirms → `isApprovalConfirmed` becomes `true`
- `useEffect` calls `refetchAllowance()` to update allowance
- **BUT:** There's a timing issue where:
  - The blockchain state might not be updated yet when refetch happens
  - The refetch completes but React doesn't re-render immediately
  - User still sees "Approve" button stuck

## Solution
Added real-time polling to both `usePaymentTokenBalance` and `usePaymentTokenAllowance` hooks.

### Changes Made

#### File: `app/hooks/contracts/usePaymentToken.ts`

**1. Added Polling to usePaymentTokenBalance (Lines 10-27)**
```typescript
export function usePaymentTokenBalance() {
  const { address } = useAccount();

  return useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Poll every 5 seconds ✅
    },
  });
}
```

**2. Added Polling to usePaymentTokenAllowance (Lines 29-46)**
```typescript
export function usePaymentTokenAllowance() {
  const { address } = useAccount();

  return useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, TOKEN_SALE_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 3000, // Poll every 3 seconds (faster) ✅
    },
  });
}
```

**Why 3 seconds for allowance?**
- Faster polling (3s vs 5s) for quicker approval detection
- Critical for good UX in the approve → commit flow
- User sees commit button appear within 3 seconds max

## How It Works Now

### Approval Flow (Optimized):

1. **User enters amount** → Input validation
   - `isCommitValid` = true if amount > 0
   - `hasEnoughAllowance` = false (no approval yet)
   - **Shows:** "Approve" button

2. **User clicks "Approve"**
   - Calls `approveToken(amount)`
   - `isPending` = true
   - **Shows:** "Approving..." (disabled)

3. **Approval transaction confirms**
   - `isApprovalConfirmed` = true
   - `useEffect` manually calls `refetchAllowance()` (line 139-143)
   - **Polling continues in background (every 3 seconds)**

4. **Allowance updates (within 3 seconds max)**
   - `tokenAllowance` updates from contract
   - `hasEnoughAllowance` recalculates → becomes `true`
   - **Shows:** "Commit" button ✅

5. **User clicks "Commit"**
   - Now they can proceed immediately!

### Multiple Safety Mechanisms:

1. **Manual refetch** (existing): Tries to update immediately after approval
2. **3-second polling** (NEW): Catches the update even if manual refetch misses it
3. **Memoization**: Prevents unnecessary recalculations

## Benefits

### User Experience
✅ **Smooth transition** from Approve to Commit button
✅ **Max 3-second delay** for button to appear (usually instant)
✅ **No stuck UI** - polling ensures data eventually updates
✅ **Balance updates** automatically as user transacts

### Developer Experience
✅ **Consistent with other hooks** - all use 3-5s polling
✅ **No special handling needed** - hooks just work
✅ **Debuggable** - clear polling intervals

### Performance
✅ **Minimal overhead** - read-only calls are cheap
✅ **Reasonable intervals** - not too frequent, not too slow
✅ **Can be adjusted** - easy to tune if needed

## Testing

### Expected Behavior:
1. Enter amount → See "Approve" button
2. Click "Approve" → See "Approving..."
3. Wait for confirmation → Within 3 seconds, see "Commit" button ✅
4. Click "Commit" → Transaction goes through

### Edge Cases Handled:
- ✅ Approval fails → Stays on "Approve" button
- ✅ Network delay → Polling catches update within 3s
- ✅ User switches accounts → Polling refetches for new address
- ✅ Insufficient balance → Shows error, disables buttons

## Polling Strategy Summary

| Hook | Interval | Reason |
|------|----------|--------|
| `usePaymentTokenAllowance` | **3s** | Critical for approve→commit flow |
| `usePaymentTokenBalance` | **5s** | Keep balance updated |
| `useFairLaunchData` | **5s** | Launch progress updates |
| `useGetUserCommitment` | **5s** | User commitment updates |
| `useGetFairLaunchStatus` | **5s** | Status changes |

**Rationale:**
- Allowance is faster (3s) because it's part of a user-initiated flow
- Other hooks use 5s as they're less time-sensitive
- All intervals are reasonable for RPC providers

## Files Modified

1. ✅ **app/hooks/contracts/usePaymentToken.ts**
   - Added polling to `usePaymentTokenBalance` (line 24)
   - Added polling to `usePaymentTokenAllowance` (line 43)

## Security Considerations

✅ **No security issues** - read-only contract calls
✅ **No sensitive data exposed** - public blockchain data
✅ **Rate limiting safe** - intervals are reasonable
✅ **Gas-free** - only reading data, not writing

## Alternative Solutions Considered

### ❌ Option 1: Increase manual refetch attempts
```typescript
// Retry refetch multiple times
setTimeout(() => refetchAllowance(), 1000);
setTimeout(() => refetchAllowance(), 2000);
setTimeout(() => refetchAllowance(), 3000);
```
**Rejected:** Hacky, hard to maintain, doesn't handle all cases

### ❌ Option 2: Wait for specific block confirmations
```typescript
// Wait for N blocks after approval
await waitForBlocks(2);
refetchAllowance();
```
**Rejected:** Complex, varies by network, overkill for this use case

### ✅ Option 3: Real-time polling (CHOSEN)
**Advantages:**
- Simple, consistent, reliable
- Works for all scenarios (approval, balance changes, etc.)
- Already using polling for other data
- Minimal code changes

## Conclusion

The approval → commit flow is now **smooth and reliable**. Users will see the commit button appear within **3 seconds maximum** after approval confirmation, typically much faster. The solution is simple, maintainable, and consistent with the rest of the codebase.
