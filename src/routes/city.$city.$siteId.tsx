import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { OpenBadge } from "@/components/SiteCard";
import {
  DAY_NAMES,
  directionsUrl,
  formatDayHours,
  getCity,
  nowInZone,
  primaryPhone,
  telHref,
} from "@/lib/food-sites";
import { getCitySites } from "@/lib/food-sites.functions";

export const Route = createFileRoute("/city/$city/$siteId")({
  beforeLoad: ({ params }) => {
    if (!getCity(params.city)) throw notFound();
  },
  head: ({ params }) => {
    const city = getCity(params.city);
    const title = city
      ? `Free food site in ${city.name} — hours, phone and directions`
      : "Free food site";
    const description = city
      ? `Full opening hours, phone number and directions for a free food site in ${city.name}, ${city.state}.`
      : "Free food site details.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: SiteDetail,
});

function SiteDetail() {
  const { city: cityId, siteId } = Route.useParams();
  const city = getCity(cityId)!;
  const fetchSites = useServerFn(getCitySites);

  const { data, isPending } = useQuery({
    queryKey: ["city-sites", cityId],
    queryFn: () => fetchSites({ data: { city: cityId } }),
    staleTime: 15 * 60 * 1000,
  });

  const site = data?.sites.find((s) => s.id === siteId);
  const today = nowInZone(city.timeZone).day;

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-lg">Loading…</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold">We could not find that place</h1>
        <p className="mt-3">It may have been removed from the city's list.</p>
        <p className="mt-5">
          <Link
            to="/city/$city"
            params={{ city: city.id }}
            className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 text-lg font-bold text-primary-foreground"
          >
            Back to all places in {city.shortName}
          </Link>
        </p>
      </div>
    );
  }

  const phone = primaryPhone(site.phone);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <p>
        <Link
          to="/city/$city"
          params={{ city: city.id }}
          className="underline decoration-2 underline-offset-4"
        >
          &larr; Back to all places in {city.shortName}
        </Link>
      </p>

      <h1 className="mt-4 text-4xl font-bold leading-tight">{site.name}</h1>
      <div className="mt-3">
        <OpenBadge site={site} city={city} />
      </div>
      {site.category && <p className="mt-2 text-lg">{site.category}</p>}

      <section aria-labelledby="go-heading" className="mt-6">
        <h2 id="go-heading" className="sr-only">
          Contact and directions
        </h2>
        <p className="text-xl">{site.address}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {phone && (
            <a
              href={telHref(phone)}
              className="inline-flex min-h-14 items-center rounded-md bg-primary px-6 text-xl font-bold text-primary-foreground hover:opacity-90"
            >
              Call {phone}
            </a>
          )}
          <a
            href={directionsUrl(site, "transit")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-14 items-center rounded-md border-2 border-primary px-6 text-xl font-bold text-primary hover:bg-accent"
          >
            Directions by bus or train
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            href={directionsUrl(site, "walking")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-14 items-center rounded-md border-2 border-primary px-6 text-xl font-bold text-primary hover:bg-accent"
          >
            Walking directions
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>

      <section aria-labelledby="hours-heading" className="mt-10">
        <h2 id="hours-heading" className="text-2xl font-bold">
          Opening hours
        </h2>
        <table className="mt-4 w-full border-collapse text-lg">
          <caption className="sr-only">
            Weekly opening hours for {site.name}
          </caption>
          <tbody>
            {DAY_NAMES.map((day, i) => (
              <tr key={day} className="border-b-2 border-border">
                <th
                  scope="row"
                  className={`py-3 pr-4 text-left ${i === today ? "font-bold" : "font-normal"}`}
                >
                  {day}
                  {i === today && <span className="sr-only"> (today)</span>}
                </th>
                <td className={`py-3 ${i === today ? "font-bold" : ""}`}>
                  {formatDayHours(site.hours[i])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {site.notes.length > 0 && (
        <section aria-labelledby="notes-heading" className="mt-10">
          <h2 id="notes-heading" className="text-2xl font-bold">
            Good to know
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            {site.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {(site.website || site.email) && (
        <section aria-labelledby="more-heading" className="mt-10">
          <h2 id="more-heading" className="text-2xl font-bold">
            More ways to reach them
          </h2>
          <ul className="mt-3 space-y-2">
            {site.website && (
              <li>
                <a
                  href={site.website}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-bold underline decoration-2 underline-offset-4"
                >
                  {site.website}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            )}
            {site.email && (
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="break-all font-bold underline decoration-2 underline-offset-4"
                >
                  {site.email}
                </a>
              </li>
            )}
          </ul>
        </section>
      )}

      <p className="mt-10 text-base text-muted-foreground">
        Hours come from {city.sourceName} and can change without notice. Call
        ahead if you can.
      </p>
    </div>
  );
}
