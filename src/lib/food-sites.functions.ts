import { createServerFn } from "@tanstack/react-start";
import { CITIES, type CityId, type FoodSite } from "./food-sites";

const CITY_IDS = CITIES.map((c) => c.id) as string[];

export type CitySitesResult = {
  city: CityId;
  sites: FoodSite[];
  /** Set when the upstream feed could not be reached. */
  error: string | null;
  /** When the list was fetched (ms since epoch). */
  fetchedAt: number;
};

const TTL = 30 * 60 * 1000;
const cache = new Map<CityId, { at: number; sites: FoodSite[] }>();

function trim(s: string | null, max: number): string | null {
  if (!s) return s;
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

/** Keep only what the pages show, and cap long free text, to keep the download small. */
function slim(site: FoodSite): FoodSite {
  return {
    ...site,
    lat: Math.round(site.lat * 1e5) / 1e5,
    lng: Math.round(site.lng * 1e5) / 1e5,
    hoursText: trim(site.hoursText, 300),
    availability: trim(site.availability, 200),
    requirements: trim(site.requirements, 400),
    notes: site.notes.slice(0, 4).map((n) => trim(n, 300)!),
    offerings: site.offerings.slice(0, 12),
  };
}

export const getCitySites = createServerFn({ method: "GET" })
  .inputValidator((data: { city: string }) => {
    if (!CITY_IDS.includes(data.city)) throw new Error("Unknown city");
    return { city: data.city as CityId };
  })
  .handler(async ({ data }): Promise<CitySitesResult> => {
    const hit = cache.get(data.city);
    if (hit && Date.now() - hit.at < TTL) {
      return { city: data.city, sites: hit.sites, error: null, fetchedAt: hit.at };
    }
    const { loadCitySites } = await import("./food-sites.server");
    try {
      const sites = (await loadCitySites(data.city)).map(slim);
      const at = Date.now();
      cache.set(data.city, { at, sites });
      return { city: data.city, sites, error: null, fetchedAt: at };
    } catch (err) {
      console.error("Failed to load food sites", data.city, err);
      if (hit) return { city: data.city, sites: hit.sites, error: null, fetchedAt: hit.at };
      return {
        city: data.city,
        sites: [],
        error: "We could not reach the city's food site list right now.",
        fetchedAt: Date.now(),
      };
    }
  });
