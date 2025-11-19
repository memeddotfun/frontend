# Commenting Guide for Memed.fun Codebase
## Files That Need Detailed Comments for Junior Developers

This document identifies all key files in the codebase that would benefit from comprehensive comments and explanations for junior developers. Files are organized by category with absolute paths.

---

## 1. CORE APP FILES (Root & Layout)

### Root Application File
- **`/Users/a0000/projects/memed/app/root.tsx`**
  - App entry point and error boundary
  - Contains session verification logic
  - Web3Provider wrapper setup
  - Comments needed: Explain the Layout pattern, ErrorBoundary purpose, useAuthStore.verifySession flow

### Configuration & Environment
- **`/Users/a0000/projects/memed/app/abi.ts`**
  - Central ABI imports management
  - Comments needed: What these ABIs are used for, how to add new contracts

---

## 2. PROVIDERS & WEB3 SETUP

### Web3 Provider
- **`/Users/a0000/projects/memed/app/providers/Web3Provider.tsx`**
  - Wagmi, QueryClient, and ConnectKit setup
  - Comments needed: Explain each provider's purpose, why they're layered, configuration flow

---

## 3. CONFIGURATION FILES

### Chain Configuration
- **`/Users/a0000/projects/memed/app/config/chains.ts`**
  - Environment-based chain switching (dev vs prod)
  - RPC endpoint configuration
  - Comments needed: How dev/prod detection works, why Base Sepolia for dev, how to add new chains

### Contract Addresses
- **`/Users/a0000/projects/memed/app/config/contracts.ts`**
  - Smart contract address constants
  - Contract references and exports
  - Comments needed: What each contract does, which network these addresses are for, how to update for new networks

---

## 4. ENVIRONMENT & UTILITIES

### Environment Validation
- **`/Users/a0000/projects/memed/app/utils/env.ts`**
  - Environment variable validation and management
  - Comments needed: What each env var controls, why validation is important, error messages

---

## 5. API CLIENT & CONFIGURATION

### API Client
- **`/Users/a0000/projects/memed/app/lib/api/client.ts`**
  - HTTP client with retry logic, timeout handling, error normalization
  - Features: exponential backoff, request cancellation, error handling
  - Comments needed: Explain retry logic, timeout handling, error normalization, how to use each method

### API Configuration
- **`/Users/a0000/projects/memed/app/lib/api/config.ts`**
  - Centralized API endpoint definitions
  - HTTP status codes and error codes
  - Cache configuration, utility functions
  - Comments needed: API endpoint organization, error code meanings, cache TTL rationale, endpoint building helper

### API Loaders
- **`/Users/a0000/projects/memed/app/lib/api/loaders.ts`**
  - React Router data loaders
  - Comments needed: What loaders do, when they execute, how to add new loaders

### Lens Client
- **`/Users/a0000/projects/memed/app/lib/lens/client.ts`**
  - Lens Protocol integration
  - Comments needed: What Lens is, why it's integrated, key methods

---

## 6. API HOOKS

### Auth Hook
- **`/Users/a0000/projects/memed/app/hooks/api/useAuth.ts`**
  - Authentication-related mutations (nonce, wallet connection, social connection)
  - Type definitions for Auth API
  - Comments needed: Explain each auth flow, type definitions, error handling

### Memed API Hook
- **`/Users/a0000/projects/memed/app/hooks/api/useMemedApi.ts`**
  - Platform-specific API queries and mutations
  - Comments needed: What data structures are used, API contracts

### Core API Hook
- **`/Users/a0000/projects/memed/app/hooks/useApi.ts`**
  - Generic data fetching hook with caching, error handling, retry logic
  - useApi (GET requests), useApiMutation (POST/PUT/PATCH), useOptimisticApi
  - Comments needed: Cache implementation details, dependency management, abort signal handling, when to use each hook

---

## 7. CONTRACT HOOKS (Web3/Smart Contracts)

### Factory Contract Hooks
- **`/Users/a0000/projects/memed/app/hooks/contracts/useMemedFactory.ts`**
  - getTokens, startFairLaunch, getTokenData, getWarriorNFT, tokenHeat
  - Comments needed: What each function reads/writes, heat score mechanics, transaction flow

