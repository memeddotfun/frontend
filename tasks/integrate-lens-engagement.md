# Integrate Lens Engagement API

## Goal
Replace dummy social media stats with real data from `/api/lens-engagement/:handle` endpoint.

## Todo Items
- [x] Add `useLensEngagementByHandle` hook to useMemedApi.ts
- [x] Update SocialMediaStats component to accept handle prop
- [x] Fetch real engagement data and display it
- [x] Add loading and error states
- [x] Pass lens handle from meme.tsx to SocialMediaStats
- [x] Log the engagement data for verification

## Implementation Details

### Endpoint
- Path: `/api/lens-engagement/:handle`
- Method: GET
- Returns: Lens engagement metrics

### Changes Required
1. Create new API hook for handle-based engagement lookup
2. Update SocialMediaStats to be dynamic instead of static
3. Extract lens handle from token user data
4. Pass handle down from parent component

## Review

### Changes Summary

#### 1. Added `useLensEngagementByHandle` Hook
**File**: `/Users/a0000/projects/memed/app/hooks/api/useMemedApi.ts:244-256`

Created a new API hook that:
- Accepts a Lens handle (username) as parameter
- Calls `/lens-engagement/:handle` endpoint
- Returns `LensEngagement` data with proper caching
- Has 5-minute cache duration for performance
- Only fetches when handle is provided

#### 2. Refactored SocialMediaStats Component
**File**: `/Users/a0000/projects/memed/app/components/app/meme/SocialMediaStats.tsx`

**Major Changes**:
- Added `lensHandle` prop interface
- Integrated `useLensEngagementByHandle` hook
- Replaced static dummy data with dynamic API data
- Added logging via `useEffect` to console.log engagement data
- Implemented `formatNumber` helper for displaying large numbers (K/M)
- Created dynamic stats array from engagement data

**UI States Added**:
1. **Loading State** (lines 65-69): Shows spinner while fetching data
2. **Error State** (lines 72-79): Displays error message if API fails
3. **No Handle State** (lines 82-86): Shows message when no Lens handle available
4. **Data Display** (lines 89-104): Shows engagement metrics when data loads

**Engagement Metrics Displayed**:
- Likes (with HeartIcon)
- Mirrors (with RepeatIcon)
- Comments (with MessageSquareIcon)
- Collects (with EyeIcon, replaced "Views")
- Score (with Share2Icon, replaced "Shares")

#### 3. Updated Meme Detail Page
**File**: `/Users/a0000/projects/memed/app/routes/app/meme.tsx:337-359`

**Changes**:
- Lines 337-340: Extract Lens handle from `token.user.socials` array
- Filters for social type "LENS" and gets username
- Line 359: Pass `lensHandle` prop to SocialMediaStats component

### Benefits

1. **Real Data**: Social stats now show actual Lens engagement metrics instead of dummy data
2. **Better UX**: Loading states, error handling, and empty states provide feedback
3. **Performance**: 5-minute caching prevents excessive API calls
4. **Debugging**: Console logging helps verify data is being fetched correctly
5. **Maintainability**: Clean separation of concerns with dedicated API hook

### Security Notes

- All data fetched from internal API (no direct external calls)
- Handle is extracted from authenticated user's social data
- No user input vulnerability (handle comes from backend)
- Proper error handling prevents crashes on API failures
- Type safety maintained with TypeScript interfaces
