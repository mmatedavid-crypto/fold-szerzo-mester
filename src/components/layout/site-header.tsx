import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DrFoldLogo } from "@/components/brand/dr-fold-logo";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLawyer, setIsLawyer] = useState(false);

  useEffect(() => {
    const loadRoles = async (userId: string | undefined) => {
      if (!userId) {
        setIsLawyer(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["lawyer", "admin"]);
      setIsLawyer(!!(data && data.length > 0));
    };
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      loadRoles(data.session?.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      loadRoles(session?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-df-border bg-df-card/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="shrink-0" aria-label="Dr Föld főoldal">
          <DrFoldLogo className="hidden sm:inline-flex" />
          <DrFoldLogo variant="compact" className="sm:hidden" />
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-semibold text-df-ink lg:flex">
          <Link to="/kifuggesztesek" className="hover:text-df-green">
            Kifüggesztések
          </Link>
          <Link to="/berleti-dij-iranytu" className="hover:text-df-green">
            Ár iránytű
          </Link>
          <Link to="/ranghely-kalkulator" className="hover:text-df-green">
            Ranghely kalkulátor
          </Link>
          <Link to="/elfogado-nyilatkozat" className="hover:text-df-green">
            Elfogadó nyilatkozat
          </Link>
          <Link to="/foldberleti-szerzodes" className="hover:text-df-green">
            Bérleti szerződés
          </Link>
          <Link to="/fold-adas-vetel" className="hover:text-df-green">
            Adásvétel
          </Link>
          {isLawyer && (
            <Link
              to="/admin/klauzulak"
              className="rounded-md border border-df-green/40 bg-df-green/10 px-3 py-1 text-df-green hover:bg-df-green/15"
            >
              Klauzula jóváhagyások
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {isLawyer && (
            <Button
              asChild
              size="sm"
              className="bg-df-green text-white hover:bg-df-green/90"
            >
              <Link to="/admin/klauzulak">Klauzula jóváhagyások</Link>
            </Button>
          )}
          {authed ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden border-df-green sm:inline-flex"
            >
              <Link to="/dashboard">Műhely</Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden border-df-green sm:inline-flex"
            >
              <Link to="/belepes">Belépés</Link>
            </Button>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-df-border text-df-green lg:hidden"
            aria-label="Menü"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-df-border bg-df-card px-4 py-4 lg:hidden">
          <div className="container mx-auto grid gap-3 text-sm font-semibold text-df-ink">
            <Link to="/kifuggesztesek" onClick={() => setMenuOpen(false)}>
              Kifüggesztések
            </Link>
            <Link to="/berleti-dij-iranytu" onClick={() => setMenuOpen(false)}>
              Ár iránytű
            </Link>
            <Link to="/ranghely-kalkulator" onClick={() => setMenuOpen(false)}>
              Ranghely kalkulátor
            </Link>
            <Link to="/elfogado-nyilatkozat" onClick={() => setMenuOpen(false)}>
              Elfogadó nyilatkozat
            </Link>
            <Link to="/foldberleti-szerzodes" onClick={() => setMenuOpen(false)}>
              Bérleti szerződés
            </Link>
            <Link to="/fold-adas-vetel" onClick={() => setMenuOpen(false)}>
              Adásvétel
            </Link>
            {isLawyer && (
              <Link
                to="/admin/klauzulak"
                onClick={() => setMenuOpen(false)}
                className="text-df-green"
              >
                Klauzula jóváhagyások
              </Link>
            )}
            <Link to={authed ? "/dashboard" : "/belepes"} onClick={() => setMenuOpen(false)}>
              {authed ? "Műhely" : "Belépés"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
