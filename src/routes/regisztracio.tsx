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

export const Route = createFileRoute("/regisztracio")({
  head: () => ({
    meta: [
      { title: "Regisztráció | Dr Föld" },
      {
        name: "description",
        content: "Hozz létre Dr Föld fiókot a földügyi eszközök használatához.",
      },
    ],
  }),
  component: RegPage,
});

function RegPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { name } },
    });
    setLoading(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("Fiók létrehozva. Indulhat a Dr Föld Műhely.");
    navigate({ to: "/dashboard" });
  }

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-6">
          <h1 className="font-serif text-2xl">Regisztráció</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hozz létre fiókot, hogy a vázlataid, dokumentumaid és figyeléseid megmaradjanak.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="name">Név</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Legalább 6 karakter. A földügyekhez nem kell bonyolítani, csak legyen biztonságos.
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Regisztráció..." : "Regisztrálok"}
            </Button>
          </form>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">vagy</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-4 space-y-2">
            <OAuthButton provider="google" />
            <OAuthButton provider="apple" />
          </div>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            Van már fiókod?{" "}
            <Link to="/belepes" className="text-primary underline">
              Belépés
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
