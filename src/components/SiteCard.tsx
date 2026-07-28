import { Link } from "@tanstack/react-router";
import {
  directionsUrl,
  formatDistance,
  getOpenState,
  primaryPhone,
  telHref,
  type City,
  type FoodSite,
} from "@/lib/food-sites";

const STATUS_CLASS: Record<string, string> = {
  open: "bg-success text-success-foreground",
  closed: "bg-secondary text-secondary-foreground",
  unknown: "bg-secondary text-secondary-foreground",
};

export function OpenBadge({ site, city }: { site: FoodSite; city: City }) {
  const state = getOpenState(site, city.timeZone);
  return (
    <p
      className={`inline-flex rounded-md px-3 py-1 text-base font-bold ${STATUS_CLASS[state.status]}`}
    >
      {state.label}
    </p>
  );
}

export function SiteCard({
  site,
  city,
  distance,
}: {
  site: FoodSite;
  city: City;
  distance?: number;
}) {
  const phone = primaryPhone(site.phone);
  const state = getOpenState(site, city.timeZone);

  return (
    <li className="rounded-lg border-2 border-border bg-card p-5 shadow-sm">
      <h3 className="text-2xl font-bold leading-tight">
        <Link
          to="/city/$city/$siteId"
          params={{ city: city.id, siteId: site.id }}
          className="text-card-foreground underline decoration-2 underline-offset-4 hover:text-primary"
        >
          {site.name}
        </Link>
      </h3>

      <div className="mt-3">
        <OpenBadge site={site} city={city} />
      </div>

      <p className="mt-3">
        <span className="sr-only">Today's hours: </span>
        <span className="font-semibold">Today:</span> {state.todayLabel}
      </p>

      {site.availability && (
        <p className="mt-2">
          <span className="font-semibold">Taking people:</span>{" "}
          {site.availability}
        </p>
      )}

      <p className="mt-1 text-muted-foreground">{site.address}</p>

      {distance !== undefined && (
        <p className="mt-1 font-semibold">{formatDistance(distance)}</p>
      )}

      {site.category && (
        <p className="mt-1 text-muted-foreground">{site.category}</p>
      )}

      {site.offerings.length > 0 && (
        <p className="mt-2">
          <span className="font-semibold">Food you can get:</span>{" "}
          {site.offerings.join(", ")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {phone ? (
          <a
            href={telHref(phone)}
            className="inline-flex min-h-12 items-center rounded-md bg-primary px-5 text-lg font-bold text-primary-foreground hover:opacity-90"
          >
            Call {phone}
          </a>
        ) : null}
        <a
          href={directionsUrl(site)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center rounded-md border-2 border-primary px-5 text-lg font-bold text-primary hover:bg-accent"
        >
          Directions
          <span className="sr-only"> to {site.name}, opens in a new tab</span>
        </a>
      </div>
    </li>
  );
}
