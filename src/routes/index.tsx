import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { CITIES } from "@/lib/food-sites";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZipFood — free food near you in Los Angeles" },
      {
        name: "description",
        content:
          "Free food banks, pantries and hot meals across Los Angeles County, with today's hours, phone numbers and directions.",
      },
      {
        property: "og:title",
        content: "ZipFood — free food near you in Los Angeles",
      },
      {
        property: "og:description",
        content:
          "Free food banks and hot meals across Los Angeles, with hours and directions. Free, no sign up.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-5">
      <div className="-mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Free food near you in Los Angeles</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Warm meals and grocery pantries, open to anyone. You do not need to pay, sign up, or give
          your name.
        </p>

        <Link
          to="/city/$city"
          params={{ city: "los-angeles" }}
          className="mt-6 flex min-h-20 items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-md hover:opacity-95"
        >
          <span className="min-w-0">
            <span className="block text-2xl font-bold">Los Angeles</span>
            <span className="block text-base opacity-90">All of LA County · 340+ places</span>
          </span>
          <ChevronRight className="size-7 shrink-0" aria-hidden="true" />
        </Link>
        <p className="mt-3 text-base">
          Need help right now in LA? Call or text{" "}
          <a href="tel:211" className="font-bold underline decoration-2 underline-offset-4">211 LA</a>.
        </p>

        <h2 className="mt-7 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Other cities
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {CITIES.filter((c) => c.id !== "los-angeles").map((city) => (
            <li key={city.id}>
              <Link
                to="/city/$city"
                params={{ city: city.id }}
                className="flex min-h-16 items-center justify-between gap-3 rounded-xl border-2 border-border bg-secondary px-5 py-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <span>
                  <span className="block text-xl font-bold">{city.name}</span>
                  <span className="block text-base text-muted-foreground">{city.state}</span>
                </span>
                <ChevronRight className="size-6 shrink-0 text-primary" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-4 space-y-4">
          {[
            "Tap Los Angeles, or choose the city you are in.",
            "If you want, tap Use my location so the closest places come first. This is optional.",
            "Call ahead if you can, then get directions.",
          ].map((step, i) => (
            <li key={step} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground"
              >
                {i + 1}
              </span>
              <span className="pt-1 text-lg">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border-2 border-accent bg-accent/40 p-5 text-lg">
        <p>
          Not in one of these cities? Call or text{" "}
          <a href="tel:211" className="font-bold underline decoration-2 underline-offset-4">
            211
          </a>{" "}
          anywhere in the United States for free local food help, any time of day.
        </p>
      </div>
    </div>
  );
}

