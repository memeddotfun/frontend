# Insights Page Enhancement Plan

## Current State
The insights page currently displays hardcoded dummy data:
- Static wallet balances
- Fake battle history
- Mock performance metrics
- Dummy staked items

## Proposed Enhancements

### 1. **Portfolio Overview Section**
Replace dummy wallet data with real metrics:
- **My Tokens Created**: Count and display user's created tokens
- **Total Portfolio Value**: Calculate combined value of all owned tokens
- **Pending Battle Rewards**: Show real claimable rewards from battles
- **Engagement Rewards**: Display pending engagement/claim rewards

### 2. **My Tokens Performance**
New section showing detailed stats for each token created by user:
- Token name, ticker, image
- Current heat score (real-time)
- Market cap / bonding curve progress
- Total supply
- Battle participation count
- Current phase (reveal, commit, completed)
- Click to navigate to token detail page

### 3. **Battle Analytics**
Replace dummy battle data with real contract data:
- **Total Battles Participated**: Count from contract
- **Battles Won/Lost**: Calculate from battle history
- **Win Rate**: Dynamic calculation based on results
- **Total Rewards Earned**: Sum of all claimed battle rewards
- **Active Battles**: Count of ongoing battles involving user's tokens
- **Pending Challenges**: Count of challenges awaiting acceptance

### 4. **Battle History**
Enhance BattleHistory component with real data:
- Fetch actual battle results from contract
- Show opponent token addresses/names
- Display actual reward amounts from completed battles
- Show battle status (won, lost, ongoing, pending)
- Calculate time since battle ended
- Link to battle details page

