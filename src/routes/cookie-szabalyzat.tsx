import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { BrandBadge } from "@/components/brand/brand-elements";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  LEGACY_COOKIE_CONSENT_STORAGE_KEY,
} from "@/lib/cookie-consent";

export const Route = createFileRoute("/cookie-szabalyzat")({
  head: () => ({
    meta: [
      { title: "Süti tájékoztató | Dr Föld" },
      {
        name: "description",
        content: "A Dr Föld süti (cookie) használatáról szóló tájékoztató.",
      },
    ],
  }),
  component: CookiePage,
});

function resetConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_COOKIE_CONSENT_STORAGE_KEY);
  window.location.reload();
}

function CookiePage() {
  return (
    <PageShell>
      <article className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 rounded-lg border border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          <BrandBadge>Jogi tájékoztatás</BrandBadge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green">
            Süti (cookie) tájékoztató
          </h1>
          <p className="mt-3 text-sm leading-6 text-df-gray">
            Röviden és érthetően arról, milyen sütiket használ a Dr Föld.
          </p>
        </div>
        <div className="prose prose-stone max-w-none dark:prose-invert prose-headings:font-brand prose-headings:text-df-green prose-a:text-df-green">
          <h2>Mik azok a sütik?</h2>
          <p>
            A sütik kis adatcsomagok, amelyeket a böngésződ tárol. A működéshez nélkülözhetetlen,
            valamint statisztikai célú sütiket használunk.
          </p>

          <h2>Kötelező (szükséges) sütik</h2>
          <ul>
            <li>
              <code>sb-*</code> — bejelentkezési session (Supabase Auth). Élettartam: max. 1 hét.
            </li>
            <li>
              <code>{COOKIE_CONSENT_STORAGE_KEY}</code> — süti-hozzájárulás emlékezése. Élettartam:
              12 hónap.
            </li>
          </ul>

          <h2>Statisztikai sütik (csak hozzájárulással)</h2>
          <p>
            Anonim látogatottsági statisztika gyűjtésére használjuk. Egyéni azonosításra nem
            alkalmas adatok, az IP-cím anonimizálva. Csak akkor töltjük be, ha az alsó sávon az
            „Elfogadom” gombra kattintottál.
          </p>

          <h2>Marketing sütik</h2>
          <p>
            Marketing célú sütiket <strong>nem</strong> használunk.
          </p>

          <h2>Hozzájárulás visszavonása</h2>
          <p>A beállításodat bármikor módosíthatod:</p>
          <Button
            onClick={resetConsent}
            variant="outline"
            className="border-df-green text-df-green"
          >
            Süti beállítások újraindítása
          </Button>
        </div>
      </article>
    </PageShell>
  );
}
