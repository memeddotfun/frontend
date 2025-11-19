# Memed.fun - Files by Priority for Commenting

## HIGH PRIORITY (Start Here) - 25 Files
These are critical for understanding the codebase architecture and common patterns.

### Core Application Setup (5 files)
```
/Users/a0000/projects/memed/app/root.tsx
/Users/a0000/projects/memed/app/providers/Web3Provider.tsx
/Users/a0000/projects/memed/app/config/chains.ts
/Users/a0000/projects/memed/app/config/contracts.ts
/Users/a0000/projects/memed/app/utils/env.ts
```

### API Client & Configuration (4 files)
```
/Users/a0000/projects/memed/app/lib/api/client.ts
/Users/a0000/projects/memed/app/lib/api/config.ts
/Users/a0000/projects/memed/app/lib/lens/client.ts
/Users/a0000/projects/memed/app/lib/api/loaders.ts
```

### Core Data Fetching Hooks (3 files)
```
/Users/a0000/projects/memed/app/hooks/useApi.ts
/Users/a0000/projects/memed/app/hooks/api/useAuth.ts
/Users/a0000/projects/memed/app/hooks/api/useMemedApi.ts
```

### Smart Contract Integration Hooks (6 files)
```
/Users/a0000/projects/memed/app/hooks/contracts/useMemedFactory.ts
/Users/a0000/projects/memed/app/hooks/contracts/useMemedTokenSale.ts
/Users/a0000/projects/memed/app/hooks/contracts/useMemedBattle.ts
/Users/a0000/projects/memed/app/hooks/contracts/useMemedToken.ts
/Users/a0000/projects/memed/app/hooks/contracts/usePaymentToken.ts
/Users/a0000/projects/memed/app/hooks/contracts/useMemedBattleResolver.ts
```

### Complex Core Components (7 files)
```
/Users/a0000/projects/memed/app/routes/app/meme.tsx
/Users/a0000/projects/memed/app/components/app/meme/TradeForm.tsx
/Users/a0000/projects/memed/app/routes/app/launch.tsx
/Users/a0000/projects/memed/app/components/app/launch/CreateMemeForm.tsx
/Users/a0000/projects/memed/app/components/app/meme/CommitETHForm.tsx
/Users/a0000/projects/memed/app/components/app/mint-warriors/MintWarriorPanel.tsx
/Users/a0000/projects/memed/app/components/shared/ClientConnectButton.tsx
```

---

## MEDIUM PRIORITY (Secondary) - 50 Files
Important for understanding specific features, but not critical for basics.

### Additional Contract Hooks (5 files)
```
/Users/a0000/projects/memed/app/hooks/contracts/useMemedWarriorNFT.ts
/Users/a0000/projects/memed/app/hooks/contracts/useMemedEngageToEarn.ts
/Users/a0000/projects/memed/app/hooks/contracts/useRecentClaims.ts
/Users/a0000/projects/memed/app/hooks/contracts/useWarriorPriceHistory.ts
/Users/a0000/projects/memed/app/hooks/contracts/useCreatorActivity.ts
```

### Meme Detail Page Components (10 files)
```
/Users/a0000/projects/memed/app/components/app/meme/MemeCard.tsx
/Users/a0000/projects/memed/app/components/app/meme/LaunchProgress.tsx
/Users/a0000/projects/memed/app/components/app/meme/CommitGHOForm.tsx
/Users/a0000/projects/memed/app/components/app/meme/StakeForm.tsx
/Users/a0000/projects/memed/app/components/app/meme/UnstakeForm.tsx
/Users/a0000/projects/memed/app/components/app/meme/ReadyToLaunch.tsx
/Users/a0000/projects/memed/app/components/app/meme/ClaimTokenPanel.tsx
/Users/a0000/projects/memed/app/components/app/meme/RefundPanel.tsx
/Users/a0000/projects/memed/app/components/app/meme/ActiveBattles.tsx
/Users/a0000/projects/memed/app/components/app/meme/BattleHistory.tsx
```

### Launch Flow Components (3 files)
```
/Users/a0000/projects/memed/app/components/app/launch/TokenSettingForm.tsx
/Users/a0000/projects/memed/app/components/app/launch/ConnectProfile.tsx
```

### Battle Components (5 files)
```
/Users/a0000/projects/memed/app/routes/app/battles.tsx
/Users/a0000/projects/memed/app/components/app/battle/BattleSearchList.tsx
/Users/a0000/projects/memed/app/components/app/battle/Challenger.tsx
/Users/a0000/projects/memed/app/components/app/battle/Challenged.tsx
/Users/a0000/projects/memed/app/components/shared/BattleCard.tsx
```

