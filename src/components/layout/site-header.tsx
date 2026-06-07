import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DrFoldLogo } from "@/components/brand/dr-fold-logo";
import { BrandButton } from "@/components/brand/brand-buttons";

export function SiteHeader() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-df-border bg-df-card/95 backdrop-blur">
      <div className="container mx-auto flex min-h-20 items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="shrink-0" aria-label="Dr Föld főoldal">
          <DrFoldLogo className="hidden sm:inline-flex" />
          <DrFoldLogo variant="compact" className="h-12 w-12 sm:hidden" />
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-df-ink lg:flex">
          <Link to="/kifuggesztesek" className="hover:text-df-green">
            Kifüggesztések
          </Link>
          <Link to="/ranghely-kalkulator" className="hover:text-df-green">
            Ranghely
          </Link>
          <Link to="/elfogado-nyilatkozat" className="hover:text-df-green">
            Elfogadó nyilatkozat
          </Link>
          <Link to="/foldberleti-szerzodes" className="hover:text-df-green">
            Földbérleti szerződés
          </Link>
          <a href="/#ugyvedi-ugyintezes" className="hover:text-df-green">
            Ügyvédi ügyintézés
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <BrandButton asChild className="hidden xl:inline-flex">
            <Link to="/ranghely-kalkulator">Megnézem, előrébb állok-e</Link>
          </BrandButton>
          {authed ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Műhely</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/szerzodes/uj">Új szerződés</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/belepes">Belépés</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/regisztracio">Regisztráció</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
