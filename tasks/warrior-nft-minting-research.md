# Warrior NFT Minting - Research Documentation

## Date: 2025-11-15

---

## Executive Summary

This document provides a comprehensive overview of the `memedWarriorNFT` contract, existing hooks, and current implementation status to guide the development of NFT minting functionality.

---

## 1. Contract Analysis: memedWarriorNFT.ts

### 1.1 Key Functions for Minting Flow

#### A. `getCurrentPrice()` - Get Current Mint Price
```typescript
{
  "inputs": [],
  "name": "getCurrentPrice",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}
```
- **Type:** View function (read-only, no gas)
- **Returns:** Current price in MEME tokens (uint256)
- **Purpose:** Display current mint price to users
- **Status:** Not yet hooked up

---

#### B. `mintWarrior()` - Mint NFT
```typescript
{
  "inputs": [],
  "name": "mintWarrior",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
}
```
- **Type:** Write function (requires gas)
- **Parameters:** NONE (takes no parameters)
- **Returns:** Token ID of minted NFT (uint256)
- **Purpose:** Mint a new warrior NFT
- **Status:** Hook exists but not integrated
- **Important:** Requires prior ERC20 token approval

---

#### C. `balanceOf(address)` - Get User's NFT Balance
```typescript
{
  "inputs": [
    {
      "internalType": "address",
      "name": "owner",
      "type": "address"
    }
  ],
  "name": "balanceOf",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}
```
- **Type:** View function (read-only)
- **Returns:** Number of NFTs owned by address
- **Purpose:** Display how many warriors user owns
- **Status:** Hook exists (`useWarriorBalance`)

---

#### D. `getUserActiveNFTs(address)` - Get All NFT IDs Owned by User
```typescript
{
  "inputs": [
    {
      "internalType": "address",
      "name": "_user",
      "type": "address"
    }
  ],
  "name": "getUserActiveNFTs",
  "outputs": [
    {
      "internalType": "uint256[]",
      "name": "",
      "type": "uint256[]"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}
```
- **Type:** View function (read-only)
- **Returns:** Array of token IDs owned by user
- **Purpose:** Display user's NFT collection
- **Status:** Hook exists (`useUserActiveNfts`)
- **Note:** Only returns "active" (non-allocated) NFTs

---

#### E. `memedToken()` - Get Payment Token Address
```typescript
{
  "inputs": [],
  "name": "memedToken",
  "outputs": [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}
```
- **Type:** View function (read-only)
- **Returns:** Address of the MEME token used for payment
- **Purpose:** Know which ERC20 token to approve
- **Status:** Not yet hooked up
- **Critical:** Needed for token approval flow

---

### 1.2 Pricing Constants

```typescript
// Base price for first mint
{
  "inputs": [],
  "name": "BASE_PRICE",
  "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
  "stateMutability": "view",
  "type": "function"
}

// Price increase per mint after heat threshold
{
  "inputs": [],
  "name": "PRICE_INCREMENT",
  "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
  "stateMutability": "view",
  "type": "function"
}

// Heat threshold for price increases
{
  "inputs": [],
  "name": "HEAT_THRESHOLD",
  "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
  "stateMutability": "view",
  "type": "function"
}
```
- **Purpose:** Understand dynamic pricing mechanism
- **Status:** Not yet hooked up (optional for MVP)

---

### 1.3 Other Useful Functions

```typescript
// Get total number of minted warriors
{
  "inputs": [],
  "name": "currentTokenId",
  "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
  "stateMutability": "view",
  "type": "function"
}

// Get warrior details by token ID
{
  "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
  "name": "warriors",
  "outputs": [
    { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
    { "internalType": "address", "name": "owner", "type": "address" },
    { "internalType": "uint256", "name": "mintPrice", "type": "uint256" },
    { "internalType": "uint256", "name": "mintedAt", "type": "uint256" },
    { "internalType": "bool", "name": "allocated", "type": "bool" }
  ],
  "stateMutability": "view",
  "type": "function"
}
```

---

## 2. Existing Hooks Analysis

### 2.1 Warrior NFT Hooks (app/hooks/contracts/useMemedWarriorNFT.ts)

#### Available Hooks:

**A. `useWarriorBalance(nftAddress, accountAddress?)` - READY**
```typescript
// Get user's NFT balance
const { data: balance } = useWarriorBalance(warriorNFTAddress, userAddress);
```
- Status: READY TO USE
- Returns: Number of NFTs owned

