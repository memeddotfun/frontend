# Fix Landing Page Sections - Trending Memes & Analytics/Stats

## Overview
Fix two main sections on the landing page (home.tsx):
1. **TrendingMemes** - Currently using dummy data, needs real token data
2. **StatsSection** - Currently using hardcoded stats, needs real platform analytics

## Analysis Summary

### 1. Trending Memes Section
**File**: `/Users/a0000/projects/memed/app/components/home/TrendingMemes.tsx`

**Current Issues**:
- Using hardcoded dummy data (all identical "GLMP" tokens)
- All 4 cards show same image, price, market cap
- No connection to real API
- Data doesn't reflect actual trending tokens

**Current Data Structure**:
```typescript
{
  id: string;
  title: string;        // Hardcoded as "GLMP"
  creator: string;      // Hardcoded as "Rebeca"
  image: StaticImage;   // Same meme.png for all
  price: string;        // Hardcoded as "$14k"
  marketCap: string;    // Hardcoded as "Market Cap: 30k"
  change24h: number;    // Hardcoded as 24
  volume: string;       // Hardcoded as "30k"
}
```

**MemeCard Component Issues**:
- Receives props but ignores some (price, volume not used)
- Hardcodes "14M" flame count
- Hardcodes "$3.2k" market cap instead of using prop

### 2. Stats Section (Analytics)
**File**: `/Users/a0000/projects/memed/app/components/home/StatsSection.tsx`

**Current Issues**:
- All stats are hardcoded dummy values
- No Lens references found (good!)
- No connection to real platform data

**Current Stats**:
1. **Circulating Supply**: "1.2M MEME" (should show real supply)
2. **Active Battles**: "420" (should show real battle count)
3. **Avg Price**: "$0.0042" (should show real average token price)

### 3. Available APIs & Hooks

**Token Data APIs**:
- `useMemeTokens()` - Fetches all tokens from `/tokens` endpoint
- `useMemeToken(tokenId)` - Fetches single token details
- `useTokenAnalytics(tokenId, timeframe)` - Token-specific analytics with price change, volume, etc.

**Platform Analytics APIs**:
- `usePlatformStats()` - Fetches platform-wide statistics from `/analytics/platform`
  - Returns: `totalTokens`, `totalVolume`, `totalUsers`, `activeBattles`, `totalStaked`
  
**Battle APIs**:
- `useTokenBattles()` - Fetches all battles from `/battles` endpoint

**Available Token Interface** (from explore page):
```typescript
interface Token {
  id: string;
  name: string;
  ticker: string;
  description: string;
  userId: string;
  address?: string;
  fairLaunchId?: string;
  createdAt: string;
  metadata?: {
    name: string;
    ticker: string;
    description: string;
    imageUrl: string;
  }
}
```

## Implementation Plan

### Task List

#### Phase 1: Stats Section (Simpler)
- [ ] Import `usePlatformStats` hook from `@/hooks/api/useMemedApi`
- [ ] Add hook call to fetch real platform data
- [ ] Add loading state handling (show skeleton or spinner)
- [ ] Add error state handling (show fallback or error message)
- [ ] Update stat cards to use real data:
  - [ ] Replace "Circulating Supply" with `totalStaked` (more relevant than supply)
  - [ ] Replace "Active Battles" with `activeBattles` from API
  - [ ] Replace "Avg Price" with calculated value from `totalVolume / totalTokens`
- [ ] Format numbers properly (use abbreviations: 1.2M, 42K, etc.)
- [ ] Add percentage change indicators if API provides them
- [ ] Test with both success and error states

#### Phase 2: Trending Memes Section
- [ ] Import `useMemeTokens` hook from `@/hooks/api/useMemedApi`
- [ ] Optionally import `useTokenAnalytics` for additional metrics
- [ ] Add hook call to fetch all tokens
- [ ] Add loading state (skeleton cards or spinner)
- [ ] Add error state (show fallback message)
- [ ] Implement token filtering/sorting logic:
  - [ ] Sort by market cap (descending) or creation date
  - [ ] Filter to show top 4 trending tokens
  - [ ] Handle case where < 4 tokens exist
- [ ] Map token data to MemeCard props:
  - [ ] Use `token.metadata.name` for title
  - [ ] Use shortened `token.userId` for creator
  - [ ] Use `token.metadata.imageUrl` for image (handle S3 URL if needed)
  - [ ] Calculate or fetch real market cap
  - [ ] Calculate or fetch 24h change
- [ ] Fix MemeCard component to use all passed props:
  - [ ] Remove hardcoded "14M" flame count
  - [ ] Remove hardcoded "$3.2k" market cap
  - [ ] Use props correctly
- [ ] Add fallback image if token image fails to load
- [ ] Test with various data scenarios

#### Phase 3: Polish & Testing
- [ ] Add proper TypeScript types for all new data
- [ ] Ensure consistent number formatting across both sections
- [ ] Add proper loading skeletons (match existing design)
- [ ] Test error boundaries
- [ ] Verify mobile responsiveness
- [ ] Check image loading performance
- [ ] Ensure no console errors
- [ ] Test with empty data states
- [ ] Add comments explaining data transformations

## Technical Notes

### Data Flow
1. **Home page** (`/app/routes/home.tsx`) renders both components
2. **Components** use hooks to fetch data client-side (no SSR needed for landing page)
3. **Hooks** call API endpoints via `apiClient`
4. **Cache** is handled automatically by hooks (2-5 minute TTL)

### API Response Format
All API responses follow this structure:
```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}
```

### Number Formatting Helper
Consider creating a utility function:
```typescript
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
```

### Image Handling
- Token images are stored as S3 keys in `metadata.imageUrl`
- May need to construct full S3 URL
- Fallback to `meme.png` if image fails to load

## Security Considerations
- ✅ No sensitive data in frontend (already using proper auth)
- ✅ API calls use credentials: "include" (handled by apiClient)
- ✅ No direct contract addresses or private keys exposed
- ✅ All data fetched from backend API (no direct blockchain calls on landing page)

## Files to Modify
1. `/Users/a0000/projects/memed/app/components/home/StatsSection.tsx` - Add real stats
2. `/Users/a0000/projects/memed/app/components/home/TrendingMemes.tsx` - Add real tokens
3. `/Users/a0000/projects/memed/app/components/home/MemeCard.tsx` - Fix hardcoded values
4. Optionally create `/Users/a0000/projects/memed/app/utils/formatters.ts` - Number formatting helper

## Dependencies Already Available
- ✅ `useApi` hook system
- ✅ `useMemeTokens` hook
- ✅ `usePlatformStats` hook
- ✅ `apiClient` with retry logic
- ✅ API endpoints configured
- ✅ Token types defined

## Review Section
(To be filled after implementation)

### Changes Made:
- TBD

### Testing Results:
- TBD

### Issues Encountered:
- TBD

### Next Steps:
- TBD
