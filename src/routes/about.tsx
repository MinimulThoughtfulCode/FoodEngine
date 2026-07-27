import { createFileRoute } from "@tanstack/react-router";
import { CITIES } from "@/lib/food-sites";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Free Food Finder — where the information comes from" },
      {
        name: "description",
        content:
          "Free Food Finder lists free food banks and meals using official city open data. No accounts, no tracking, no stored locations.",
      },
      {
        property: "og:title",
        content: "About Free Food Finder — where the information comes from",
      },
      {
        property: "og:description",
        content:
          "How this free food bank finder works, where the data comes from, and how to report a listing that is wrong.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-4xl font-bold leading-tight">About this site</h1>

      <p className="mt-5 text-xl">
        Free Food Finder helps you find places that give out free food near you.
        It is free, there is nothing to sign up for, and you never have to give
        your name.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Your privacy</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>We do not ask who you are.</li>
        <li>
          If you tap &ldquo;Use my location&rdquo;, your location is used on your
          own phone to sort the list. It is never sent to us or saved.
        </li>
        <li>You can use the whole site without sharing your location.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold">Where the information comes from</h2>
      <p className="mt-3">
        Every listing comes from an official public data source. We do not invent
        listings, and if a city has no public list yet we say so instead of
        guessing.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        {CITIES.map((c) => (
          <li key={c.id}>
            <strong>{c.name}:</strong>{" "}
            <a
              href={c.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all underline decoration-2 underline-offset-4"
            >
              {c.sourceName}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-2xl font-bold">If something is wrong</h2>
      <p className="mt-3">
        Hours change often. If a place is closed or the hours are wrong, tell the
        city through the data source link above so it gets fixed for everyone.
        Calling ahead is always the safest way to check.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Need more than food?</h2>
      <p className="mt-3">
        Call or text{" "}
        <a
          href="tel:211"
          className="font-bold underline decoration-2 underline-offset-4"
        >
          211
        </a>{" "}
        anywhere in the United States. It is free and confidential, and they can
        help with food, shelter, health care and more.
      </p>
    </div>
  );
}