**B. `useMintWarrior(nftAddress)` - READY**
```typescript
// Mint a warrior
const { mintWarrior, isPending, isConfirming, isConfirmed, hash, error } = useMintWarrior(warriorNFTAddress);

// Call when user clicks mint button
mintWarrior();
```
- Status: READY TO USE
- Note: Requires token approval first

**C. `useUserActiveNfts(nftAddress, userAddress?)` - READY**
```typescript
// Get array of NFT token IDs
const { data: nftIds } = useUserActiveNfts(warriorNFTAddress, userAddress);
```
- Status: READY TO USE
- Returns: Array of token IDs

**D. `useWarriorApprove(nftAddress)` - EXISTS**
```typescript
// Approve NFT for battle allocation (not needed for minting)
const { approve } = useWarriorApprove(warriorNFTAddress);
```
- Status: Exists but NOT needed for minting flow

---

#### MISSING Hooks Needed:

**E. `useGetCurrentPrice(nftAddress)` - MISSING**
```typescript
// NEEDS TO BE CREATED
export function useGetCurrentPrice(nftAddress: `0x${string}`) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "getCurrentPrice",
    query: {
      enabled: !!nftAddress,
    },
  });
}
```
- Status: NEEDS TO BE CREATED
- Critical: Required to display price

**F. `useGetMemedToken(nftAddress)` - MISSING**
```typescript
// NEEDS TO BE CREATED
export function useGetMemedToken(nftAddress: `0x${string}`) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "memedToken",
    query: {
      enabled: !!nftAddress,
    },
  });
}
```
- Status: NEEDS TO BE CREATED
- Critical: Required to know which token to approve

---

### 2.2 Token Hooks (app/hooks/contracts/useMemedToken.ts)

#### Available for ERC20 Token Approval:

**A. `useMemedTokenBalance(tokenAddress, accountAddress?)` - READY**
```typescript
// Check if user has enough tokens
const { data: tokenBalance } = useMemedTokenBalance(memedTokenAddress, userAddress);
```
- Status: READY TO USE

**B. `useMemedTokenAllowance(tokenAddress, ownerAddress, spenderAddress)` - READY**
```typescript
// Check current allowance for NFT contract
const { data: allowance } = useMemedTokenAllowance(
  memedTokenAddress,
  userAddress,
  warriorNFTAddress
);
```
- Status: READY TO USE
- Critical: Check if approval needed

**C. `useMemedTokenApprove(tokenAddress)` - READY**
```typescript
// Approve NFT contract to spend tokens
const { approve, isPending, isConfirming, isConfirmed } = useMemedTokenApprove(memedTokenAddress);

approve({ spender: warriorNFTAddress, value: priceInWei });
```
- Status: READY TO USE
- Critical: Required before minting

---

### 2.3 Factory Hooks (app/hooks/contracts/useMemedFactory.ts)

**`useGetWarriorNFT(tokenAddress)` - READY**
```typescript
// Get warrior NFT address for a token
const { data: warriorNFTAddress } = useGetWarriorNFT(token?.address);
```
- Status: ALREADY IMPLEMENTED in mint.tsx
- Returns: NFT contract address

---

### 2.4 Payment Token Hooks (app/hooks/contracts/usePaymentToken.ts)

**Reference Implementation for Approval Flow:**
```typescript
// Example from usePaymentToken.ts (for reference)
export function usePaymentTokenAllowance() {
  const { address } = useAccount();
  
  return useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, TOKEN_SALE_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 3000, // Poll for approval changes
    },
  });
}

export function useApprovePaymentToken() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const approveToken = (amount: bigint) => {
    writeContract({
      address: PAYMENT_TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [TOKEN_SALE_ADDRESS, amount],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return { approveToken, isPending, isConfirming, isConfirmed, hash, error };
}
```
- Pattern to follow for approval flow
- Shows polling strategy (refetchInterval: 3000)
- Good reference for transaction states

---

## 3. Current Implementation Analysis

### 3.1 MintWarriorPanel Component

**Location:** `app/components/app/mint-warriors/MintWarriorPanel.tsx`

**Current State:**
```typescript
// HARDCODED VALUES - NOT CONNECTED TO CONTRACT
const basePrice = 5600;
const calculateTotal = (qty: number) => {
  return (basePrice * qty).toLocaleString();
};
```

**Issues:**
- Hardcoded price (5600 MEME)
- No connection to blockchain
- Button has no onClick handler
- No approval flow
- No transaction state management

