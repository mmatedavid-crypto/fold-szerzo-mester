import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OAuthButton } from "@/components/auth/apple-button";
import { authErrorMessage } from "@/lib/user-facing-errors";

export const Route = createFileRoute("/belepes")({
  head: () => ({
    meta: [
      { title: "Belépés | Dr Föld" },
      { name: "description", content: "Lépj be a Dr Föld fiókodba." },
    ],
  }),
  component: BelepesPage,
});

function BelepesPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("Beléptél. Folytathatod a földügyet.");
    navigate({ to: "/dashboard" });
  }

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-6">
          <h1 className="font-serif text-2xl">Belépés</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lépj be a Műhelybe, ahol a vázlatok, dokumentumok és figyelések várnak.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Jelszó</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Belépés..." : "Belépek"}
            </Button>
          </form>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">vagy</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-4 space-y-2">
            <OAuthButton provider="google" label="Belépés Google-lel" />
            <OAuthButton provider="apple" label="Belépés Apple-lel" />
          </div>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            Még nincs fiókod?{" "}
            <Link to="/regisztracio" className="text-primary underline">
              Regisztráció
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
