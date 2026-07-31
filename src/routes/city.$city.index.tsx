import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, LocateFixed, Search } from "lucide-react";
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
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "denied" | "error" | "ready">(
    "idle",
  );
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
        setPage(0);
      },

      (err) => setLocStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }

  const sites = data?.sites ?? [];

  const results = useMemo(() => {
    const q = query.trim();
    let list: Array<{ site: FoodSite; distance?: number; matches: boolean }> = sites.map((site) => ({
      site,
      distance: coords ? distanceMiles(coords, site) : undefined,
      matches: q ? matchesQuery(site, q) : true,
    }));

    if (openOnly) list = list.filter((r) => getOpenState(r.site, city.timeZone).status === "open");

    list.sort((a, b) => {
      // Places that match the search come first, but nothing is hidden.
      if (a.matches !== b.matches) return a.matches ? -1 : 1;
      if (coords) return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      return a.site.name.localeCompare(b.site.name);
    });
    return list;
  }, [sites, coords, query, openOnly, city.timeZone]);

  const matchCount = useMemo(() => results.filter((r) => r.matches).length, [results]);

  const PAGE_SIZE = 40;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const shown = results.slice(start, start + PAGE_SIZE);



  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-5">
      <div className="-mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-lg underline decoration-2 underline-offset-4"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            Choose a different city
          </Link>
        </p>

        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
          Free food in {city.name}
        </h1>

        {city.available && city.note && (
          <div className="mt-4 rounded-xl border-2 border-accent bg-accent/40 p-4 text-lg">
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
          <h2 id="location-heading" className="sr-only">
            Show the closest places
          </h2>
          <button
            type="button"
            onClick={useMyLocation}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <LocateFixed className="size-6" aria-hidden="true" />
            {locStatus === "loading" ? "Finding you…" : "Use my location"}
          </button>
          <p className="mt-2 text-base text-muted-foreground">
            Optional. Your location stays on your phone and is never saved.
          </p>

          <p aria-live="polite" className="mt-2 text-lg">
            {locStatus === "ready" && "Showing the closest places first."}
            {locStatus === "denied" &&
              "Location is turned off. That is fine — the full list is below, and you can search by street or ZIP code."}
            {locStatus === "error" &&
              "We could not get your location. The full list is below, and you can search by street or ZIP code."}
          </p>
        </section>

        <section aria-labelledby="filter-heading" className="mt-6">
          <h2 id="filter-heading" className="sr-only">
            Search and filter
          </h2>
          <label htmlFor="site-search" className="block text-lg font-bold">
            Search by name, street or ZIP code
          </label>
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="For example: a street name or ZIP code"
              className="min-h-14 w-full rounded-xl border-2 border-input bg-background pl-12 pr-4 text-lg placeholder:text-muted-foreground"
            />
          </div>

          <label className="mt-3 flex min-h-12 items-center gap-3 text-lg font-bold">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => {
                setOpenOnly(e.target.checked);
                setPage(0);
              }}
              className="size-6 accent-[var(--color-primary)]"
            />
            Only show places open right now
          </label>
        </section>
      </div>


      <section aria-labelledby="results-heading" className="mt-8">
        <h2 id="results-heading" className="text-2xl font-bold">
          Places to get food
        </h2>

        {isPending && <p className="mt-4 text-lg">Loading the list…</p>}

        {(isError || data?.error) && (
          <p role="alert" className="mt-4 rounded-xl border-2 border-destructive bg-card p-4 text-lg">
            We could not load the list right now. Please try again in a few minutes, or call 211 for
            help finding food.
          </p>
        )}

        {!isPending && !isError && !data?.error && sites.length === 0 && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-lg font-bold">We do not have a verified list for {city.name} yet.</p>
            <p className="mt-2">
              {city.note ??
                "We only show food sites from official city data, so nothing here is made up."}{" "}
              In the meantime, call or text{" "}
              <a href="tel:211" className="font-bold underline decoration-2 underline-offset-4">
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
              {query.trim() && matchCount > 0
                ? `${matchCount} place${matchCount === 1 ? "" : "s"} match your search, shown first. `
                : ""}
              {query.trim() && matchCount === 0
                ? "Nothing matched your search, so the full list is below. "
                : ""}
              {results.length} place{results.length === 1 ? "" : "s"} in all
              {results.length > 0
                ? `. Showing ${start + 1} to ${start + shown.length}${
                    pageCount > 1 ? ` (page ${safePage + 1} of ${pageCount})` : ""
                  }.`
                : "."}
              {coords ? " Closest to you first." : ""}
            </p>
            <ul className="mt-5 space-y-5">
              {shown.map((r) => (
                <SiteCard key={r.site.id} site={r.site} city={city} distance={r.distance} />
              ))}
            </ul>
            {pageCount > 1 && (
              <nav aria-label="More results" className="mt-6 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 0}
                  className="min-h-14 rounded-xl border-2 border-border bg-secondary px-6 text-xl font-bold disabled:opacity-40"
                >
                  &larr; Previous places
                </button>
                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= pageCount - 1}
                  className="min-h-14 rounded-xl bg-primary px-6 text-xl font-bold text-primary-foreground shadow-sm disabled:opacity-40"
                >
                  Next places &rarr;
                </button>
              </nav>
            )}
            {results.length === 0 && (
              <p className="mt-4 text-lg">
                Nothing to show. Try clearing the &ldquo;open right now&rdquo; filter.
              </p>
            )}


          </>
        )}
      </section>

      <p className="mt-10 text-base text-muted-foreground">
        Information comes from {city.sourceName}. Hours can change without notice, so call ahead if
        you can.
      </p>
    </div>
  );
}
