# Add Claim and Refund Functionality

## Objective
Add claim token functionality for successfully launched tokens (status 3) and refund functionality for failed launches (status 4).

---

## Problem
Currently, when a token launch succeeds (status 3) or fails (status 4), users cannot claim their tokens or get their refund. The UI needs to provide these options based on the launch status.

---

## Requirements

### Status 3 (Launched)
- Show a "Claim Tokens" button
- Call `claim(uint256 _id)` function on memedTokenSale contract
- Only show if user has tokens to claim (commitment.claimed = false)
- Display success message after claiming

### Status 4 (Launch Failed)
- Show a "Refund" button
- Display the amount user will get back (their committed amount)
- Call `refund(uint256 _id)` function on memedTokenSale contract
- Only show if user has commitment and hasn't been refunded yet (commitment.refunded = false)
- Display success message after refund

---

## Todo List

- [ ] Create `useClaim` hook in useMemedTokenSale.ts
- [ ] Create `useRefund` hook in useMemedTokenSale.ts
- [ ] Create ClaimTokenPanel component for status 3
- [ ] Create RefundPanel component for status 4
- [ ] Update meme.tsx to handle status 4 (failed launch)
- [ ] Add ClaimTokenPanel to status 3 section in meme.tsx
- [ ] Test claim functionality
- [ ] Test refund functionality
- [ ] Security review

---

## Technical Details

### Contract Functions

**claim(uint256 _id)**
- Location: memedTokenSale.ts lines 196-201
- Input: Fair launch ID
- Action: Transfers tokens to user who committed
- Requirement: Status must be 3 (Launched), user must have commitment, not claimed yet

**refund(uint256 _id)**
- Location: memedTokenSale.ts lines 337-342
- Input: Fair launch ID
- Action: Returns committed ETH/payment token to user
- Requirement: Status must be 4 (Failed), user must have commitment, not refunded yet

**getUserCommitment(uint256 _id, address u)**
- Returns: { amount, tokenAmount, claimed, refunded }
- Hook already exists: `useGetUserCommitment` (lines 55-75)

---

## Implementation Plan

### 1. Create Hooks (useMemedTokenSale.ts)

Following the pattern of `useCancelCommit`, create:
- `useClaim()` - Write hook for claim function
- `useRefund()` - Write hook for refund function

### 2. Create ClaimTokenPanel Component

- Similar to CommitETHForm but simpler
- Shows user's token allocation from commitment
- Shows claim button
- Handles claim transaction
- Shows loading/success states

### 3. Create RefundPanel Component

- Shows user's committed amount
- Shows refund button with amount
- Handles refund transaction
- Shows loading/success states

### 4. Update meme.tsx

- Add status 4 handling in useEffect (currently only handles 1, 2, 3)
- Add ClaimTokenPanel in status 3 right section
- Add RefundPanel in status 4 section
- Add proper error handling

---

## Files to Create

1. `app/hooks/contracts/useMemedTokenSale.ts` - Add claim and refund hooks
2. `app/components/app/meme/ClaimTokenPanel.tsx` - NEW
3. `app/components/app/meme/RefundPanel.tsx` - NEW

## Files to Modify

1. `app/routes/app/meme.tsx` - Add status 4 handling and claim/refund UI

---

## Security Considerations

- Validate user has commitment before showing buttons
- Check claimed/refunded status to prevent double-claiming
- Proper error handling for failed transactions
- Clear user feedback for all states
- No sensitive data exposed in frontend

---

## Review Section

### Implementation Summary

**Changes Made:**

1. **Created `useClaim` and `useRefund` hooks** (`app/hooks/contracts/useMemedTokenSale.ts`)
   - Both hooks follow the same pattern as `useCancelCommit`
   - Use `useWriteContract` for transaction execution
   - Use `useWaitForTransactionReceipt` for confirmation tracking
   - Return all necessary states: `isPending`, `isConfirming`, `isConfirmed`, `hash`, `error`

2. **Created `ClaimTokenPanel` component** (`app/components/app/meme/ClaimTokenPanel.tsx`)
   - Displays user's token allocation from `getUserCommitment`
   - Shows claim button only if user has unclaimed tokens
   - Shows success message after claim confirmation
   - Shows "already claimed" state if user already claimed
   - Shows "no commitment" state if user has no tokens
   - Uses payment token info for formatting

3. **Created `RefundPanel` component** (`app/components/app/meme/RefundPanel.tsx`)
   - Displays user's committed amount (refund amount)
   - Shows refund button with amount to receive
   - Shows success message after refund confirmation
   - Shows "already refunded" state if user already got refund
   - Shows "no commitment" state if user has nothing to refund
   - Shows launch failed notice
   - Uses payment token info for formatting

