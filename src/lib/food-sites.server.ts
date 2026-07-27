/**
 * City adapters. Each one fetches a public open-data feed and normalizes it
 * into the shared FoodSite shape. Server-only: never import from components.
 */
import {
  emptyWeek,
  type CityId,
  type FoodSite,
  type TimeRange,
  type WeekHours,
} from "./food-sites";

const CACHE_MS = 30 * 60 * 1000;
const cache = new Map<CityId, { at: number; sites: FoodSite[] }>();

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "n/a") return null;
  return s;
}

function normalizeUrl(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  return null;
}

function range(open: unknown, close: unknown): TimeRange | null {
  const o = clean(open);
  const c = clean(close);
  if (!o || !c) return null;
  return { open: o, close: c };
}

/* -------------------------------------------------------------------------- */
/* Philadelphia — ArcGIS FeatureServer                                         */
/* -------------------------------------------------------------------------- */

const PHILLY_LAYER =
  "https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/free_meal_sites/FeatureServer/0/query";

type GeoFeature = {
  geometry: { type: string; coordinates: [number, number] } | null;
  properties: Record<string, unknown>;
};

async function fetchArcgisAll(baseUrl: string): Promise<GeoFeature[]> {
  const out: GeoFeature[] = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 10000; offset += pageSize) {
    const url = `${baseUrl}?where=1%3D1&outFields=*&outSR=4326&f=geojson&resultRecordCount=${pageSize}&resultOffset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ArcGIS request failed (${res.status})`);
    const json = (await res.json()) as {
      features?: GeoFeature[];
      properties?: { exceededTransferLimit?: boolean };
    };
    const features = json.features ?? [];
    out.push(...features);
    if (features.length < pageSize) break;
  }
  return out;
}

function phillyHours(p: Record<string, unknown>): { hours: WeekHours; notes: string[] } {
  const keys: Array<[number, string]> = [
    [0, "sun"],
    [1, "mon"],
    [2, "tues"],
    [3, "wed"],
    [4, "thurs"],
    [5, "fri"],
    [6, "sat"],
  ];
  const hours = emptyWeek();
  const notes: string[] = [];
  for (const [idx, key] of keys) {
    const r1 = range(p[`hours_${key}_start1`], p[`hours_${key}_end1`]);
    const r2 = range(p[`hours_${key}_start2`], p[`hours_${key}_end2`]);
    if (r1) hours[idx].push(r1);
    if (r2) hours[idx].push(r2);
    const ex = clean(p[`hours_${key}_exceptions`]);
    if (ex) notes.push(ex);
  }
  return { hours, notes: [...new Set(notes)] };
}

async function loadPhiladelphia(): Promise<FoodSite[]> {
  const features = await fetchArcgisAll(PHILLY_LAYER);
  const sites: FoodSite[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const coords = f.geometry?.coordinates;
    const name = clean(p.site_name);
    if (!name || !coords || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const { hours, notes } = phillyHours(p);
    const closureNote = clean(p.temporary_closure);
    const seasonal = clean(p.seasonally_closed);
    if (closureNote) notes.unshift(closureNote);
    if (seasonal) notes.push(`Seasonally closed: ${seasonal}`);
    const zipNote = clean(p.zip_code_exceptions);
    if (zipNote) notes.push(zipNote);

    const zip = clean(p.zip_code);
    sites.push({
      id: `philadelphia-${p.objectid}`,
      city: "philadelphia",
      name,
      address: [clean(p.address), "Philadelphia, PA", zip].filter(Boolean).join(", "),
      phone: clean(p.phone_number),
      email: clean(p.email),
      website: normalizeUrl(p.website),
      lat,
      lng,
      category: clean(p.category_type) ?? clean(p.category),
      hours,
      notes,
      closed:
        clean(p.status)?.toLowerCase() === "inactive" ||
        Boolean(closureNote) ||
        Boolean(seasonal),
    });
  }
  return sites;
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

const LOADERS: Partial<Record<CityId, () => Promise<FoodSite[]>>> = {
  philadelphia: loadPhiladelphia,
};

export async function loadCitySites(city: CityId): Promise<FoodSite[]> {
  const hit = cache.get(city);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.sites;

  const loader = LOADERS[city];
  if (!loader) return [];

  const sites = await loader();
  sites.sort((a, b) => a.name.localeCompare(b.name));
  cache.set(city, { at: Date.now(), sites });
  return sites;
}
