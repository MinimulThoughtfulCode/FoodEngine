import { createServerFn } from "@tanstack/react-start";
import { CITIES, type CityId, type FoodSite } from "./food-sites";

const CITY_IDS = CITIES.map((c) => c.id) as string[];

export type CitySitesResult = {
  city: CityId;
  sites: FoodSite[];
  /** Set when the upstream feed could not be reached. */
  error: string | null;
};

export const getCitySites = createServerFn({ method: "GET" })
  .inputValidator((data: { city: string }) => {
    if (!CITY_IDS.includes(data.city)) throw new Error("Unknown city");
    return { city: data.city as CityId };
  })
  .handler(async ({ data }): Promise<CitySitesResult> => {
    const { loadCitySites } = await import("./food-sites.server");
    try {
      const sites = await loadCitySites(data.city);
      return { city: data.city, sites, error: null };
    } catch (err) {
      console.error("Failed to load food sites", data.city, err);
      return {
        city: data.city,
        sites: [],
        error: "We could not reach the city's food site list right now.",
      };
    }
  });