### Battle Contracts
- **`/Users/a0000/projects/memed/app/hooks/contracts/useMemedBattle.ts`**
  - Battle creation, staking, resolution
  - Comments needed: Battle phases, staking mechanics, resolver pattern

### Token Sale Contracts
- **`/Users/a0000/projects/memed/app/hooks/contracts/useMemedTokenSale.ts`**
  - Fair launch commitments, ETH/GHO contributions
  - Comments needed: Fair launch phases, refund logic, token distribution

### Token Contracts
- **`/Users/a0000/projects/memed/app/hooks/contracts/useMemedToken.ts`**
  - Token balance queries, trading
  - Comments needed: Token economics, balance queries, trading mechanics

### Payment Token
- **`/Users/a0000/projects/memed/app/hooks/contracts/usePaymentToken.ts`**
  - Payment token (GHO) balance and allowance
  - Comments needed: Why GHO is used, approval patterns

### Warrior NFT
- **`/Users/a0000/projects/memed/app/hooks/contracts/useMemedWarriorNFT.ts`**
  - Warrior NFT minting and management
  - Comments needed: Warrior NFT purpose, minting flow, heat system

### Engage to Earn
- **`/Users/a0000/projects/memed/app/hooks/contracts/useMemedEngageToEarn.ts`**
  - Rewards distribution, claiming
  - Comments needed: How engagement generates rewards, claim mechanics

### Battle Resolver
- **`/Users/a0000/projects/memed/app/hooks/contracts/useMemedBattleResolver.ts`**
  - Battle outcome determination
  - Comments needed: Resolution logic, oracle patterns

### Other Contract Hooks
- **`/Users/a0000/projects/memed/app/hooks/contracts/useRecentClaims.ts`**
  - Recent claim tracking
- **`/Users/a0000/projects/memed/app/hooks/contracts/useWarriorPriceHistory.ts`**
  - Historical pricing data
- **`/Users/a0000/projects/memed/app/hooks/contracts/useCreatorActivity.ts`**
  - Creator engagement tracking

---

## 8. COMPLEX COMPONENTS - MEME DETAIL PAGE

### Meme Detail Route (Main Container)
- **`/Users/a0000/projects/memed/app/routes/app/meme.tsx`**
  - Main meme detail page layout and state management
  - Phase tracking (commitment, ready, launched, failed)
  - Comments needed: Phase state machine, component composition, data loading flow, token ID conversion

### Meme Components
- **`/Users/a0000/projects/memed/app/components/app/meme/MemeCard.tsx`**
  - Meme intro card with image and basic info
- **`/Users/a0000/projects/memed/app/components/app/meme/LaunchProgress.tsx`**
  - Progress bar for token launch phases
- **`/Users/a0000/projects/memed/app/components/app/meme/TradeForm.tsx`**
  - Buy/sell token form with price calculations
  - Contains formatTokenAmount utility
  - Comments needed: Price calculation logic, amount formatting, slippage handling, useDebounce pattern
- **`/Users/a0000/projects/memed/app/components/app/meme/CommitETHForm.tsx`**
  - ETH commitment form for fair launch
- **`/Users/a0000/projects/memed/app/components/app/meme/CommitGHOForm.tsx`**
  - GHO commitment form alternative
- **`/Users/a0000/projects/memed/app/components/app/meme/StakeForm.tsx`**
  - Staking form for warriors
- **`/Users/a0000/projects/memed/app/components/app/meme/UnstakeForm.tsx`**
  - Unstaking form
- **`/Users/a0000/projects/memed/app/components/app/meme/ReadyToLaunch.tsx`**
  - Status panel when launch is ready
- **`/Users/a0000/projects/memed/app/components/app/meme/ClaimTokenPanel.tsx`**
  - Token claim interface post-launch
- **`/Users/a0000/projects/memed/app/components/app/meme/RefundPanel.tsx`**
  - Refund interface if launch fails
- **`/Users/a0000/projects/memed/app/components/app/meme/ActiveBattles.tsx`**
  - Display active battles for token
- **`/Users/a0000/projects/memed/app/components/app/meme/BattleHistory.tsx`**
  - Historical battle records
- **`/Users/a0000/projects/memed/app/components/app/meme/SocialMediaStats.tsx`**
  - Social media integration and stats
- **`/Users/a0000/projects/memed/app/components/app/meme/CountdownTimer.tsx`**
  - Countdown display for phase changes
