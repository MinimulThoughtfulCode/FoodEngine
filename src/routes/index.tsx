import { createFileRoute, Link } from "@tanstack/react-router";
import { CITIES } from "@/lib/food-sites";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Free Food Finder — food banks and free meals near you" },
      {
        name: "description",
        content:
          "Pick your city to see free food banks, pantries and hot meals near you, with today's hours, phone numbers and directions.",
      },
      {
        property: "og:title",
        content: "Free Food Finder — food banks and free meals near you",
      },
      {
        property: "og:description",
        content:
          "Pick your city to see free food banks and hot meals near you, with hours and directions. Free, no sign up.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Find free food near you</h1>
      <p className="mt-4 text-xl">
        Everything here is free. You do not need to sign up, pay, or give your name.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Where are you right now?</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {CITIES.map((city) => (
          <li key={city.id}>
            <Link
              to="/city/$city"
              params={{ city: city.id }}
              className="flex min-h-24 flex-col justify-center rounded-lg border-2 border-foreground bg-card px-6 py-5 hover:bg-accent"
            >
              <span className="text-2xl font-bold">{city.name}</span>
              <span className="text-base text-muted-foreground">{city.state}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl font-bold">How it works</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg">
        <li>Choose the city you are in.</li>
        <li>
          If you want, tap <strong>Use my location</strong> so we can show the closest places first.
          This is optional.
        </li>
        <li>Call ahead if you can, then get directions.</li>
      </ol>

      <p className="mt-8 text-lg">
        Not in one of these cities? Call or text{" "}
        <a href="tel:211" className="font-bold underline decoration-2 underline-offset-4">
          211
        </a>{" "}
        anywhere in the United States for free local food help.
      </p>
    </div>
  );
}
