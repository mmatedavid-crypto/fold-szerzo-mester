import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getStoredConsent, saveConsent } from "@/lib/cookie-consent";
import { Cookie, ShieldCheck } from "lucide-react";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!getStoredConsent());
  }, []);

  if (!open) return null;

  const accept = (analytics: boolean) => {
    saveConsent({ necessary: true, analytics, decided_at: new Date().toISOString() });
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Süti beállítások"
      className="fixed inset-x-3 bottom-3 z-50 rounded-lg border border-df-border bg-df-card p-4 text-sm shadow-[0_18px_55px_rgba(26,26,26,0.18)] md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-df-border bg-df-cream text-df-green">
          <Cookie className="h-4 w-4" />
        </span>
        <div>
          <div className="font-brand text-lg font-bold text-df-green">Sütikről röviden</div>
          <p className="mt-1 text-xs leading-relaxed text-df-gray">
            Csak a működéshez szükséges sütiket használjuk alapból (bejelentkezés, session). Anonim
            statisztikai sütiket csak a hozzájárulásoddal töltünk be. Részletek a{" "}
            <Link to="/cookie-szabalyzat" className="font-semibold text-df-green underline">
              süti tájékoztatóban
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-df-green text-df-green"
          onClick={() => accept(false)}
        >
          Csak a szükségeseket
        </Button>
        <Button
          size="sm"
          className="bg-df-green text-white hover:bg-[#173B2A]"
          onClick={() => accept(true)}
        >
          <ShieldCheck className="h-4 w-4" />
          Elfogadom
        </Button>
      </div>
    </div>
  );
}
