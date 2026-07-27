import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { SiteCard } from "@/components/SiteCard";
import {
  distanceMiles,
  getCity,
  getOpenState,
  matchesQuery,
  type FoodSite,
} from "@/lib/food-sites";
import { getCitySites } from "@/lib/food-sites.functions";

export const Route = createFileRoute("/city/$city/")({
  beforeLoad: ({ params }) => {
    if (!getCity(params.city)) throw notFound();
  },
  head: ({ params }) => {
    const city = getCity(params.city);
    const title = city
      ? `Free food banks in ${city.name} — hours and locations`
      : "Free food banks";
    const description = city
      ? `A plain list of free food banks, pantries and hot meals in ${city.name}, ${city.state}, with today's hours, phone numbers and directions.`
      : "Find free food banks near you.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CityPage,
});

type Coords = { lat: number; lng: number };

function CityPage() {
  const { city: cityId } = Route.useParams();
  const city = getCity(cityId)!;
  const fetchSites = useServerFn(getCitySites);

  const { data, isPending, isError } = useQuery({
    queryKey: ["city-sites", cityId],
    queryFn: () => fetchSites({ data: { city: cityId } }),
    staleTime: 15 * 60 * 1000,
  });

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locStatus, setLocStatus] = useState<
    "idle" | "loading" | "denied" | "error" | "ready"
  >("idle");
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("ready");
      },
      (err) => setLocStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }

  const sites = data?.sites ?? [];

  const results = useMemo(() => {
    let list: Array<{ site: FoodSite; distance?: number }> = sites.map((site) => ({
      site,
      distance: coords ? distanceMiles(coords, site) : undefined,
    }));

    if (query.trim()) list = list.filter((r) => matchesQuery(r.site, query));
    if (openOnly)
      list = list.filter((r) => getOpenState(r.site, city.timeZone).status === "open");

    if (coords) {
      list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }
    return list;
  }, [sites, coords, query, openOnly, city.timeZone]);

  const shown = results.slice(0, 40);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <p>
        <Link to="/" className="underline decoration-2 underline-offset-4">
          &larr; Choose a different city
        </Link>
      </p>

      <h1 className="mt-4 text-4xl font-bold leading-tight">
        Free food in {city.name}
      </h1>

      {city.available && city.note && (
        <div className="mt-5 rounded-md border-2 border-border bg-muted p-5 text-lg">
          <p>{city.note}</p>
          {city.fallback && (
            <p className="mt-2">
              You can also try the{" "}
              <a
                href={city.fallback.url}
                className="font-bold underline decoration-2 underline-offset-4"
              >
                {city.fallback.label}
              </a>
              .
            </p>
          )}
        </div>
      )}


      <section aria-labelledby="location-heading" className="mt-6">
        <h2 id="location-heading" className="text-2xl font-bold">
          Show the closest places
        </h2>
        <p className="mt-2">
          This is optional. Your location stays on your phone and is never saved.
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          className="mt-4 inline-flex min-h-14 items-center rounded-md bg-primary px-6 text-xl font-bold text-primary-foreground hover:opacity-90"
        >
          {locStatus === "loading" ? "Finding you…" : "Use my location"}
        </button>

        <p aria-live="polite" className="mt-3 text-lg">
          {locStatus === "ready" && "Showing the closest places first."}
          {locStatus === "denied" &&
            "Location is turned off. That is fine — the full list is below, and you can search by street or ZIP code."}
          {locStatus === "error" &&
            "We could not get your location. The full list is below, and you can search by street or ZIP code."}
        </p>
      </section>

      <section aria-labelledby="filter-heading" className="mt-8">
        <h2 id="filter-heading" className="sr-only">
          Search and filter
        </h2>
        <label htmlFor="site-search" className="block text-lg font-bold">
          Search by name, street or ZIP code
        </label>
        <input
          id="site-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="For example: Broad Street or 19140"
          className="mt-2 min-h-14 w-full rounded-md border-2 border-input bg-card px-4 text-lg placeholder:text-muted-foreground"
        />

        <label className="mt-4 flex min-h-12 items-center gap-3 text-lg font-bold">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            className="size-6 accent-[var(--color-primary)]"
          />
          Only show places open right now
        </label>
      </section>

      <section aria-labelledby="results-heading" className="mt-8">
        <h2 id="results-heading" className="text-2xl font-bold">
          Places to get food
        </h2>

        {isPending && <p className="mt-4 text-lg">Loading the list…</p>}

        {(isError || data?.error) && (
          <p role="alert" className="mt-4 rounded-md border-2 border-destructive p-4 text-lg">
            We could not load the list right now. Please try again in a few
            minutes, or call 211 for help finding food.
          </p>
        )}

        {!isPending && !isError && !data?.error && sites.length === 0 && (
          <div className="mt-4 rounded-md border-2 border-border bg-card p-5">
            <p className="text-lg font-bold">
              We do not have a verified list for {city.name} yet.
            </p>
            <p className="mt-2">
              {city.note ??
                "We only show food sites from official city data, so nothing here is made up."}{" "}
              In the meantime, call or text{" "}
              <a
                href="tel:211"
                className="font-bold underline decoration-2 underline-offset-4"
              >
                211
              </a>{" "}
              for free local food help in {city.name}.
            </p>
            {city.fallback && (
              <p className="mt-2">
                You can also try the{" "}
                <a
                  href={city.fallback.url}
                  className="font-bold underline decoration-2 underline-offset-4"
                >
                  {city.fallback.label}
                </a>
                .
              </p>
            )}
          </div>
        )}


        {!isPending && sites.length > 0 && (
          <>
            <p aria-live="polite" className="mt-2 text-lg">
              {results.length} place{results.length === 1 ? "" : "s"} found
              {shown.length < results.length
                ? `. Showing the first ${shown.length}.`
                : "."}
            </p>
            <ul className="mt-5 space-y-5">
              {shown.map((r) => (
                <SiteCard
                  key={r.site.id}
                  site={r.site}
                  city={city}
                  distance={r.distance}
                />
              ))}
            </ul>
            {results.length === 0 && (
              <p className="mt-4 text-lg">
                Nothing matched. Try clearing the search box or the &ldquo;open
                right now&rdquo; filter.
              </p>
            )}
          </>
        )}
      </section>

      <p className="mt-10 text-base text-muted-foreground">
        Information comes from {city.sourceName}. Hours can change without
        notice, so call ahead if you can.
      </p>
    </div>
  );
}