- **`/Users/a0000/projects/memed/app/components/app/meme/LoadingState.tsx`**
  - Loading skeleton and placeholder UI

---

## 9. COMPLEX COMPONENTS - LAUNCH FLOW

### Launch Route
- **`/Users/a0000/projects/memed/app/routes/app/launch.tsx`**
  - Token creation multi-step flow
  - Comments needed: Step state management, form data persistence, submission flow

### Launch Components
- **`/Users/a0000/projects/memed/app/components/app/launch/CreateMemeForm.tsx`**
  - Meme metadata form (name, description, image)
- **`/Users/a0000/projects/memed/app/components/app/launch/TokenSettingForm.tsx`**
  - Token economics configuration
- **`/Users/a0000/projects/memed/app/components/app/launch/ConnectProfile.tsx`**
  - Social profile connection for launch

---

## 10. COMPLEX COMPONENTS - BATTLES

### Battle Route
- **`/Users/a0000/projects/memed/app/routes/app/battles.tsx`**
  - Battle listing and management page

### Battle Components
- **`/Users/a0000/projects/memed/app/components/app/battle/BattleSearchList.tsx`**
  - Battle list with search/filter
- **`/Users/a0000/projects/memed/app/components/app/battle/Challenger.tsx`**
  - Challenger side battle card
- **`/Users/a0000/projects/memed/app/components/app/battle/Challenged.tsx`**
  - Challenged side battle card
- **`/Users/a0000/projects/memed/app/components/shared/BattleCard.tsx`**
  - Shared battle card component

---

## 11. COMPLEX COMPONENTS - EXPLORATION/DISCOVERY

### Explore Route
- **`/Users/a0000/projects/memed/app/routes/app/explore.tsx`**
  - Token discovery and leaderboard page

### Explore Components
- **`/Users/a0000/projects/memed/app/components/app/explore/MemeTokensList.tsx`**
  - List view of tokens
- **`/Users/a0000/projects/memed/app/components/app/explore/MemeTokenCard.tsx`**
  - Individual token card
- **`/Users/a0000/projects/memed/app/components/app/explore/Leaderboard.tsx`**
  - Leaderboard display
- **`/Users/a0000/projects/memed/app/components/app/explore/LeaderboardCard.tsx`**
  - Individual leaderboard entry card
- **`/Users/a0000/projects/memed/app/components/app/explore/HorizontalCard.tsx`**
  - Horizontal card variant

---

## 12. COMPLEX COMPONENTS - MINT WARRIORS

### Mint Warrior Components
- **`/Users/a0000/projects/memed/app/components/app/mint-warriors/MintWarriorPanel.tsx`**
  - Main warrior NFT minting interface
  - Comments needed: Heat-to-warrior conversion, pricing mechanics, minting process
- **`/Users/a0000/projects/memed/app/components/app/mint-warriors/MintPriceAndHeat.tsx`**
  - Heat score and pricing display
- **`/Users/a0000/projects/memed/app/components/app/mint-warriors/PriceHistory.tsx`**
  - Historical pricing chart

---

## 13. SHARED COMPONENTS

### Authentication & Wallet
- **`/Users/a0000/projects/memed/app/components/shared/ClientConnectButton.tsx`**
  - Connect wallet button with status
  - Comments needed: State management, connection flow, UI states
- **`/Users/a0000/projects/memed/app/components/shared/WalletConnection.tsx`**
  - Wallet connection modal/dialog
- **`/Users/a0000/projects/memed/app/components/shared/Web3ErrorBoundary.tsx`**
  - Error boundary for Web3 errors

### User Interface
- **`/Users/a0000/projects/memed/app/components/shared/UserDetail.tsx`**
  - User profile information display
- **`/Users/a0000/projects/memed/app/components/shared/MemeImageUploader.tsx`**
  - Image upload with IPFS integration
  - Comments needed: Image upload flow, IPFS integration, validation

### Layout Components
- **`/Users/a0000/projects/memed/app/components/app/AppHeader.tsx`**
  - App navigation header
- **`/Users/a0000/projects/memed/app/components/app/Sidebar.tsx`**
  - App sidebar navigation

---

## 14. ROUTE FILES (Pages)

### Core App Routes
- **`/Users/a0000/projects/memed/app/routes/app/app.tsx`**
  - App layout wrapper
