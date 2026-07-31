import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        That page does not exist. Start again from the city list.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 text-lg font-bold text-primary-foreground"
        >
          Find food near me
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <h1 className="text-3xl font-bold">This page did not load</h1>
      <p className="mt-3 text-muted-foreground">
        Something went wrong. Try again, or go back to the city list.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 text-lg font-bold text-primary-foreground"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex min-h-12 items-center rounded-md border-2 border-primary px-6 text-lg font-bold text-primary"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Free Food Finder — food banks and free meals near you" },
      {
        name: "description",
        content:
          "Find free food banks, pantries and hot meals near you in New York City, Chicago, Los Angeles, San Francisco, Minneapolis and Philadelphia. No sign up needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-lg focus:font-bold focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <div className="flex min-h-dvh flex-col bg-background">
        <header className="rounded-b-[2rem] bg-primary text-primary-foreground shadow-lg">
          <div className="mx-auto max-w-3xl px-5 pb-7 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to="/" className="text-2xl font-bold tracking-tight">
                Free Food Finder
              </Link>
              <nav aria-label="Main">
                <ul className="flex gap-5 text-lg">
                  <li>
                    <Link
                      to="/"
                      activeOptions={{ exact: true }}
                      activeProps={{ className: "font-bold" }}
                      className="underline decoration-2 underline-offset-4"
                    >
                      Cities
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      activeProps={{ className: "font-bold" }}
                      className="underline decoration-2 underline-offset-4"
                    >
                      About
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
            <p className="mt-3 text-lg leading-snug">
              You are safe here. Everything is free. No sign up, no ID, nothing saved.
            </p>
          </div>
        </header>

        <main id="main" className="flex-1">
          {/* Required: nested routes render here. */}
          <Outlet />
        </main>


        <footer className="border-t-2 border-border bg-card">
          <div className="mx-auto max-w-3xl px-5 py-6 text-base text-muted-foreground">
            <p>
              This site is free to use. We do not ask for your name and we do not store your
              location.
            </p>
            <p className="mt-2">
              In an emergency in the United States, call or text{" "}
              <a
                href="tel:211"
                className="font-bold text-foreground underline decoration-2 underline-offset-4"
              >
                211
              </a>{" "}
              for local food and shelter help.
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
