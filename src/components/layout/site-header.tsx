import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

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
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-primary">
          <Sprout className="h-6 w-6" />
          <span className="hidden sm:inline">Földbérleti Szerződés</span>
          <span className="sm:hidden">Földbérleti</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/szerzodes/uj" className="text-foreground hover:text-primary">Szerződés</Link>
          <Link to="/kifuggesztesek" className="text-foreground hover:text-primary">Kifüggesztések</Link>
          <Link to="/ranghely-kalkulator" className="text-foreground hover:text-primary">Ranghely kalkulátor</Link>
          <Link to="/elfogado-nyilatkozat" className="text-foreground hover:text-primary">Elfogadó nyilatkozat</Link>
          <Link to="/fold-adas-vetel" className="text-foreground hover:text-primary">Föld adás-vétel</Link>
        </nav>
        <div className="flex items-center gap-2">
          {authed ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard">Műhely</Link></Button>
              <Button asChild size="sm"><Link to="/szerzodes/uj">Új szerződés</Link></Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/belepes">Belépés</Link></Button>
              <Button asChild size="sm"><Link to="/regisztracio">Regisztráció</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}