**What Needs to Change:**
1. Replace hardcoded price with `useGetCurrentPrice()`
2. Add token approval logic
3. Add minting logic with `useMintWarrior()`
4. Add transaction state UI (pending, confirming, success)
5. Add error handling
6. Disable button during transactions
7. Show user's token balance
8. Check allowance before minting

---

### 3.2 Mint Page (app/routes/app/mint.tsx)

**Current State:**
```typescript
// Already implemented:
const { data: warriorNFTAddress } = useGetWarriorNFT(token?.address);
```

**What's Working:**
- Gets warrior NFT address from factory
- Passes token name to components
- Basic UI structure

**What's Missing:**
- No price fetching
- No token balance display
- No NFT balance display
- warriorNFTAddress not passed to MintWarriorPanel

---

## 4. Data Flow for Minting

### 4.1 Complete Minting Flow

```
USER ARRIVES AT /explore/meme/${memeId}/mint
                        ↓
1. Get Token Address from Loader
   - token.address (from API)
                        ↓
2. Get Warrior NFT Address
   - useGetWarriorNFT(token.address) → warriorNFTAddress
                        ↓
3. Get Payment Token Address
   - useGetMemedToken(warriorNFTAddress) → memedTokenAddress
                        ↓
4. Fetch Current Price
   - useGetCurrentPrice(warriorNFTAddress) → currentPrice
                        ↓
5. Check User's Token Balance
   - useMemedTokenBalance(memedTokenAddress, userAddress) → tokenBalance
                        ↓
6. Check User's NFT Balance
   - useWarriorBalance(warriorNFTAddress, userAddress) → nftBalance
                        ↓
7. Check Current Allowance
   - useMemedTokenAllowance(memedTokenAddress, userAddress, warriorNFTAddress) → allowance
                        ↓
8. USER CLICKS "MINT WARRIOR"
                        ↓
9. IF allowance < currentPrice:
   a. Show "Approve" button
   b. Call approve({ spender: warriorNFTAddress, value: currentPrice })
   c. Wait for confirmation (isConfirming → isConfirmed)
   d. Allowance automatically updates (polling every 3s)
                        ↓
10. ELSE (allowance >= currentPrice):
    a. Show "Mint" button
    b. Call mintWarrior()
    c. Wait for confirmation (isConfirming → isConfirmed)
    d. Show success message with token ID
    e. Balances automatically update
```

---

### 4.2 State Machine for Mint Button

```
STATES:
1. LOADING: Fetching price, balances, allowance
2. INSUFFICIENT_BALANCE: tokenBalance < currentPrice
3. NEEDS_APPROVAL: allowance < currentPrice && tokenBalance >= currentPrice
4. READY_TO_MINT: allowance >= currentPrice && tokenBalance >= currentPrice
5. APPROVING: Approval transaction pending
6. MINTING: Mint transaction pending
7. SUCCESS: Mint completed
8. ERROR: Transaction failed

BUTTON STATES:
- LOADING → Disabled, "Loading..."
- INSUFFICIENT_BALANCE → Disabled, "Insufficient MEME Balance"
- NEEDS_APPROVAL → Enabled, "Approve MEME"
- READY_TO_MINT → Enabled, "Mint Warrior"
- APPROVING → Disabled, "Approving..." (with spinner)
- MINTING → Disabled, "Minting..." (with spinner)
- SUCCESS → Disabled, "Minted!" (green checkmark)
- ERROR → Enabled, "Try Again" (red)
```

---

## 5. Implementation Plan

### Phase 1: Add Missing Hooks
**File:** `app/hooks/contracts/useMemedWarriorNFT.ts`

- [ ] Add `useGetCurrentPrice(nftAddress)` hook
- [ ] Add `useGetMemedToken(nftAddress)` hook

**Complexity:** Simple (5 minutes)

---

### Phase 2: Update MintWarriorPanel Component
**File:** `app/components/app/mint-warriors/MintWarriorPanel.tsx`

**Props to Add:**
```typescript
interface MintWarriorPanelProps {
  tokenName?: string;
  warriorNFTAddress?: `0x${string}`; // NEW
  tokenAddress?: `0x${string}`;      // NEW (optional, for token info)
}
```

