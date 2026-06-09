import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OAuthButton } from "@/components/auth/apple-button";
import { authErrorMessage } from "@/lib/user-facing-errors";
import { company } from "@/lib/company";
import { FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/regisztracio")({
  head: () => ({
    meta: [
      { title: "Regisztráció | Dr Föld" },
      {
        name: "description",
        content: "Hozz létre Dr Föld fiókot a földügyi eszközök használatához.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/regisztracio` }],
  }),
  component: RegPage,
});

function RegPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
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
      <section className="container mx-auto grid max-w-5xl gap-8 px-4 py-16 lg:grid-cols-[1fr,430px] lg:items-center">
        <div className="max-w-xl">
          <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
            Ravasz a gazda
          </Badge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
            Legyen saját Dr Föld Műhelyed.
          </h1>
          <p className="mt-4 text-base leading-7 text-df-gray">
            Mentsd el a szerződésvázlatokat, figyeld a kifüggesztéseket, és tartsd egyben a
            dokumentumaidat. Nem trükk. Rendezett földügy.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-df-gray sm:grid-cols-2">
            <TrustNote
              icon={<FileText className="h-5 w-5" />}
              text="Vázlatok és dokumentumok egy helyen"
            />
            <TrustNote
              icon={<ShieldCheck className="h-5 w-5" />}
              text="Döntéstámogatás, nem ügyvédi iroda"
            />
          </div>
        </div>

        <Card className="border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.10)]">
          <h2 className="font-brand text-2xl font-bold text-df-green">Regisztráció</h2>
          <p className="mt-2 text-sm text-df-gray">Hozz létre fiókot, hogy a munkád megmaradjon.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="name">Név</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-df-border bg-white"
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
                className="border-df-border bg-white"
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
                className="border-df-border bg-white"
              />
              <p className="mt-1 text-xs text-df-gray">
                Legalább 6 karakter. A földügyekhez nem kell bonyolítani, csak legyen biztonságos.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-df-green text-white hover:bg-[#173B2A]"
            >
              {loading ? "Regisztráció..." : "Regisztrálok"}
            </Button>
          </form>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-df-border" />
            <span className="text-xs text-df-gray">vagy</span>
            <div className="h-px flex-1 bg-df-border" />
          </div>
          <div className="mt-4 space-y-2">
            <OAuthButton provider="google" />
            <OAuthButton provider="apple" />
          </div>
          <p className="mt-4 text-center text-sm text-df-gray">
            Van már fiókod?{" "}
            <Link to="/belepes" className="font-semibold text-df-green underline">
              Belépés
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}

function TrustNote({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-df-border bg-df-card p-3">
      <div className="mt-0.5 shrink-0 text-df-green">{icon}</div>
      <p>{text}</p>
    </div>
  );
}
