# Image Loading Issues Analysis

## Summary
The application has two main image loading problems causing layout shifts and slow load times:
1. **Meme Detail Page (MemeIntroCard)** - Large hero image with no fixed dimensions or aspect ratio
2. **Token List (MemeTokenCard)** - Multiple small images in grid layout with no loading states

---

## 1. MEME DETAIL PAGE - MemeIntroCard Component

**File Path:** `/Users/a0000/projects/memed/app/components/app/meme/MemeCard.tsx`

**Route:** `/explore/meme/:memeId` (loaded via `/Users/a0000/projects/memed/app/routes/app/meme.tsx`)

### Current Implementation (Lines 22-28)
```tsx
<div className="w-full md:w-1/6 h-full">
  <img
    src={imageUrl}
    alt={tokenName}
    className="w-full h-full rounded-xl object-cover"
  />
</div>
```

### Issues Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| **No fixed width/height on img tag** | HIGH | Varying image dimensions cause layout shifts (CLS) |
| **Uses `h-full` (height: 100%)** | HIGH | Height depends on container, creates timing issues |
| **No aspect ratio control** | HIGH | Different sized images distort layout |
| **No loading attribute** | MEDIUM | Images load synchronously, blocks layout |
| **No lazy loading** | MEDIUM | Eager loads off-screen images |
| **No placeholder/skeleton** | MEDIUM | White space while loading looks like delay |
| **Uses `object-cover`** | LOW | May crop images unexpectedly |

### Technical Details
- **Line 19:** Container has `className="bg-neutral-900 text-white p-4 rounded-xl mx-auto"`
- **Line 22:** Image container is `w-full md:w-1/6 h-full` (width changes at md breakpoint, height is 100%)
- **Line 23-27:** Image has no explicit dimensions, relies on CSS sizing only
- **Image URL sources:** Priority: `token.image?.s3Key` → `token.metadata?.imageUrl` → fallback `meme` placeholder

---

## 2. TOKEN LIST - MemeTokenCard Component

**File Path:** `/Users/a0000/projects/memed/app/components/app/explore/MemeTokenCard.tsx`

**Route:** `/app/explore` (loaded via `/Users/a0000/projects/memed/app/routes/app/explore.tsx`)

**Used in:** `MemeTokensList.tsx` (lines 69-71)

### Current Implementation (Lines 42-47)
```tsx
<img
  src={token.image}
  alt={token.name}
  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg object-cover flex-shrink-0"
/>
```

### Issues Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| **Responsive sizing with no aspect ratio** | MEDIUM | Multiple img sizes (12px, 14px, 16px) without aspect ratio |
| **No fixed dimensions on img tag** | MEDIUM | Relies on CSS classes for sizing |
| **No loading attribute** | MEDIUM | All images load eagerly on page load |
| **No placeholder/skeleton** | MEDIUM | Empty space while loading (especially slow networks) |
| **No lazy loading** | MEDIUM | Card images below fold load immediately |
| **Uses `object-cover`** | LOW | May crop images |

### Technical Details
- **Line 42-47:** Card image layout with responsive classes
- **Image URL source:** `token.metadata?.imageUrl` with fallback to `meme` placeholder
- **Grid layout:** Grid with 1-4 columns depending on screen size (lines 69 in MemeTokensList.tsx)
- **No loading states** for individual cards

---

## 3. IMAGE URL SOURCES

### MemeIntroCard (meme.tsx)
- **Source 1:** `token.image?.s3Key` (S3 stored image)
- **Source 2:** `token.metadata?.imageUrl` (metadata-stored image)
- **Source 3:** `meme` placeholder (imported at line 3)
- **Code:** Line 12 in MemeCard.tsx

### MemeTokenCard (explore.tsx)
- **Source 1:** `token.metadata?.imageUrl` (metadata-stored image)
- **Source 2:** `meme` placeholder (imported at line 5 in explore.tsx)
- **Code:** Line 30 in explore.tsx

---

## 4. RELATED COMPONENTS

### LoadingState Component
**File:** `/Users/a0000/projects/memed/app/components/app/meme/LoadingState.tsx`
- Currently only shows spinner
- No image skeleton/placeholder
- Could be enhanced for better UX

### MemeTokensList Component
**File:** `/Users/a0000/projects/memed/app/components/app/explore/MemeTokensList.tsx`
- Renders MemeTokenCard in grid (lines 69-71)
- No loading states for cards
- No image skeletons during load

---

## 5. ROOT CAUSES

| Problem | Root Cause |
|---------|-----------|
| Layout shift (CLS) | No fixed aspect ratio on hero image |
| Slow perceived load | No loading skeletons/placeholders |
| Responsive images break | CSS-based sizing without aspect ratio preservation |
| No lazy loading | `loading` attribute missing, all images eager-load |
| Off-screen images load | No lazy loading on explore page |

---

## 6. NEXT IMAGE CONSIDERATIONS

The app could use `<Image>` component from an image optimization library, but currently uses plain `<img>` tags:
- No Next.js Image component detected
- No image optimization library in use
- All optimization must be CSS/HTML based

---

## TODO CHECKLIST

- [ ] **MemeIntroCard:** Add fixed aspect ratio container
- [ ] **MemeIntroCard:** Add width/height to img tag
- [ ] **MemeIntroCard:** Add loading="lazy" attribute
- [ ] **MemeIntroCard:** Add image skeleton loader
- [ ] **MemeTokenCard:** Add loading="lazy" attribute  
- [ ] **MemeTokenCard:** Add aspect ratio preservation
- [ ] **MemeTokenCard:** Add image skeleton/placeholder
- [ ] **MemeTokensList:** Create image skeleton component
- [ ] **Testing:** Verify layout stability (no CLS)
- [ ] **Testing:** Check image load times on slow network

---

## OPTIMIZATION STRATEGY

### Phase 1: Quick Wins (CSS/HTML only)
1. Add `loading="lazy"` to all img tags
2. Add explicit `width` and `height` to img tags
3. Use CSS aspect ratio to prevent layout shift

### Phase 2: Loading States
1. Create image skeleton component
2. Add skeleton to MemeIntroCard
3. Add skeleton to MemeTokenCard
4. Improve LoadingState component

### Phase 3: Advanced (if needed)
1. Add image blur-up placeholder
2. Implement progressive image loading
3. Add error state for failed images

