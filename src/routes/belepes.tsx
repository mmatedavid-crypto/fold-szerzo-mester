import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
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
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/belepes")({
  head: () => ({
    meta: [
      { title: "Belépés | Dr Föld" },
      { name: "description", content: "Lépj be a Dr Föld fiókodba." },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/belepes` }],
  }),
  component: BelepesPage,
});

function BelepesPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
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
      <section className="container mx-auto grid max-w-5xl gap-8 px-4 py-16 lg:grid-cols-[1fr,430px] lg:items-center">
        <div className="max-w-xl">
          <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
            Dr Föld Műhely
          </Badge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
            Lépj be, és folytasd ott, ahol a földügy megállt.
          </h1>
          <p className="mt-4 text-base leading-7 text-df-gray">
            A vázlatok, dokumentumok, figyelések és ellenőrzések egy helyen várnak. Ravasz a gazda:
            nem kezdi újra, ha már összerakta.
          </p>
          <div className="mt-6 flex gap-3 rounded-md border border-df-border bg-df-card p-3 text-sm text-df-gray">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-df-green" />
            <p>
              Az adataidat fiókhoz kötve őrizzük. Fizetés és dokumentumgenerálás előtt mindig
              visszaellenőrizhetsz.
            </p>
          </div>
        </div>

        <Card className="border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.10)]">
          <h2 className="font-brand text-2xl font-bold text-df-green">Belépés</h2>
          <p className="mt-2 text-sm text-df-gray">Folytasd a Dr Föld Műhelyben.</p>
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
                className="border-df-border bg-white"
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
                className="border-df-border bg-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-df-green text-white hover:bg-[#173B2A]"
            >
              {loading ? "Belépés..." : "Belépek"}
            </Button>
          </form>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-df-border" />
            <span className="text-xs text-df-gray">vagy</span>
            <div className="h-px flex-1 bg-df-border" />
          </div>
          <div className="mt-4 space-y-2">
            <OAuthButton provider="google" label="Belépés Google-lel" />
            <OAuthButton provider="apple" label="Belépés Apple-lel" />
          </div>
          <p className="mt-4 text-center text-sm text-df-gray">
            Még nincs fiókod?{" "}
            <Link to="/regisztracio" className="font-semibold text-df-green underline">
              Regisztráció
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