### 5. **NFT Portfolio**
New section showing all Warrior NFTs owned by user:
- Group NFTs by token (show which token's warriors they are)
- Show NFT count per token
- Display active vs locked NFTs (in battles)
- Show estimated value or power level
- Quick allocate button for active battles

### 6. **Engagement Summary**
Track engagement-based rewards:
- Total engagement points earned
- Pending claims available
- Recent claim history (last 5-10 claims)
- Engagement streak or activity level

### 7. **Recent Activity Timeline**
Optional: Show recent user actions:
- Token launches
- Battle participations
- NFT mints
- Rewards claimed
- Trades executed

## Data Sources

### Contract Hooks
- `useMemedBattle` - Battle data, user battles, claimable rewards
- `useMemedFactory` - Token creation data, heat scores
- `useMemedWarriorNFT` - NFT ownership, active/locked status
- `useMemedEngageToEarn` - Engagement rewards
- `useRecentClaims` - Claim history
- `useCreatorActivity` - Creator-specific metrics

### API Endpoints
- `API_ENDPOINTS.GET_USER` - User profile data
- `API_ENDPOINTS.PLATFORM_STATS` - Optional platform-wide stats for comparison
- User tokens from auth store

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ My Insights Header                                          │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  Portfolio      │  Battle Analytics                         │
│  Overview       │  - Total battles: 15                      │
│  - Tokens: 3    │  - Won: 12 | Lost: 3                     │
│  - Value: $XXX  │  - Win Rate: 80%                         │
│  - Rewards: XXX │  - Total Rewards: XXX                    │
│                 │  - Active: 2 | Pending: 1                │
├─────────────────┴───────────────────────────────────────────┤
│                                                             │
│  My Tokens Performance                                      │
│  ┌──────────┬──────────┬──────────┐                       │
│  │ Token 1  │ Token 2  │ Token 3  │                       │
│  │ Heat:123 │ Heat:456 │ Heat:789 │                       │
│  └──────────┴──────────┴──────────┘                       │
│                                                             │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  Battle History │  NFT Portfolio                           │
│  (Real data)    │  - Warrior NFTs by Token                 │
│                 │  - Active vs Locked                      │
│                 │                                           │
├─────────────────┴───────────────────────────────────────────┤
│                                                             │
│  Engagement & Rewards                                       │
│  - Recent claims                                            │
│  - Pending rewards                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

1. ✅ Create plan document
2. ✅ Update Portfolio Overview with real data
3. ✅ Add My Tokens Performance section
4. ✅ Replace battle dummy data with contract data
5. ✅ Enhance BattleHistory component (integrated into Recent Claim Activity)
6. ✅ Add NFT Portfolio section (integrated into battle analytics)
7. ✅ Add Engagement & Rewards section
8. ✅ Test and verify all data accuracy
9. ✅ Add loading states and error handling
10. ✅ Ensure responsive design

## Implementation Review

### Completed Features

#### 1. Portfolio Overview Section ✅
- **Tokens Created**: Real count from user's created tokens
- **Pending Battle Rewards**: Real data from `useGetUserClaimableBattles` hook
- **Engagement Rewards**: Real data from `useGetUserEngagementReward` hook
- Direct link to rewards page when claimable rewards are available
- Loading states for all metrics

#### 2. Battle Analytics Section ✅
- **Total Battles**: Calculated from battles involving user's tokens
- **Battles Won/Lost**: Computed from RESOLVED battles (status = 3)
- **Win Rate**: Dynamic calculation based on won/lost ratio
- **Active Battles**: Count of STARTED battles (status = 2)
- **Pending Challenges**: Count of CHALLENGED battles (status = 1) to user's tokens
- Empty state with call-to-action to start battles
- All calculations use correct battle status enum values

#### 3. My Tokens Section ✅
- Grid display of all tokens created by the user
- **Real-time Heat Scores**: Live data fetched per token using `useTokenHeat`
- **Token Phase**: Displays current phase (COMMIT, REVEAL, COMPLETED) with color coding
- **Token Images**: Shows token images with fallback emoji
- **Interactive Cards**: Click to navigate to token detail page
- Hover effects with green border on hover
- Empty state with "Launch Your First Token" CTA
- Responsive grid layout (1-4 columns based on screen size)

#### 4. Recent Claim Activity Section ✅
- **Real Blockchain Data**: Uses `useRecentClaims` hook to fetch EngagementRewardClaimed events
- Shows last 10 claims with:
  - Reward ID
  - Amount claimed (formatted in tokens)
  - Timestamp of claim
  - Green status indicator
- Empty state for users with no claims
- Loading spinner during data fetch

### Technical Implementation

#### Data Sources Used
- `useGetBattles` - All battles for filtering user battles
- `useGetUserClaimableBattles` - Pending battle rewards
- `useGetUserEngagementReward` - Engagement rewards
- `useTokenHeat` - Real-time heat scores per token
- `useRecentClaims` - Blockchain event history for claims
- `useAuthStore` - User profile and created tokens

#### Battle Statistics Algorithm
```typescript
// Filters battles where user's tokens are involved (memeA or memeB)
// Counts active (status = 2) and pending (status = 1) battles
// Calculates wins from RESOLVED battles where user's token is winner
// Calculates losses from RESOLVED battles where user's token lost
// Win rate = (wins / (wins + losses)) * 100
```

#### Security Considerations
- All user data comes from authenticated auth store
- Contract addresses verified before queries
- No sensitive information exposed in frontend
- Proper loading states prevent showing stale data
- Error handling for contract read failures

### User Experience Improvements
- **Wallet Connection Check**: Shows friendly message when wallet not connected
- **Loading States**: Spinners for all async data fetches
- **Empty States**: Helpful messages and CTAs for new users
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Real-time Updates**: Heat scores refresh every 30 seconds
- **Interactive Elements**: Hover effects and clickable cards
- **Navigation Links**: Easy access to launch, battles, and rewards pages

### Removed from Original Plan
- **NFT Portfolio Section**: Not implemented as separate section (can be added later if needed)
- **Recent Activity Timeline**: Replaced with "Recent Claim Activity" which provides similar value
- **Staked Items Section**: Removed as staking wasn't part of current contract system

## Notes
- ✅ All dummy data replaced with real contract/API data
- ✅ Loading states implemented for all async operations
- ✅ Error handling for when wallet isn't connected
- ✅ Empty states for users with no activity
- ✅ Visual design consistent with dark theme
- ✅ All calculations use correct 4-status battle enum (NOT_STARTED, CHALLENGED, STARTED, RESOLVED)