- **`/Users/a0000/projects/memed/app/routes/app/explore.tsx`** (Modified)
  - Token discovery page
- **`/Users/a0000/projects/memed/app/routes/app/launch.tsx`**
  - Token creation wizard
- **`/Users/a0000/projects/memed/app/routes/app/meme.tsx`**
  - Individual token detail page
- **`/Users/a0000/projects/memed/app/routes/app/battles.tsx`**
  - Battle management page
- **`/Users/a0000/projects/memed/app/routes/app/mint.tsx`**
  - Warrior NFT minting page
- **`/Users/a0000/projects/memed/app/routes/app/search.tsx`**
  - Token search page
- **`/Users/a0000/projects/memed/app/routes/app/staking.tsx`**
  - Staking interface
- **`/Users/a0000/projects/memed/app/routes/app/rewards.tsx`**
  - Rewards claiming page
- **`/Users/a0000/projects/memed/app/routes/app/insights.tsx`**
  - Analytics and insights page
- **`/Users/a0000/projects/memed/app/routes/app/creator.tsx`**
  - Creator dashboard
- **`/Users/a0000/projects/memed/app/routes/app/settings.tsx`**
  - User settings page

### Marketing Routes
- **`/Users/a0000/projects/memed/app/routes/home.tsx`**
  - Landing page
- **`/Users/a0000/projects/memed/app/routes/about.tsx`**
  - About page
- **`/Users/a0000/projects/memed/app/routes/contact.tsx`**
  - Contact page
- **`/Users/a0000/projects/memed/app/routes/tokenomics.tsx`**
  - Token economics explanation

### Home Components
- **`/Users/a0000/projects/memed/app/components/home/Header.tsx`**
- **`/Users/a0000/projects/memed/app/components/home/HeroSection.tsx`**
- **`/Users/a0000/projects/memed/app/components/home/TrendingMemes.tsx`**
- **`/Users/a0000/projects/memed/app/components/home/StatsSection.tsx`**
- **`/Users/a0000/projects/memed/app/components/home/CTASection.tsx`**
- **`/Users/a0000/projects/memed/app/components/home/Footer.tsx`**
- **`/Users/a0000/projects/memed/app/components/home/MobileMenu.tsx`**

### About Page Components
- **`/Users/a0000/projects/memed/app/components/about/`** (All 15+ components)
  - Various explainer sections for tokenomics, features, team, etc.

---

## 15. ADDITIONAL UTILITIES & CONFIGURATIONS

### Routing Configuration
- **`/Users/a0000/projects/memed/app/routes.ts`**
  - Route definitions and path constants

### Store (State Management)
- **`/Users/a0000/projects/memed/app/store/auth.ts`**
  - Auth state store (probably Zustand or similar)

### Types
- **`/Users/a0000/projects/memed/app/types/`**
  - TypeScript type definitions

### Search Component
- **`/Users/a0000/projects/memed/app/components/app/search/MemeTokensSearchList.tsx`**
  - Search results display

---

## COMMENTING PRIORITY LEVELS

### HIGH PRIORITY (Critical for understanding)
1. `useApi.ts` - Core data fetching pattern
2. `client.ts` (API client) - Request handling
3. `config.ts` (API) - Configuration management
4. `Web3Provider.tsx` - Web3 setup
5. Contract hooks (useMemedFactory, useMemedTokenSale)
6. `root.tsx` - App entry point
7. `meme.tsx` (route) - Complex state management

### MEDIUM PRIORITY (Important flows)
1. Launch flow components and route
2. Trade/Stake/Unstake forms
3. Battle components
4. Mint warrior components
5. Auth hooks
6. Environment/config files

### LOWER PRIORITY (Reference/supplementary)
1. Marketing page components
2. Individual form components
3. Utility components
4. Display-only components

---

## COMMENTING GUIDELINES

For each file, include:
1. **File Purpose**: What does this file do?
2. **Key Exports**: What's exported and why?
3. **Dependencies**: What external libraries/hooks does it use?
4. **Usage Examples**: How is this file used in the codebase?
5. **Complex Logic**: Explain any non-obvious algorithms or patterns
6. **Type Definitions**: Explain complex types
7. **Error Handling**: How are errors managed?
8. **Security Notes**: Any security considerations?