4. **Updated `meme.tsx`** (`app/routes/app/meme.tsx`)
   - Added imports for ClaimTokenPanel and RefundPanel (lines 8-9)
   - Changed phase state type to include status 4: `1 | 2 | 3 | 4` (line 32)
   - Added status 4 handling in useEffect (lines 72-75)
   - Added launch failed notice in left section for status 4 (lines 179-187)
   - Added ClaimTokenPanel in right section for status 3 (lines 224-230)
   - Added RefundPanel in right section for status 4 (lines 233-239)

### Security Review

✅ **No security vulnerabilities found:**

**Hooks:**
- Use wagmi's secure contract interaction methods
- Transaction parameters validated by TypeScript types
- Contract enforces all business logic (who can claim/refund, amounts, etc.)
- No direct handling of user funds in frontend

**Components:**
- Only display data from smart contract
- Cannot manipulate amounts or recipients
- Properly check claim/refund status to prevent double-actions
- Use wallet connection from wagmi (secure)
- Disabled states prevent unauthorized actions
- All transactions require wallet signature

**Smart Contract Security:**
- All security enforced on-chain
- `claim()` checks user commitment and claimed status
- `refund()` checks launch status and refunded status
- User cannot claim/refund for others
- Amounts determined by contract, not frontend

**Additional Security:**
- No sensitive data exposed
- No API keys or secrets
- Type-safe implementation
- Proper error handling
- Loading states prevent race conditions

### Code Quality

✅ **Best Practices Followed:**
- Clear, descriptive comments throughout
- Consistent naming conventions
- Proper TypeScript types
- Component focus (minimal changes per file)
- Reusable formatting functions
- Responsive design maintained
- Follows existing codebase patterns

### Testing Checklist

**Status 3 (Launched) - Claim Functionality:**
- [ ] Navigate to token detail page with status 3
- [ ] Verify ClaimTokenPanel shows in right section
- [ ] Verify shows correct token allocation amount
- [ ] Verify claim button is enabled if not claimed
- [ ] Click claim button and approve transaction
- [ ] Verify success message appears
- [ ] Verify "already claimed" state shows after claiming
- [ ] Verify tokens appear in wallet

**Status 4 (Failed) - Refund Functionality:**
- [ ] Navigate to token detail page with status 4
- [ ] Verify RefundPanel shows in right section
- [ ] Verify shows correct refund amount (committed amount)
- [ ] Verify refund button is enabled if not refunded
- [ ] Click refund button and approve transaction
- [ ] Verify success message appears
- [ ] Verify "already refunded" state shows after refund
- [ ] Verify payment tokens appear in wallet

**Edge Cases:**
- [ ] User with no commitment sees "no commitment" message
- [ ] User already claimed sees "already claimed" message
- [ ] User already refunded sees "already refunded" message
- [ ] Button disabled during transaction processing
- [ ] Button disabled if wallet not connected

### Files Created (3 files)

1. `app/components/app/meme/ClaimTokenPanel.tsx` (172 lines)
2. `app/components/app/meme/RefundPanel.tsx` (178 lines)
3. `tasks/add-claim-and-refund-functionality.md` (this file)

### Files Modified (2 files)

1. `app/hooks/contracts/useMemedTokenSale.ts`
   - Added `useClaim` hook (lines 187-220)
   - Added `useRefund` hook (lines 222-255)

2. `app/routes/app/meme.tsx`
   - Added imports (lines 8-9)
   - Updated phase state type (line 32)
   - Added status 4 handling in useEffect (lines 72-75)
   - Added launch failed notice (lines 179-187)
   - Added ClaimTokenPanel (lines 224-230)
   - Added RefundPanel (lines 233-239)

### Benefits

**User Experience:**
- ✅ Clear claim functionality for successful launches
- ✅ Clear refund functionality for failed launches
- ✅ Shows exact amounts user will receive
- ✅ Proper status tracking (claimed/refunded)
- ✅ Success messages for confirmation
- ✅ Informative UI for all states

**Developer Experience:**
- ✅ Reusable hooks following established patterns
- ✅ Type-safe implementation
- ✅ Easy to test and debug
- ✅ Well-documented with comments

**Code Quality:**
- ✅ Follows existing patterns in codebase
- ✅ Minimal changes (component focus)
- ✅ Defensive programming (null checks, optional chaining)
- ✅ Clean separation of concerns

### Summary

Successfully implemented claim and refund functionality:

**Status 3 (Launched):**
- Users can claim their allocated tokens
- Shows token allocation from commitment
- One-time action with proper state tracking

**Status 4 (Failed):**
- Users can claim full refund of committed funds
- Shows exact refund amount (their commitment)
- One-time action with proper state tracking

**Security:** ✅ All security enforced by smart contracts, no frontend vulnerabilities

**Status:** ✅ Implementation complete - Ready for testing
