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

export const Route = createFileRoute("/regisztracio")({
  head: () => ({
    meta: [
      { title: "Regisztráció — Földbérleti Szerződés Generátor" },
      { name: "description", content: "Hozz létre fiókot a szerződés-előkészítő szolgáltatáshoz." },
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
      toast.error("Sikertelen regisztráció: " + error.message);
      return;
    }
    toast.success("Sikeres regisztráció. Bejelentkeztetünk.");
    navigate({ to: "/dashboard" });
  }

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-6">
          <h1 className="font-serif text-2xl">Regisztráció</h1>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="name">Név</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Jelszó</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
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
            Van már fiókod? <Link to="/belepes" className="text-primary underline">Belépés</Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}