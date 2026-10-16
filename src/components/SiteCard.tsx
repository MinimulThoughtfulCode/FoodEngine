import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import {
  directionsUrl,
  formatDistance,
  getOpenState,
  primaryPhone,
  telHref,
  type City,
  type FoodSite,
} from "@/lib/food-sites";
import { FavoriteButton } from "@/components/FavoriteButton";

const STATUS_CLASS: Record<string, string> = {
  open: "bg-success text-success-foreground",
  closed: "bg-secondary text-secondary-foreground",
  unknown: "bg-secondary text-secondary-foreground",
};

export function OpenBadge({ site, city }: { site: FoodSite; city: City }) {
  const state = getOpenState(site, city.timeZone);
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-bold ${STATUS_CLASS[state.status]}`}
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-full bg-current opacity-80"
      />
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
    <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <OpenBadge site={site} city={city} />
          <h3 className="text-xl font-bold leading-tight sm:text-2xl">
            <Link
              to="/city/$city/$siteId"
              params={{ city: city.id, siteId: site.id }}
              className="text-card-foreground underline decoration-2 underline-offset-4 hover:text-primary"
            >
              {site.name}
            </Link>
          </h3>
        </div>
        {distance !== undefined && (
          <span className="shrink-0 text-lg font-bold text-muted-foreground">
            {formatDistance(distance)}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-lg">
        <p className="flex items-start gap-2">
          <Clock className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="sr-only">Today's hours: </span>
            <span className="font-semibold">Today:</span> {state.todayLabel}
          </span>
        </p>

        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
          <span>{site.address}</span>
        </p>

        {site.availability && (
          <p>
            <span className="font-semibold">Taking people:</span> {site.availability}
          </p>
        )}

        {site.category && <p className="text-muted-foreground">{site.category}</p>}

        {site.offerings.length > 0 && (
          <p>
            <span className="font-semibold">Food you can get:</span> {site.offerings.join(", ")}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {phone ? (
          <a
            href={telHref(phone)}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-border bg-secondary px-5 text-lg font-bold text-secondary-foreground hover:bg-accent"
          >
            <Phone className="size-5" aria-hidden="true" />
            Call {phone}
          </a>
        ) : null}
        <a
          href={directionsUrl(site)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-lg font-bold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Navigation className="size-5" aria-hidden="true" />
          Directions
          <span className="sr-only"> to {site.name}, opens in a new tab</span>
        </a>
        <FavoriteButton site={site} className="sm:col-span-2" />
      </div>
    </li>
  );
}
