import { useSyncExternalStore } from "react";
import type { CityId, FoodSite } from "./food-sites";

const KEY = "fff:favorites:v1";
export type SavedSite = FoodSite & { savedAt: number };

const listeners = new Set<() => void>();
let cache: SavedSite[] | null = null;
const EMPTY: SavedSite[] = [];

function read(): SavedSite[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]") as SavedSite[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: SavedSite[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    list,
    isSaved: (city: CityId, id: string) => list.some((s) => s.city === city && s.id === id),
    toggle: (site: FoodSite) => {
      const cur = read();
      const exists = cur.some((s) => s.city === site.city && s.id === site.id);
      write(
        exists
          ? cur.filter((s) => !(s.city === site.city && s.id === site.id))
          : [...cur, { ...site, savedAt: Date.now() }],
      );
      return !exists;
    },
    /** Refresh stored copies with the latest list from the city. */
    refresh: (sites: FoodSite[]) => {
      const cur = read();
      let changed = false;
      const next = cur.map((s) => {
        const fresh = sites.find((x) => x.city === s.city && x.id === s.id);
        if (fresh && JSON.stringify(fresh) !== JSON.stringify({ ...s, savedAt: undefined })) {
          changed = true;
          return { ...fresh, savedAt: s.savedAt };
        }
        return s;
      });
      if (changed) write(next);
    },
    clear: () => write([]),
  };
}
