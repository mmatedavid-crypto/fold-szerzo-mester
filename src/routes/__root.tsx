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

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";
import { CookieBanner } from "@/components/legal/cookie-banner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Az oldal nem található</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A keresett oldal nem létezik, vagy időközben máshová került.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Vissza a főoldalra
          </Link>
        </div>
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ez az oldal most nem töltött be
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Valami megakadt nálunk. Próbáld újratölteni, vagy menj vissza a főoldalra.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Újrapróbálom
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Főoldal
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dr Föld | Ha előrébb állsz, ne maradj hátul." },
      {
        name: "description",
        content:
          "Dr Föld ranghely-kalkulátor, kifüggesztés kereső és földbérleti szerződés-előkészítés magyar gazdáknak.",
      },
      { name: "author", content: "Dr Föld" },
      { property: "og:title", content: "Dr Föld | Ha előrébb állsz, ne maradj hátul." },
      {
        property: "og:description",
        content: "Ravasz a gazda. Nézd meg, hol állsz a ranghelyben, és lépj időben.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Dr Föld | Ha előrébb állsz, ne maradj hátul." },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/hi1om8j0elZ5DuxO0fCooVpBb7O2/social-images/social-1780872566645-Image_3.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/hi1om8j0elZ5DuxO0fCooVpBb7O2/social-images/social-1780872566645-Image_3.webp",
      },
      {
        name: "twitter:description",
        content:
          "Dr Föld segít gazdáknak és földtulajdonosoknak kifüggesztéseket figyelni, előhaszonbérleti ranghelyet ellenőrizni, elfogadó nyilatkozatot és földbérleti szerződést készíteni.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
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
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-right" richColors />
      <CookieBanner />
    </QueryClientProvider>
  );
}
