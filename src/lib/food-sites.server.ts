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
/* New York City — Food Help NYC (DSS) ArcGIS layer                            */
/* -------------------------------------------------------------------------- */

const NYC_LAYER =
  "https://services6.arcgis.com/yG5s3afENB5iO9fj/arcgis/rest/services/Food_Help_Programs_PROD_view/FeatureServer/0/query";

/** Converts "09:00 AM" / "1:30 PM" to 24-hour "HH:MM". */
function from12Hour(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})\s*([AaPp])/.exec(s);
  if (!m) return /^\d{1,2}:\d{2}$/.test(s) ? s : null;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "p") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function nycHours(p: Record<string, unknown>, prefix: "fp" | "sk"): WeekHours {
  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const hours = emptyWeek();
  keys.forEach((key, idx) => {
    for (const n of [1, 2]) {
      const open = from12Hour(p[`${prefix}_${key}_open${n}`]);
      const close = from12Hour(p[`${prefix}_${key}_close${n}`]);
      if (open && close) hours[idx].push({ open, close });
    }
  });
  return hours;
}

function mergeWeeks(a: WeekHours, b: WeekHours): WeekHours {
  return a.map((day, i) => [...day, ...b[i]]);
}

async function loadNewYork(): Promise<FoodSite[]> {
  const features = await fetchArcgisAll(NYC_LAYER);
  const sites: FoodSite[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const coords = f.geometry?.coordinates;
    const name = clean(p.program);
    if (!name || !coords || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const isPantry = Boolean(clean(p.type_fp));
    const isKitchen = Boolean(clean(p.type_sk));
    const category = [isPantry ? "Food pantry" : null, isKitchen ? "Soup kitchen" : null]
      .filter(Boolean)
      .join(" and ");

    const hours = mergeWeeks(
      isPantry ? nycHours(p, "fp") : emptyWeek(),
      isKitchen ? nycHours(p, "sk") : emptyWeek(),
    );

    const notes: string[] = [];
    const where = clean(p.dist_location_info);
    if (where) notes.push(`Where to go: ${where}`);
    const fpOrig = clean(p.fp_hours_orig);
    if (isPantry && fpOrig) notes.push(`Food pantry hours as listed: ${fpOrig}`);
    const skOrig = clean(p.sk_hours_orig);
    if (isKitchen && skOrig) notes.push(`Soup kitchen hours as listed: ${skOrig}`);

    sites.push({
      id: `new-york-${p.FID ?? p.objectid}`,
      city: "new-york",
      name: name.replace(/\s+/g, " "),
      address: clean(p.distadd) ?? "New York, NY",
      phone: clean(p.org_phone),
      email: null,
      website: null,
      lat,
      lng,
      category: category || "Free food program",
      hours,
      notes,
      closed: false,
    });
  }
  return sites;
}

/* -------------------------------------------------------------------------- */
/* Shared: reading hours written as plain English                              */
/* -------------------------------------------------------------------------- */

const DAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const DAY_WORD = /(sun|mon|tue|wed|thu|fri|sat)[a-z]*\.?/gi;

function to24(hour: number, minute: number, meridiem: string | null): string {
  let h = hour % 12;
  if (meridiem === "pm") h += 12;
  if (meridiem === null && hour === 12) h = 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Reads things like "7 - 8 am & 11:30 am - 12:30 pm" or "10am-12pm, 2-4 pm". */
function parseTimeRanges(text: string): TimeRange[] {
  const out: TimeRange[] = [];
  const re =
    /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const sH = Number(m[1]);
    const sM = Number(m[2] ?? 0);
    const eH = Number(m[4]);
    const eM = Number(m[5] ?? 0);
    if (sH > 12 || eH > 12 || sH < 1 || eH < 1) continue;
    const short = (v: string | undefined) =>
      v ? (v.toLowerCase().startsWith("p") ? "pm" : "am") : null;
    let sMer = short(m[3]);
    let eMer = short(m[6]);
    if (!eMer) eMer = sMer ?? (eH >= 7 && eH <= 11 ? "am" : "pm");
    if (!sMer) {
      sMer = eMer;
      const startMins = (sH % 12) + (sMer === "pm" ? 12 : 0);
      const endMins = (eH % 12) + (eMer === "pm" ? 12 : 0);
      if (startMins > endMins) sMer = "am";
    }
    out.push({ open: to24(sH, sM, sMer), close: to24(eH, eM, eMer) });
  }
  return out;
}

/** Reads things like "Mon-Fri 10 am-12 pm, 2-4 pm" into a week table. */
function parseScheduleText(text: string): WeekHours {
  const hours = emptyWeek();
  const lower = text.toLowerCase();
  const marks: Array<{ index: number; end: number; day: number }> = [];
  DAY_WORD.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DAY_WORD.exec(lower))) {
    marks.push({
      index: m.index,
      end: m.index + m[0].length,
      day: DAY_INDEX[m[1].toLowerCase()],
    });
  }
  if (marks.length === 0) return hours;

  // Group consecutive day words that are only separated by , - & / "and".
  type Group = { days: number[]; timeStart: number; timeEnd: number };
  const groups: Group[] = [];
  let current: { days: number[]; start: number; lastEnd: number } | null = null;
  const applyRange = (days: number[], from: number, to: number) => {
    if (from === to) return days;
    return days;
  };
  void applyRange;

  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (current) {
      const between = lower.slice(current.lastEnd, mark.index);
      if (/^[\s,&/]*(and)?[\s,&/]*$/.test(between)) {
        current.days.push(mark.day);
        current.lastEnd = mark.end;
        continue;
      }
      if (/^\s*(-|–|—|thru|through|to)\s*$/.test(between)) {
        const from = current.days[current.days.length - 1];
        for (let d = from; ; d = (d + 1) % 7) {
          if (d !== from) current.days.push(d);
          if (d === mark.day) break;
        }
        current.lastEnd = mark.end;
        continue;
      }
      const next = mark.index;
      groups.push({
        days: current.days,
        timeStart: current.lastEnd,
        timeEnd: next,
      });
    }
    current = { days: [mark.day], start: mark.index, lastEnd: mark.end };
  }
  if (current)
    groups.push({ days: current.days, timeStart: current.lastEnd, timeEnd: text.length });

  for (const g of groups) {
    const ranges = parseTimeRanges(text.slice(g.timeStart, g.timeEnd));
    for (const day of new Set(g.days)) hours[day].push(...ranges);
  }
  return hours;
}