### Explore & Discovery Components (7 files)
```
/Users/a0000/projects/memed/app/routes/app/explore.tsx
/Users/a0000/projects/memed/app/components/app/explore/MemeTokensList.tsx
/Users/a0000/projects/memed/app/components/app/explore/MemeTokenCard.tsx
/Users/a0000/projects/memed/app/components/app/explore/Leaderboard.tsx
/Users/a0000/projects/memed/app/components/app/explore/LeaderboardCard.tsx
/Users/a0000/projects/memed/app/components/app/explore/HorizontalCard.tsx
/Users/a0000/projects/memed/app/components/app/explore/Intro.tsx
```

### Mint Warriors Components (3 files)
```
/Users/a0000/projects/memed/app/components/app/mint-warriors/MintPriceAndHeat.tsx
/Users/a0000/projects/memed/app/components/app/mint-warriors/PriceHistory.tsx
```

### Shared Components (6 files)
```
/Users/a0000/projects/memed/app/components/shared/WalletConnection.tsx
/Users/a0000/projects/memed/app/components/shared/Web3ErrorBoundary.tsx
/Users/a0000/projects/memed/app/components/shared/UserDetail.tsx
/Users/a0000/projects/memed/app/components/shared/MemeImageUploader.tsx
/Users/a0000/projects/memed/app/components/app/AppHeader.tsx
/Users/a0000/projects/memed/app/components/app/Sidebar.tsx
```

### Additional Route Files (8 files)
```
/Users/a0000/projects/memed/app/routes/app/app.tsx
/Users/a0000/projects/memed/app/routes/app/mint.tsx
/Users/a0000/projects/memed/app/routes/app/search.tsx
/Users/a0000/projects/memed/app/routes/app/staking.tsx
/Users/a0000/projects/memed/app/routes/app/rewards.tsx
/Users/a0000/projects/memed/app/routes/app/insights.tsx
/Users/a0000/projects/memed/app/routes/app/creator.tsx
/Users/a0000/projects/memed/app/routes/app/settings.tsx
```

### Meme Detail Supporting Components (2 files)
```
/Users/a0000/projects/memed/app/components/app/meme/SocialMediaStats.tsx
/Users/a0000/projects/memed/app/components/app/meme/CountdownTimer.tsx
```

---

## LOW PRIORITY (Reference) - 45 Files
These can be commented later or rely on parent component docs.

### Routes & Pages (8 files)
```
/Users/a0000/projects/memed/app/routes/home.tsx
/Users/a0000/projects/memed/app/routes/about.tsx
/Users/a0000/projects/memed/app/routes/contact.tsx
/Users/a0000/projects/memed/app/routes/tokenomics.tsx
/Users/a0000/projects/memed/app/routes/$.tsx (catch-all)
```

### Home Page Components (7 files)
```
/Users/a0000/projects/memed/app/components/home/Header.tsx
/Users/a0000/projects/memed/app/components/home/HeroSection.tsx
/Users/a0000/projects/memed/app/components/home/TrendingMemes.tsx
/Users/a0000/projects/memed/app/components/home/StatsSection.tsx
/Users/a0000/projects/memed/app/components/home/CTASection.tsx
/Users/a0000/projects/memed/app/components/home/Footer.tsx
/Users/a0000/projects/memed/app/components/home/MobileMenu.tsx
```

### About Page Components (15+ files)
```
/Users/a0000/projects/memed/app/components/about/AboutDifferentiationSection.tsx
/Users/a0000/projects/memed/app/components/about/AntiSniperSection.tsx
/Users/a0000/projects/memed/app/components/about/BattleSystemSection.tsx
/Users/a0000/projects/memed/app/components/about/BondingCurveSection.tsx
/Users/a0000/projects/memed/app/components/about/ConclusionSection.tsx
/Users/a0000/projects/memed/app/components/about/EconomicProjectionsSection.tsx
/Users/a0000/projects/memed/app/components/about/FairLaunchSection.tsx
/Users/a0000/projects/memed/app/components/about/JoinUsSection.tsx
/Users/a0000/projects/memed/app/components/about/MissionSection.tsx
/Users/a0000/projects/memed/app/components/about/PlatformDifferentiationSection.tsx
/Users/a0000/projects/memed/app/components/about/StakingAndEngagementSection.tsx
/Users/a0000/projects/memed/app/components/about/StorySection.tsx
/Users/a0000/projects/memed/app/components/about/TeamSection.tsx
/Users/a0000/projects/memed/app/components/about/TechnologySection.tsx
/Users/a0000/projects/memed/app/components/about/TokenDistributionSection.tsx
/Users/a0000/projects/memed/app/components/about/VisionSection.tsx
```

### Loading & Utility Components (2 files)
```
/Users/a0000/projects/memed/app/components/app/meme/LoadingState.tsx
/Users/a0000/projects/memed/app/components/app/search/MemeTokensSearchList.tsx
```

### Configuration Files (3 files)
```
/Users/a0000/projects/memed/app/abi.ts
/Users/a0000/projects/memed/app/routes.ts
/Users/a0000/projects/memed/app/store/auth.ts
```

---

## Commenting Effort Estimate