**Hooks to Add:**
- [ ] `useGetCurrentPrice(warriorNFTAddress)` - Get mint price
- [ ] `useGetMemedToken(warriorNFTAddress)` - Get payment token address
- [ ] `useMemedTokenBalance(memedTokenAddress)` - Get user's token balance
- [ ] `useMemedTokenAllowance(memedTokenAddress, userAddress, warriorNFTAddress)` - Check allowance
- [ ] `useMemedTokenApprove(memedTokenAddress)` - Approve spending
- [ ] `useMintWarrior(warriorNFTAddress)` - Mint NFT
- [ ] `useWarriorBalance(warriorNFTAddress)` - Get NFT count
- [ ] `useAccount()` - Get user address

**Logic to Implement:**
- [ ] Replace hardcoded price with contract price
- [ ] Calculate total dynamically (price * quantity)
- [ ] Implement approval flow
- [ ] Implement minting flow
- [ ] Add transaction state management
- [ ] Add error handling
- [ ] Add loading states
- [ ] Disable button during transactions
- [ ] Show success message after mint
- [ ] Display user's current NFT balance
- [ ] Check sufficient token balance

**Complexity:** Medium (1-2 hours)

---

### Phase 3: Update Mint Page
**File:** `app/routes/app/mint.tsx`

**Changes:**
- [ ] Pass `warriorNFTAddress` to MintWarriorPanel
- [ ] Pass `token.address` to MintWarriorPanel (optional)

**Example:**
```typescript
<MintWarriorPanel 
  tokenName={tokenName}
  warriorNFTAddress={warriorNFTAddress}
  tokenAddress={token?.address}
/>
```

**Complexity:** Simple (5 minutes)

---

### Phase 4: Testing & Polish

- [ ] Test with wallet connected
- [ ] Test approval flow
- [ ] Test minting flow
- [ ] Test error states
- [ ] Test with insufficient balance
- [ ] Test loading states
- [ ] Test transaction confirmations
- [ ] Test balance updates after mint
- [ ] Add toast notifications (optional)
- [ ] Add confetti animation on success (optional)

**Complexity:** Medium (30 minutes - 1 hour)

---

## 6. Code Examples

### 6.1 Example: useGetCurrentPrice Hook

```typescript
// app/hooks/contracts/useMemedWarriorNFT.ts

/**
 * Hook to read the current mint price for a MemedWarriorNFT contract.
 * @param nftAddress The address of the MemedWarriorNFT contract.
 * @returns The current mint price in MEME tokens.
 */
export function useGetCurrentPrice(nftAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "getCurrentPrice",
    query: {
      enabled: !!nftAddress,
      refetchInterval: 10000, // Refresh price every 10 seconds
    },
  });
}
```

---

### 6.2 Example: useGetMemedToken Hook

```typescript
// app/hooks/contracts/useMemedWarriorNFT.ts

/**
 * Hook to get the payment token address for a MemedWarriorNFT contract.
 * @param nftAddress The address of the MemedWarriorNFT contract.
 * @returns The address of the MEME token used for payment.
 */
export function useGetMemedToken(nftAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "memedToken",
    query: {
      enabled: !!nftAddress,
    },
  });
}
```

---

### 6.3 Example: MintWarriorPanel Logic (Pseudocode)

