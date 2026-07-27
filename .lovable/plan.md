## Goal

A very simple, high-contrast, low-bandwidth site where someone can pick their city, optionally share their location, and immediately get a plain list of the closest free food sites — with hours, phone, and a one-tap directions link.

## What I verified

The Philadelphia layer you gave works and returns per-site: name, address, phone, website, category, status/temporary closure, ZIP, and full open/close times for every day of the week, plus point coordinates. That's exactly the shape needed for "hours & phone" and distance sorting.

For NYC, Chicago, and Kansas City I'll find each city's equivalent public open-data endpoint (ArcGIS FeatureServer where available) and normalize every city into one common record shape. If a city has no reliable public feed, I'll say so plainly and mark that city as "coming soon" rather than ship fake listings.

## User flow

```text
Home  ->  "Where are you?"  [ New York City ] [ Chicago ]
                            [ Kansas City  ] [ Philadelphia ]
          |
City page ->  [ Use my location ]  (optional, one big button)
          ->  List of sites, closest first (or A-Z if no location)
          |
Each card ->  Name
              Open now / Closed  + today's hours
              Address  + 0.4 mi away
              [ Call ]  [ Directions ]
```

## Pages

- `/` — one question: which city. Four large tap targets. Short plain-language intro, no marketing.
- `/city/$city` — location button, results list, filters kept minimal (Open now, category).
- `/city/$city/$siteId` — full detail: all week hours, phone, website, address, transit/walking directions links.
- `/about` — what this is, where data comes from, how to report a wrong listing.

## Accessibility and simplicity commitments

- List-first, no map widget; directions open in the phone's own maps app.
- Large text (18px+ body), 44px+ tap targets, high-contrast tokens, works at 200% zoom.
- Full keyboard support, real headings, one `<main>`, screen-reader labels on every icon button.
- Works without JavaScript-heavy interaction and without granting location — location is always optional, never a gate.
- Fast on a weak connection: text list, no heavy images, results cached.

## Technical notes

- Data fetched server-side via a TanStack server function per city adapter, so the browser never hits four different upstream APIs directly and results are cached (~30 min). Each adapter maps its city's fields into one shared `FoodSite` type: `{ id, name, address, phone, website, lat, lng, category, hours[7], notes, closed }`.
- Philadelphia adapter: query the provided FeatureServer with `outFields=*&f=geojson&outSR=4326` so coordinates come back as lat/lng.
- Distance: browser geolocation, haversine sort client-side. No location = alphabetical list with a search box for address/ZIP text match.
- "Open now" computed from the per-day start/end fields in the city's local timezone.
- Directions: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=transit` plus a walking option.
- Per-route SEO metadata (e.g. "Free food banks in Philadelphia — hours and locations").
- No backend/database needed; nothing about the user is stored, and location never leaves the device.

## Design direction

Calm, utilitarian, poster-clear — closer to a transit sign than an app. Warm neutral background, strong dark text, one high-visibility action color for Call/Directions, generous spacing, no decorative imagery.