| Priority | Files | Est. Hours | Time Per File |
|----------|-------|-----------|----------------|
| HIGH | 25 | 20 | 45-50 min |
| MEDIUM | 50 | 25 | 30 min |
| LOW | 45 | 10 | 15 min |
| **TOTAL** | **120** | **55** | **Average 27 min** |

---

## By Component Feature Area

### Token Creation & Management
**HIGH**: `launch.tsx`, `CreateMemeForm.tsx`, `useMemedFactory.ts`
**MEDIUM**: `TokenSettingForm.tsx`, `ConnectProfile.tsx`

### Token Trading
**HIGH**: `TradeForm.tsx`, `useMemedTokenSale.ts`
**MEDIUM**: None (depends on above)

### Token Launch (Fair Launch)
**HIGH**: `useMemedTokenSale.ts`
**MEDIUM**: `CommitETHForm.tsx`, `CommitGHOForm.tsx`, `ClaimTokenPanel.tsx`, `RefundPanel.tsx`

### Battle System
**HIGH**: `useMemedBattle.ts`
**MEDIUM**: `battles.tsx`, `BattleSearchList.tsx`, `Challenger.tsx`, `Challenged.tsx`, `BattleCard.tsx`

### Warrior NFT System
**HIGH**: `useMemedFactory.ts` (tokenHeat), `useMemedWarriorNFT.ts`, `MintWarriorPanel.tsx`
**MEDIUM**: `MintPriceAndHeat.tsx`, `PriceHistory.tsx`

### Staking & Rewards
**HIGH**: None (hooks need comments first)
**MEDIUM**: `StakeForm.tsx`, `UnstakeForm.tsx`, `useMemedEngageToEarn.ts`

### Token Discovery
**MEDIUM**: `explore.tsx`, `MemeTokensList.tsx`, `Leaderboard.tsx`

### User Authentication
**HIGH**: `useAuth.ts`
**MEDIUM**: `ClientConnectButton.tsx`, `WalletConnection.tsx`

### Image & Media Upload
**MEDIUM**: `MemeImageUploader.tsx`

---

## Dependency Map for Commenting

Start with **blue** files, then progress to **green**, then **orange**:

```
BLUE (Must comment first):
  root.tsx
    ↓ depends on
  Web3Provider.tsx
    ↓ depends on
  config/chains.ts, config/contracts.ts, utils/env.ts

GREEN (Comment second):
  lib/api/client.ts
  lib/api/config.ts
    ↓ depends on
  hooks/useApi.ts
  hooks/api/useAuth.ts

ORANGE (Comment third):
  hooks/contracts/useMemedFactory.ts
  hooks/contracts/useMemedTokenSale.ts
  hooks/contracts/useMemedBattle.ts
    ↓ depends on
  routes/app/meme.tsx
  components/app/meme/TradeForm.tsx
  routes/app/launch.tsx
    ↓ depends on
  All other components
```

---

## Quick File Lookup by Topic

### "I need to understand API calls"
1. `lib/api/client.ts` - HTTP client
2. `lib/api/config.ts` - Endpoints & error codes
3. `hooks/useApi.ts` - Generic hook pattern
4. Any component using `useApi()` or `useApiMutation()`

### "I need to understand Web3"
1. `providers/Web3Provider.tsx` - Setup
2. `config/chains.ts` - Network config
3. `config/contracts.ts` - Contract addresses
4. Any `hooks/contracts/` file for specific contracts

### "I need to understand token creation"
1. `routes/app/launch.tsx` - Main flow
2. `hooks/contracts/useMemedFactory.ts` - Smart contract
3. `components/app/launch/CreateMemeForm.tsx` - Form component

### "I need to understand fair launch"
1. `hooks/contracts/useMemedTokenSale.ts` - Contract hook
2. `components/app/meme/CommitETHForm.tsx` - ETH form
3. `components/app/meme/CommitGHOForm.tsx` - GHO form
4. `routes/app/meme.tsx` - Phase management

### "I need to understand battles"
1. `hooks/contracts/useMemedBattle.ts` - Contract hook
2. `routes/app/battles.tsx` - Routes
3. `components/app/battle/` - Battle components

### "I need to understand Warrior NFTs"
1. `hooks/contracts/useMemedFactory.ts` - Heat tracking
2. `hooks/contracts/useMemedWarriorNFT.ts` - NFT hook
3. `components/app/mint-warriors/MintWarriorPanel.tsx` - UI

---

## Comments Quick Checklist

For each HIGH PRIORITY file, ensure comments include:
- [ ] File purpose (1-2 sentence description)
- [ ] Key exports with usage examples
- [ ] Complex logic explained step-by-step
- [ ] Type definitions clarified
- [ ] Error handling documented
- [ ] Integration points highlighted
- [ ] Common gotchas or pitfalls noted

For MEDIUM files:
- [ ] File purpose
- [ ] Key exports
- [ ] Any complex logic
- [ ] References to related HIGH priority files

For LOW files:
- [ ] File purpose
- [ ] Reference to parent/related files