```typescript
export default function MintWarriorPanel({ 
  tokenName, 
  warriorNFTAddress,
  tokenAddress 
}: MintWarriorPanelProps) {
  const { address: userAddress } = useAccount();
  
  // Get current price
  const { data: currentPrice, isLoading: priceLoading } = useGetCurrentPrice(warriorNFTAddress);
  
  // Get payment token address
  const { data: memedTokenAddress } = useGetMemedToken(warriorNFTAddress);
  
  // Get user's token balance
  const { data: tokenBalance } = useMemedTokenBalance(memedTokenAddress, userAddress);
  
  // Get current allowance
  const { data: allowance } = useMemedTokenAllowance(
    memedTokenAddress,
    userAddress,
    warriorNFTAddress
  );
  
  // Get user's NFT balance
  const { data: nftBalance } = useWarriorBalance(warriorNFTAddress, userAddress);
  
  // Approval hook
  const {
    approve,
    isPending: approvalPending,
    isConfirming: approvalConfirming,
    isConfirmed: approvalConfirmed,
    error: approvalError,
  } = useMemedTokenApprove(memedTokenAddress);
  
  // Minting hook
  const {
    mintWarrior,
    isPending: mintPending,
    isConfirming: mintConfirming,
    isConfirmed: mintConfirmed,
    error: mintError,
  } = useMintWarrior(warriorNFTAddress);
  
  // Calculate if approval is needed
  const needsApproval = allowance ? allowance < (currentPrice || 0n) : true;
  const hasSufficientBalance = tokenBalance ? tokenBalance >= (currentPrice || 0n) : false;
  
  // Handle approve button click
  const handleApprove = () => {
    if (!currentPrice) return;
    approve({ spender: warriorNFTAddress, value: currentPrice });
  };
  
  // Handle mint button click
  const handleMint = () => {
    mintWarrior();
  };
  
  // Determine button state
  const getButtonState = () => {
    if (priceLoading) return { text: "Loading...", disabled: true, onClick: null };
    if (!hasSufficientBalance) return { text: "Insufficient MEME", disabled: true, onClick: null };
    if (approvalPending || approvalConfirming) return { text: "Approving...", disabled: true, onClick: null };
    if (needsApproval) return { text: "Approve MEME", disabled: false, onClick: handleApprove };
    if (mintPending || mintConfirming) return { text: "Minting...", disabled: true, onClick: null };
    if (mintConfirmed) return { text: "Minted!", disabled: true, onClick: null };
    return { text: "Mint Warrior", disabled: false, onClick: handleMint };
  };
  
  const buttonState = getButtonState();
  
  return (
    <div>
      {/* Display current price */}
      <div>Price: {currentPrice ? formatUnits(currentPrice, 18) : "Loading..."} MEME</div>
      
      {/* Display user's NFT balance */}
      <div>Your Warriors: {nftBalance?.toString() || "0"}</div>
      
      {/* Display user's token balance */}
      <div>Your MEME: {tokenBalance ? formatUnits(tokenBalance, 18) : "0"}</div>
      
      {/* Mint button */}
      <button
        onClick={buttonState.onClick}
        disabled={buttonState.disabled}
      >
        {buttonState.text}
      </button>
      
      {/* Error messages */}
      {approvalError && <div>Approval failed: {approvalError.message}</div>}
      {mintError && <div>Mint failed: {mintError.message}</div>}
    </div>
  );
}
```

---

## 7. Security Considerations

### 7.1 Token Approval Best Practices

**Current Approach (Safe):**
```typescript
// Approve exact amount needed for one mint
approve({ spender: warriorNFTAddress, value: currentPrice });
```

**Why This is Safe:**
- Only approves the exact amount needed
- Minimizes risk if NFT contract is compromised
- User approves for each mint (more transactions but safer)

**Alternative (Less Safe but Convenient):**
```typescript
// Approve unlimited amount (NOT RECOMMENDED without user consent)
approve({ spender: warriorNFTAddress, value: ethers.MaxUint256 });
```

**Recommendation:**
- Always approve exact amount by default
- Optionally add "Approve Unlimited" checkbox with clear warning
- Store approval preference in localStorage if user opts in

---

### 7.2 Balance Checks

**Critical Checks Before Minting:**
```typescript
// 1. Check token balance
if (tokenBalance < currentPrice) {
  // Show error: "Insufficient MEME tokens"
  return;
}

// 2. Check allowance
if (allowance < currentPrice) {
  // Prompt for approval first
  return;
}

// 3. Only then allow minting
mintWarrior();
```

---

### 7.3 Error Handling

**Transaction Errors to Handle:**
- User rejects transaction
- Insufficient gas
- Contract reverts (e.g., insufficient allowance despite our check)
- Network errors
- Contract not found (wrong address)

**Implementation:**
```typescript
{error && (
  <div className="text-red-500">
    {error.message.includes("User rejected") 
      ? "Transaction cancelled" 
      : "Transaction failed. Please try again."}
  </div>
)}
```

---

## 8. Testing Checklist

### 8.1 Happy Path
- [ ] Connect wallet
- [ ] Navigate to mint page
- [ ] See correct current price (from contract)
- [ ] See user's MEME balance
- [ ] See user's NFT count
- [ ] Click "Approve MEME"
- [ ] Confirm approval in wallet
- [ ] Wait for confirmation
- [ ] Button changes to "Mint Warrior"
- [ ] Click "Mint Warrior"
- [ ] Confirm mint in wallet
- [ ] Wait for confirmation
- [ ] See success message
- [ ] NFT count increases by 1
- [ ] MEME balance decreases by mint price

### 8.2 Edge Cases
- [ ] No wallet connected → Show "Connect Wallet" message
- [ ] Insufficient MEME balance → Button disabled, show error
- [ ] User rejects approval → Show cancellation message
- [ ] User rejects mint → Show cancellation message
- [ ] Approval already exists → Skip straight to mint
- [ ] Multiple rapid clicks → Button disabled during transaction
- [ ] Network switch during transaction → Handle gracefully
- [ ] Contract call fails → Show error message

