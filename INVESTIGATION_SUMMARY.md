# Quick Reference: Investigation Summary

## Issue 1: Preview Page Edit UI

### Files
- **Main:** `/Users/a0000/projects/memed/app/components/app/launch/TokenSettingForm.tsx`
- **Route:** `/Users/a0000/projects/memed/app/routes/app/launch.tsx`

### What It Does
Step 3 of the token launch flow - shows a preview of token details with edit buttons for Name and Symbol.

### Theme Issues

| Component | Current | Issue | Fix |
|-----------|---------|-------|-----|
| Edit Buttons | `✏️` emoji, no className | No styling, no hover state | Add `rounded-lg`, `text-green-500`, hover effect |
| Modal Background | `bg-gray-900` | Wrong color family | Change to `bg-neutral-900` |
| Modal Border | `border-neutral-700` | Too dark | Change to `border-neutral-800` |
| Primary Button | `bg-primary` (undefined) | Undefined variable | Use `bg-green-600` consistently |
| Input Focus | No green focus state | Missing app accent | Add `focus:border-green-500 focus:ring-green-500/50` |

### Specific Lines to Fix
- **Edit buttons:** Lines 110-118 (Name), 130-138 (Symbol)
- **Modal dialogs:** Lines 239-281 (Name), 284-327 (Symbol)
- **Save buttons:** Lines 271-277, 317-323
- **Input fields:** Lines 253-259, 298-304

---

## Issue 2: Explorer Token List Ordering

### Files
1. `/Users/a0000/projects/memed/app/routes/app/explore.tsx`
2. `/Users/a0000/projects/memed/app/components/app/explore/MemeTokensList.tsx`
3. `/Users/a0000/projects/memed/app/lib/api/loaders.ts`

### What It Does
Displays tokens on the /explore page with a non-functional sort dropdown.

### Current Problems

| Problem | Location | Severity |
|---------|----------|----------|
| No sort dropdown handler | MemeTokensList.tsx:22-30 | **HIGH** |
| No state for sort preference | MemeTokensList.tsx | **HIGH** |
| No sorting logic implementation | MemeTokensList.tsx:19-37 | **HIGH** |
| No default ordering (newest first) | explore.tsx:13-33 | **HIGH** |
| Missing `createdAt` field in mapper | explore.tsx:18-33 | **HIGH** |
| API likely has timestamp but not extracted | explore.tsx:18-33 | **HIGH** |

### Implementation Order
1. Add `createdAt` to token mapper in explore.tsx
2. Add state + sorting logic to MemeTokensList.tsx
3. Connect dropdown to sorting logic
4. Set default sort to "New" (descending by createdAt)

### Key Code Locations
- **Dropdown:** MemeTokensList.tsx lines 22-30
- **Token render loop:** MemeTokensList.tsx lines 33-37
- **Token mapper:** explore.tsx lines 18-33
- **API config:** loaders.ts lines 211-214

---

## Data Structure Issue

### Token Interface
Currently does NOT include `createdAt`:
```tsx
interface Token {
  id: string;
  metadata?: { name?, ticker?, description?, imageKey? };
  userId?: string;
  fairLaunchId?: string;
  address?: string;
  // Missing: createdAt, popularity, marketCap data
}
```

### What You Need from API
The backend likely returns these fields. You need to:
1. Check what the API actually returns (inspect network tab)
2. Extract `createdAt` in the explore.tsx mapper
3. Extract other fields needed for sorting (popularity metrics, etc.)

---

## Theme Reference

### App Theme (from codebase)
- **Dark backgrounds:** `neutral-900`, `neutral-800`
- **Borders:** `neutral-800`, `neutral-700`
- **Primary accent (success):** `green-500`, `green-600`, `green-700`
- **Info accent:** `blue-500`
- **Error:** `red-500`
- **Text:** `text-white`, `text-gray-400`, `text-neutral-400`
- **Border radius:** `rounded-lg`, `rounded-xl`
- **Spacing:** Standard padding/gaps in `px-2`, `px-4`, `py-2`, `py-4`

### Recommended Green Accent Pattern
```tsx
// Primary action button
className="bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"

// Secondary action
className="border border-green-500/30 text-green-500 rounded-lg hover:bg-green-500/10 transition-colors"

// Focus states
className="focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"

// Hover effects on elements
className="hover:bg-green-500/20 hover:text-green-500 transition-colors"
```

---

## Quick Checklist

### For Issue 1 (Preview UI):
- [ ] Replace emoji edit buttons with proper styled buttons (rounded-lg, green-500)
- [ ] Update modal backgrounds from bg-gray-900 to bg-neutral-900
- [ ] Add green focus states to input fields
- [ ] Ensure all buttons use consistent green accent
- [ ] Test theme matches rest of app

### For Issue 2 (Token Ordering):
- [ ] Verify API returns createdAt field (check network tab)
- [ ] Add createdAt extraction to explore.tsx token mapper
- [ ] Add useState for sortBy in MemeTokensList
- [ ] Implement sorting logic with useMemo
- [ ] Connect dropdown onChange to setSortBy
- [ ] Render sortedTokens instead of tokens
- [ ] Set default to 'new' (newest first)
- [ ] Test all three sort options

---

## Files at a Glance

```
Preview UI:
  └── TokenSettingForm.tsx (lines 1-330)
      └── Edit dialogs (239-327)
      └── Edit buttons (110-118, 130-138)

Explorer Ordering:
  ├── explore.tsx (lines 1-123)
  │   └── Token mapper (18-33)
  ├── MemeTokensList.tsx (lines 1-91)
  │   ├── Dropdown (22-30)
  │   └── Render loop (33-37)
  └── loaders.ts (lines 211-214)
      └── API transformer
```