/* -------------------------------------------------------------------------- */
/* Los Angeles County — Food DROP agencies (LA County Public Works)            */
/* -------------------------------------------------------------------------- */

const LA_LAYER =
  "https://dpw.gis.lacounty.gov/dpw/rest/services/epd_food_drop_agencies/FeatureServer/0/query";

const LA_OFFERINGS: Array<[string, string]> = [
  ["PRODUCE", "Fresh produce"],
  ["MEAT", "Meat"],
  ["DAIRY", "Dairy"],
  ["BAKED_GOODS", "Baked goods"],
  ["CANNED_FOODS", "Canned food"],
  ["DRY_FOODS", "Dry goods"],
  ["PACKAGED_FOODS", "Packaged food"],
  ["PREPARED_FOODS", "Prepared meals"],
];

async function loadLosAngeles(): Promise<FoodSite[]> {
  const features = await fetchArcgisAll(LA_LAYER);
  const sites: FoodSite[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const name = clean(p.AGENCY_NAME);
    const coords = f.geometry?.coordinates;
    if (!name || !coords || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const hoursText = clean(p.OPERATION_HOURS);
    const active = (clean(p.ACTIVE) ?? "").toLowerCase() === "active";
    const offerings = LA_OFFERINGS.filter(
      ([key]) => (clean(p[key]) ?? "").toLowerCase() === "yes",
    ).map(([, label]) => label);

    const notes: string[] = [];
    const contact = clean(p.CONTACT_PERSON);
    if (contact) notes.push(`Ask for: ${contact}`);

    sites.push({
      id: `los-angeles-${p.OBJECTID}`,
      city: "los-angeles",
      name,
      address: clean(p.ADDRESS) ?? "Los Angeles County, CA",
      phone: clean(p.PHONE_NUMBER)?.split("/")[0].trim() ?? null,
      email: clean(p.EMAIL)?.split(/[;,]/)[0].trim() ?? null,
      website: normalizeUrl(p.WEBSITE),
      lat,
      lng,
      category: "Food pantry",
      hours: hoursText ? parseScheduleText(hoursText) : emptyWeek(),
      hoursText,
      availability: active
        ? "Listed as active and giving out food"
        : "Listed as not active right now — call before you go",
      requirements: null,
      offerings,
      notes,
      closed: !active,
    });
  }
  return sites;
}

/* -------------------------------------------------------------------------- */
/* Minneapolis — Hennepin County food resources                                */
/* -------------------------------------------------------------------------- */

const MPLS_LAYER =
  "https://gis.hennepin.us/arcgis/rest/services/HennepinData/HEALTH/MapServer/3/query";

const MPLS_DAY_FIELDS = [
  "SUN_HOURS",
  "MON_HOURS",
  "TUE_HOURS",
  "WED_HOURS",
  "THU_HOURS",
  "FRI_HOURS",
  "SAT_HOURS",
];

async function loadMinneapolis(): Promise<FoodSite[]> {
  const features = await fetchArcgisAll(MPLS_LAYER);
  const sites: FoodSite[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const name = clean(p.NAME);
    const coords = f.geometry?.coordinates;
    if (!name || !coords || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const hours = emptyWeek();
    MPLS_DAY_FIELDS.forEach((field, idx) => {
      const text = clean(p[field]);
      if (text) hours[idx].push(...parseTimeRanges(text));
    });

    const description = clean(p.DESCRIPTION);
    const notTaking = /not accepting new/i.test(description ?? "");
    const address = [clean(p.ADDRESS), clean(p.ADDRESS2)].filter(Boolean).join(" ");

    sites.push({
      id: `minneapolis-${p.OBJECTID}`,
      city: "minneapolis",
      name,
      address: [address, clean(p.CITY) ?? "Minneapolis", `MN ${clean(p.ZIP) ?? ""}`.trim()]
        .filter(Boolean)
        .join(", "),
      phone: clean(p.PHONE),
      email: null,
      website: normalizeUrl(p.WEBSITE),
      lat,
      lng,
      category: clean(p.TYPE),
      hours,
      hoursText: clean(p.HOURS),
      availability: notTaking
        ? "Not taking new people right now — call first"
        : description
          ? "Open to new people. " + description
          : null,
      requirements: clean(p.RESTRICTION),
      offerings: [],
      notes: [],
      closed: false,
    });
  }
  return sites;
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

const LOADERS: Partial<Record<CityId, () => Promise<FoodSite[]>>> = {
  philadelphia: loadPhiladelphia,
  "new-york": loadNewYork,
  "los-angeles": loadLosAngeles,
  minneapolis: loadMinneapolis,
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
