# ZipFood: mobile polish + Los Angeles focus

## 1. Rename to ZipFood
- Header logo text, page titles, and descriptions on every page (home, city, pantry, saved, about, not-found) say "ZipFood".
- Replace leftover "Food Engine" / "Free Food Finder" wording everywhere.

## 2. Put Los Angeles first
- Home page: a large featured "Los Angeles" card at the top ("Find free food in Los Angeles" with one big button), with the other cities in a smaller "Other cities" list below.
- City list order: Los Angeles first.
- Home page headline and share text mention Los Angeles (e.g. "Free food near you in Los Angeles").
- LA-specific help line on home and LA city page: call or text 211 LA County.
- About page wording leads with Los Angeles.

## 3. Mobile polish (phones ~360-430px wide)
- Header: smaller, tighter on phones; logo and menu on one row without wrapping awkwardly; reassurance line shorter on small screens.
- Menu links get bigger tap areas.
- Pantry cards: tighter padding, name and distance never squeeze each other, buttons full-width and stacked, phone number never overflows.
- City page: search box and "Use my location" full-width, sticky-friendly spacing, page buttons (Previous/Next) full-width on phones.
- Pantry detail page: action buttons stacked full-width, hours table readable without sideways scrolling.
- Respect phone safe areas (notches, bottom bar) and prevent text zoom jumps when tapping the search box.
- Check every page at 375px wide with screenshots and fix anything that clips or overflows.

## Technical details
- Files: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/city.$city.index.tsx`, `src/routes/city.$city.$siteId.tsx`, `src/routes/about.tsx`, `src/routes/saved.tsx`, `src/components/SiteCard.tsx`, `src/lib/food-sites.ts` (reorder `CITIES`, add `featured` flag), `src/styles.css` (safe-area padding, 16px min input font).
- Header row uses `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` per responsive rules.
- Save "App name ZipFood; Los Angeles is the primary audience" to project memory.
- Verify with Playwright at 375x812.
