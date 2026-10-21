import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import type { CityId } from "./food-sites";
import { getCitySites, type CitySitesResult } from "./food-sites.functions";
import { useLowData } from "@/hooks/use-low-data";

const key = (city: string) => `fff:city:v1:${city}`;

function readCached(city: string): CitySitesResult | null {
  try {
    const raw = localStorage.getItem(key(city));
    return raw ? (JSON.parse(raw) as CitySitesResult) : null;
  } catch {
    return null;
  }
}

/**
 * Loads a city's list. The last good list is kept on the phone so return
 * visits show instantly and still work with a weak or dropped signal.
 */
export function useCitySites(cityId: CityId) {
  const fetchSites = useServerFn(getCitySites);
  const qc = useQueryClient();
  const [fromDevice, setFromDevice] = useState<number | null>(null);
  const { lowData } = useLowData();

  useEffect(() => {
    const cached = readCached(cityId);
    if (cached && !qc.getQueryData(["city-sites", cityId])) {
      qc.setQueryData(["city-sites", cityId], cached, { updatedAt: 0 });
      setFromDevice(cached.fetchedAt);
    }
  }, [cityId, qc]);

  const query = useQuery({
    queryKey: ["city-sites", cityId],
    queryFn: async () => {
      const res = await fetchSites({ data: { city: cityId } });
      if (!res.error && res.sites.length) {
        try {
          localStorage.setItem(key(cityId), JSON.stringify(res));
        } catch {
          /* storage full — fine */
        }
        setFromDevice(null);
      } else {
        const cached = readCached(cityId);
        if (cached) {
          setFromDevice(cached.fetchedAt);
          return cached;
        }
      }
      return res;
    },
    staleTime: lowData ? 60 * 60 * 1000 : 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: !lowData,
  });

  return { ...query, fromDevice };
}
