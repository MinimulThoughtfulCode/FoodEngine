import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteCard } from "@/components/SiteCard";
import { CITIES, getCity } from "@/lib/food-sites";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "My saved places — ZipFood" },
      {
        name: "description",
        content: "Food pantries and free meals you saved. Stored only on your phone and works offline.",
      },
      { property: "og:title", content: "My saved places — ZipFood" },
      {
        property: "og:description",
        content: "Food pantries and free meals you saved, kept only on your phone.",
      },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { list, clear } = useFavorites();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-5">
      <div className="-mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">My saved places</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          These are kept only on this phone. Nobody else can see them, and they open even without a
          signal.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-lg shadow-sm">
          <p>You have not saved any places yet.</p>
          <p className="mt-2">
            Tap <span className="font-bold">Save this place</span> on any pantry to keep it here.
          </p>
          <p className="mt-4">
            <Link
              to="/"
              className="inline-flex min-h-14 items-center rounded-xl bg-primary px-6 text-lg font-bold text-primary-foreground"
            >
              Find food near me
            </Link>
          </p>
        </div>
      ) : (
        <>
          {CITIES.filter((c) => list.some((s) => s.city === c.id)).map((c) => {
            const city = getCity(c.id)!;
            return (
              <section key={c.id} className="mt-8" aria-labelledby={`h-${c.id}`}>
                <h2 id={`h-${c.id}`} className="text-2xl font-bold">
                  {city.name}
                </h2>
                <ul className="mt-4 space-y-5">
                  {list
                    .filter((s) => s.city === c.id)
                    .map((s) => (
                      <SiteCard key={s.id} site={s} city={city} />
                    ))}
                </ul>
              </section>
            );
          })}
          <p className="mt-10">
            <button
              type="button"
              onClick={() => {
                if (confirm("Remove all saved places from this phone?")) clear();
              }}
              className="min-h-14 rounded-xl border-2 border-destructive px-6 text-lg font-bold text-destructive"
            >
              Remove all saved places
            </button>
          </p>
          <p className="mt-3 text-base text-muted-foreground">
            Useful on a shared or borrowed phone.
          </p>
        </>
      )}
    </div>
  );
}
