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
import { company } from "@/lib/company";
import { DrFoldLogo } from "@/components/brand/dr-fold-logo";
import { BrandBadge } from "@/components/brand/brand-elements";
import { AlertTriangle, ArrowLeft, RotateCw } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-df-cream px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-df-border bg-df-card p-6 text-center shadow-[0_18px_55px_rgba(26,26,26,0.12)]">
        <div className="flex justify-center">
          <DrFoldLogo variant="full" />
        </div>
        <BrandBadge className="mt-6">Kifüggesztés nincs itt</BrandBadge>
        <h1 className="mt-4 font-brand text-7xl font-bold leading-none text-df-green">404</h1>
        <h2 className="mt-4 font-brand text-2xl font-bold text-df-ink">Az oldal nem található</h2>
        <p className="mt-3 text-sm leading-6 text-df-gray">
          A keresett oldal nem létezik, vagy időközben máshová került.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-df-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#173B2A]"
          >
            <ArrowLeft className="h-4 w-4" />
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
    <div className="flex min-h-screen items-center justify-center bg-df-cream px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-df-border bg-df-card p-6 text-center shadow-[0_18px_55px_rgba(26,26,26,0.12)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-md border border-df-red/40 bg-df-red/10 text-df-red">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <BrandBadge className="mt-5">Dr Föld műhely</BrandBadge>
        <h1 className="mt-4 font-brand text-3xl font-bold tracking-tight text-df-green">
          Ez az oldal most nem töltött be
        </h1>
        <p className="mt-3 text-sm leading-6 text-df-gray">
          Valami megakadt nálunk. Próbáld újratölteni, vagy menj vissza a főoldalra.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-df-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#173B2A]"
          >
            <RotateCw className="h-4 w-4" />
            Újrapróbálom
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-df-green bg-df-card px-4 py-2 text-sm font-semibold text-df-green transition-colors hover:bg-df-cream"
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
      { name: "theme-color", content: "#1F4D37" },
      { title: "Dr Föld | Ha előrébb állsz, ne maradj hátul." },
      {
        name: "description",
        content:
          "Dr Föld ranghely-kalkulátor, kifüggesztés kereső és földbérleti szerződés-előkészítés magyar gazdáknak.",
      },
      { name: "author", content: company.brandName },
      { property: "og:title", content: "Dr Föld | Ha előrébb állsz, ne maradj hátul." },
      {
        property: "og:description",
        content: "Ravasz a gazda. Nézd meg, hol állsz a ranghelyben, és lépj időben.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: company.brandName },
      { property: "og:locale", content: "hu_HU" },
      { property: "og:image", content: `${company.websiteUrl}/og/drfold-og.svg` },
      { property: "og:image:alt", content: "Dr Föld — Ravasz a gazda" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dr Föld | Ha előrébb állsz, ne maradj hátul." },
      {
        name: "twitter:description",
        content:
          "Dr Föld segít gazdáknak és földtulajdonosoknak kifüggesztéseket figyelni, előhaszonbérleti ranghelyet ellenőrizni, elfogadó nyilatkozatot és földbérleti szerződést készíteni.",
      },
      { name: "twitter:image", content: `${company.websiteUrl}/og/drfold-og.svg` },
      { name: "twitter:image:alt", content: "Dr Föld — Ravasz a gazda" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
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
