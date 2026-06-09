import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getStoredConsent, saveConsent } from "@/lib/cookie-consent";

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
      className="fixed inset-x-2 bottom-2 z-50 md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md rounded-lg border border-border bg-background shadow-lg p-4 text-sm"
    >
      <div className="font-medium text-foreground">Sütikről röviden</div>
      <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
        Csak a működéshez szükséges sütiket használjuk alapból (bejelentkezés, session). Anonim
        statisztikai sütiket csak a hozzájárulásoddal töltünk be. Részletek a{" "}
        <Link to="/cookie-szabalyzat" className="underline text-primary">
          süti tájékoztatóban
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => accept(false)}>
          Csak a szükségeseket
        </Button>
        <Button size="sm" onClick={() => accept(true)}>
          Elfogadom
        </Button>
      </div>
    </div>
  );
}
