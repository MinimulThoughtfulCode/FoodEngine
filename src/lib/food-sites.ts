/**
 * Shared, browser-safe types and helpers for the free food finder.
 * No network calls live here — see food-sites.server.ts for the city adapters.
 */

export type TimeRange = {
  /** "HH:MM" 24-hour local time */
  open: string;
  close: string;
};

/** Index 0 = Sunday ... 6 = Saturday, matching Date#getDay(). */
export type WeekHours = Array<TimeRange[]>;

export type FoodSite = {
  id: string;
  city: CityId;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number;
  lng: number;
  /** e.g. "Food pantry", "Hot meal" */
  category: string | null;
  hours: WeekHours;
  /** Hours exactly as the city wrote them, when they are not a clean table. */
  hoursText: string | null;
  /**
   * Whether they are taking people right now, in the city's own words —
   * e.g. "Open and accepting new clients" or "Not accepting new customers".
   */
  availability: string | null;
  /** What you need to bring or qualify for, in the city's own words. */
  requirements: string | null;
  /** What food they hand out, e.g. ["Fresh produce", "Meat"]. */
  offerings: string[];
  /** Free-text notes such as "Closed holidays" or eligibility info. */
  notes: string[];
  /** True when the site is flagged closed / inactive upstream. */
  closed: boolean;
};

export type CityId =
  | "philadelphia"
  | "new-york"
  | "los-angeles"
  | "minneapolis";

export type City = {
  id: CityId;
  name: string;
  shortName: string;
  state: string;
  timeZone: string;
  center: { lat: number; lng: number };
  /** Who publishes the underlying data. */
  sourceName: string;
  sourceUrl: string;
  /** False when we have no verified public data feed yet. */
  available: boolean;
  /** Shown on the city page when there is no list, or when it is limited. */
  note?: string;
  /** Local place to send people when we have no list. */
  fallback?: { label: string; url: string };
};

export const CITIES: City[] = [
  {
    id: "new-york",
    name: "New York City",
    shortName: "New York",
    state: "NY",
    timeZone: "America/New_York",
    center: { lat: 40.7128, lng: -74.006 },
    sourceName: "Food Help NYC (NYC Department of Social Services)",
    sourceUrl: "https://finder.nyc.gov/foodhelp",
    available: true,
  },
  {
    id: "los-angeles",
    name: "Los Angeles",
    shortName: "Los Angeles",
    state: "CA",
    timeZone: "America/Los_Angeles",
    center: { lat: 34.0522, lng: -118.2437 },
    sourceName: "Los Angeles County Public Works (Food DROP agencies)",
    sourceUrl: "https://dpw.lacounty.gov/epd/fooddrop/",
    available: true,
    note: "This list covers all of Los Angeles County. It says which food each place hands out and whether they are active right now.",
  },
  {
    id: "minneapolis",
    name: "Minneapolis",
    shortName: "Minneapolis",
    state: "MN",
    timeZone: "America/Chicago",
    center: { lat: 44.9778, lng: -93.265 },
    sourceName: "Hennepin County (food resources)",
    sourceUrl: "https://gis.hennepin.us/",
    available: true,
    note: "This list covers Minneapolis and the rest of Hennepin County, with day-by-day hours and whether each place is taking new people.",
  },

  {
    id: "philadelphia",
    name: "Philadelphia",
    shortName: "Philadelphia",
    state: "PA",
    timeZone: "America/New_York",
    center: { lat: 39.9526, lng: -75.1652 },
    sourceName: "City of Philadelphia (OpenDataPhilly)",
    sourceUrl:
      "https://opendataphilly.org/datasets/free-food-and-benefits-access-sites/",
    available: true,
  },
];


export function getCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function emptyWeek(): WeekHours {
  return [[], [], [], [], [], [], []];
}

/* -------------------------------------------------------------------------- */
/* Distance                                                                    */
/* -------------------------------------------------------------------------- */

/** Great-circle distance in miles. */
export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "Less than 0.1 miles away";
  if (miles < 10) return `${miles.toFixed(1)} miles away`;
  return `${Math.round(miles)} miles away`;
}

/* -------------------------------------------------------------------------- */
/* Hours                                                                       */
/* -------------------------------------------------------------------------- */

/** Current { day, minutes } in a given IANA time zone. */
export function nowInZone(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const hour = Number(get("hour")) % 24;
  return {
    day: dayMap[get("weekday")] ?? 0,
    minutes: hour * 60 + Number(get("minute")),
  };
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function formatTime(hhmm: string): string {
  const mins = toMinutes(hhmm);
  if (mins == null) return hhmm;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "pm" : "am";
  h = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, "0")}${suffix}`;
}

export function formatRange(r: TimeRange): string {
  return `${formatTime(r.open)} to ${formatTime(r.close)}`;
}

export function formatDayHours(ranges: TimeRange[]): string {
  if (!ranges.length) return "Closed";
  return ranges.map(formatRange).join(", ");
}

export type OpenState = {
  status: "open" | "closed" | "unknown";
  /** Short plain-language label, e.g. "Open until 2pm". */
  label: string;
  todayLabel: string;
};

export function getOpenState(site: FoodSite, timeZone: string): OpenState {
  const hasAny = site.hours.some((d) => d.length > 0);
  const { day, minutes } = nowInZone(timeZone);
  const today = site.hours[day] ?? [];
  const todayLabel = hasAny
    ? formatDayHours(today)
    : (site.hoursText ?? "Hours not listed");

  if (site.closed) {
    return { status: "closed", label: "Temporarily closed", todayLabel };
  }
  if (!hasAny) {
    return {
      status: "unknown",
      label: site.hoursText ? "Call to check the times below" : "Call to check hours",
      todayLabel,
    };
  }

  for (const r of today) {
    const start = toMinutes(r.open);
    const end = toMinutes(r.close);
    if (start == null || end == null) continue;
    if (minutes >= start && minutes < end) {
      return { status: "open", label: `Open now until ${formatTime(r.close)}`, todayLabel };
    }
    if (minutes < start) {
      return { status: "closed", label: `Opens today at ${formatTime(r.open)}`, todayLabel };
    }
  }

  // Find the next open day within the coming week.
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const ranges = site.hours[d] ?? [];
    if (ranges.length) {
      const when = i === 1 ? "tomorrow" : DAY_NAMES[d];
      return {
        status: "closed",
        label: `Closed now. Opens ${when} at ${formatTime(ranges[0].open)}`,
        todayLabel,
      };
    }
  }
  return { status: "closed", label: "Closed now", todayLabel };
}

/* -------------------------------------------------------------------------- */
/* Links                                                                       */
/* -------------------------------------------------------------------------- */

export function directionsUrl(
  site: FoodSite,
  mode: "transit" | "walking" | "driving" = "transit",
): string {
  const dest = `${site.lat},${site.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    dest,
  )}&travelmode=${mode}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Pulls the first usable phone number out of a messy upstream string. */
export function primaryPhone(phone: string | null): string | null {
  if (!phone) return null;
  const m = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.exec(phone);
  return m ? m[0].trim() : null;
}

export function matchesQuery(site: FoodSite, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    site.name.toLowerCase().includes(q) ||
    site.address.toLowerCase().includes(q) ||
    (site.category ?? "").toLowerCase().includes(q)
  );
}
