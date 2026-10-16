# Low-bandwidth mode + Saved pantries

## 1. Make the site light on slow connections
- **Fonts:** Stop downloading the web font. Use the phone's built-in fonts. That saves a download on every first visit.
- **Smaller pantry lists:** The server sends only the fields the list and detail pages show. Long text gets trimmed and big lists get compressed, so each city downloads much less.
- **Server-side caching:** City lists are cached on the server for about 30 minutes. Pages load fast, and we don't hit the city data feeds every time someone visits.
- **Remember lists on the phone:** The last list loaded for each city is kept on the device. On a return visit it shows right away, even with a weak or dropped signal, and refreshes quietly in the background. A small note says "Showing saved list from (time)" when the list came from the phone.
- **Works offline after the first visit:** A small offline helper keeps the page shell and the last lists. If the connection drops, the site still opens and shows saved pantries plus the 211 number.
- **Lighter pages:** No images. Fewer icons. Animations turn off on phones set to reduce motion. Pages load 20 places at a time instead of 40.
- **"Slow connection" notice:** If the phone reports a weak connection, show a short line saying the site is in light mode.

## 2. Save pantries as favorites
- A **"Save this place"** star button on every pantry card and detail page. Tapping it again removes the place.
- A new **"My saved places"** page linked from the header, with a count. It groups saved places by city and shows name, today's hours, address, and Call/Directions, using the same card design.
- Saved places are **stored only on this phone**. No account and nothing sent to us, so the "nothing saved" promise in the header stays true for our servers. The tagline changes to: "No sign up, no ID. Anything you save stays on your phone."
- Each saved place keeps a copy of its details, so it opens **offline** and still shows if the city removes it from their list. In that case it gets a "may have closed, call first" note.
- A "Remove all saved places" button for shared or borrowed phones.

## Technical details
- Favorites: `src/lib/favorites.ts`. It uses a localStorage store (`fff:favorites:v1`) with a `useFavorites()` hook built on `useSyncExternalStore`. It reads only after hydration so the server and browser render the same thing. New route: `src/routes/saved.tsx` with its own head() info. New `FavoriteButton` component with `aria-pressed` and a polite screen-reader announcement.
- Payload: a `toListSite()` projection in `food-sites.functions.ts`, plus an in-memory server cache keyed by city with a TTL.
- Query persistence: keep the TanStack Query cache in localStorage per city with `gcTime` set to 24h. Use the cached data first, then refetch in the background.
- Offline: a small hand-written `public/sw.js` (network-first for pages, cache fallback). It's registered in `__root.tsx` and only runs in production.
- Remove the font `<link>` from `__root.tsx` and set a system font stack in `styles.css`. Lower `PAGE_SIZE` to 20. Detect slow connections with `navigator.connection.effectiveType`.