### 8.3 UI/UX
- [ ] Loading states show spinners
- [ ] Prices display with correct decimals
- [ ] Large numbers formatted with commas
- [ ] Buttons disabled during transactions
- [ ] Error messages are clear and helpful
- [ ] Success feedback is visible
- [ ] Transaction hash shown/clickable (block explorer link)

---

## 9. Files to Create/Modify

### Files to Modify:

1. **`app/hooks/contracts/useMemedWarriorNFT.ts`**
   - Add `useGetCurrentPrice()` hook
   - Add `useGetMemedToken()` hook

2. **`app/components/app/mint-warriors/MintWarriorPanel.tsx`**
   - Complete rewrite with blockchain integration
   - Add approval flow
   - Add minting flow
   - Add state management
   - Add error handling

3. **`app/routes/app/mint.tsx`**
   - Pass `warriorNFTAddress` to MintWarriorPanel
   - Pass `token.address` to MintWarriorPanel

### Files to Reference (No Changes):

- `app/hooks/contracts/useMemedToken.ts` - Use existing approval hooks
- `app/hooks/contracts/usePaymentToken.ts` - Reference for approval pattern
- `app/abi/memedWarriorNFT.ts` - Contract ABI
- `app/abi/erc20.ts` - Token ABI

---

## 10. Estimated Effort

### Time Breakdown:

| Task | Complexity | Time Estimate |
|------|-----------|---------------|
| Add hooks (getCurrentPrice, getMemedToken) | Simple | 10 minutes |
| Update MintWarriorPanel component | Medium | 1-2 hours |
| Update mint.tsx page | Simple | 5 minutes |
| Testing & debugging | Medium | 30-60 minutes |
| Polish & error handling | Simple | 20 minutes |
| **TOTAL** | | **2-3.5 hours** |

### Development Strategy:

**Incremental Approach (Recommended):**
1. Add hooks first → Test in console
2. Update MintWarriorPanel → Test approval flow
3. Test minting flow → Fix bugs
4. Add polish & error handling
5. Final testing

**Why Incremental:**
- Easier to debug
- Can test each piece independently
- Less overwhelming
- Follows CLAUDE.md directive: "simple and with component focus"

---

## 11. Next Steps After Minting Works

### Phase 2 Features:
1. Display minted NFTs gallery
2. Show NFT metadata (image, attributes)
3. Price history chart with real data
4. Heat score integration
5. Battle allocation UI
6. NFT transfer functionality

### Infrastructure:
1. Add toast notifications for transactions
2. Add transaction history
3. Cache contract data for performance
4. Add analytics tracking
5. Error monitoring (Sentry)

---

## 12. Summary

### What We Have:
- Complete contract ABI with all needed functions
- Working hooks for: balance, minting, NFT ownership
- Existing approval pattern from payment token
- Factory integration for NFT address
- UI components ready for integration

### What We Need:
- 2 new hooks: `useGetCurrentPrice`, `useGetMemedToken`
- Integrate blockchain logic into MintWarriorPanel
- Connect approval flow (similar to CommitETHForm)
- Add transaction state management
- Pass props from mint.tsx to component

### Complexity Assessment:
- **Low Risk:** All building blocks exist
- **Medium Effort:** 2-3.5 hours estimated
- **High Impact:** Enables core NFT minting functionality

### Ready to Implement:
All research complete. Ready to proceed with implementation plan.

---

## Appendix: Function Reference Quick Guide

```typescript
// READING DATA (No gas required)
getCurrentPrice()          → uint256 (current mint price)
memedToken()              → address (payment token address)
balanceOf(address)        → uint256 (NFT count)
getUserActiveNFTs(address) → uint256[] (array of token IDs)
currentTokenId()          → uint256 (total minted)
warriors(uint256)         → tuple (NFT details)

// WRITING DATA (Gas required)
mintWarrior()             → uint256 (new token ID)
  ⚠️ Requires: ERC20 approval first

// ERC20 FUNCTIONS (for approval)
approve(spender, amount)  → bool
allowance(owner, spender) → uint256
balanceOf(address)        → uint256
```

---

**Document Status:** Complete and Ready for Implementation
**Last Updated:** 2025-11-15
**Next Action:** Create implementation plan based on this research
