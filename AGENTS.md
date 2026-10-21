## Running it (Base44 sandbox)

- `docker compose -f docker-compose.base44.yml up -d` starts the whole app: one service, `web`, running `bun install --frozen-lockfile` then `bun run dev` (Vite dev server) with the repo bind-mounted, so edits hot-reload (verified: saving a route file logs `hmr update`). Dependencies live in the `web_node_modules` volume and are synced from `bun.lock` on every start — do not install them on the host.
- The Vite config wrapper (`@lovable.dev/vite-tanstack-config`) pins the dev server to port **8080**; compose maps host **3000 → 8080**, which is the preview entry point. `--host 0.0.0.0 --strictPort` is set on the command so a bind change fails loudly instead of silently moving ports.
- No credentials are required. City data comes from public open-data feeds (ArcGIS/Socrata etc.) fetched server-side in `src/lib/food-sites.server.ts`; favorites stay in device localStorage. `.base44/environment.json` therefore lists no secrets.
- The compose service passes `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` through, which Vite 8 appends to `server.allowedHosts` so the preview proxy's Host header is accepted. No Vite config change was needed for hosts.
- Healthcheck probes the real page (`fetch http://127.0.0.1:8080/`) with bun, since the bun image has no curl/wget.
- Verification: open `/`, then the Los Angeles card, then any place — the list holds ~340 LA sites (20 shown per page) and the detail page shows hours/phone/directions. Console errors and failed requests are both empty.

- Favorites and last-loaded city lists live only in device localStorage (no accounts) — the site promises nothing is stored on our servers.
- City lists are slimmed and cached in memory server-side; public/sw.js gives network-first offline fallback — keeps the site usable on weak connections.
