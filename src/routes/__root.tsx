import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useFavorites } from "../lib/favorites";
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
          className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-lg font-bold text-primary-foreground"
        >
          Find food near me
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
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
          className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-lg font-bold text-primary-foreground"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex min-h-12 items-center rounded-xl border-2 border-primary px-6 text-lg font-bold text-primary"
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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "ZipFood — free food in Los Angeles" },
      {
        name: "description",
        content:
          "Free food banks, pantries and hot meals in Los Angeles — plus New York City, Chicago, Los Angeles, San Francisco, Minneapolis and Philadelphia. No sign up needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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

function SavedLink() {
  const { list } = useFavorites();
  return (
    <Link
      to="/saved"
      activeProps={{ className: "font-bold" }}
      className="inline-flex min-h-11 items-center px-2 underline decoration-2 underline-offset-4"
    >
      Saved{list.length ? ` (${list.length})` : ""}
    </Link>
  );
}

function SlowNotice() {
  const [slow, setSlow] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const c = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } })
      .connection;
    setSlow(!!c && (c.saveData === true || ["slow-2g", "2g", "3g"].includes(c.effectiveType ?? "")));
    const upd = () => setOffline(!navigator.onLine);
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
    };
  }, []);
  if (!slow && !offline) return null;
  return (
    <p className="mt-2 text-base leading-snug opacity-90">
      {offline
        ? "You are offline. Showing what is saved on your phone."
        : "Slow connection detected. The site is in light mode."}
    </p>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:text-lg focus:font-bold focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <div className="flex min-h-dvh flex-col bg-background">
        <header className="rounded-b-[2rem] bg-primary text-primary-foreground shadow-lg">
          <div className="mx-auto max-w-3xl px-4 pb-9 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 sm:pb-7 sm:pt-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <Link to="/" className="truncate text-2xl font-bold tracking-tight">
                ZipFood
              </Link>
              <nav aria-label="Main">
                <ul className="flex gap-1 text-base sm:gap-3 sm:text-lg">
                  <li>
                    <Link
                      to="/"
                      activeOptions={{ exact: true }}
                      activeProps={{ className: "font-bold" }}
                      className="inline-flex min-h-11 items-center px-2 underline decoration-2 underline-offset-4"
                    >
                      Cities
                    </Link>
                  </li>
                  <li>
                    <SavedLink />
                  </li>
                  <li>
                    <Link
                      to="/about"
                      activeProps={{ className: "font-bold" }}
                      className="inline-flex min-h-11 items-center px-2 underline decoration-2 underline-offset-4"
                    >
                      About
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
            <p className="mt-2 text-base leading-snug sm:mt-3 sm:text-lg">
              You are safe here. Everything is free. No sign up, no ID. Anything you save stays on your phone.
            </p>
            <SlowNotice />
          </div>
        </header>

        <main id="main" className="flex-1">
          {/* Required: nested routes render here. */}
          <Outlet />
        </main>


        <footer className="border-t-2 border-border bg-card">
          <div className="mx-auto max-w-3xl px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-base text-muted-foreground">
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
