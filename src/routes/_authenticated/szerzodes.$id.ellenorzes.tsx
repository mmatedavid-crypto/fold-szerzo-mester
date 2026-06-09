import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { runRiskCheck, getDraft } from "@/lib/contracts/drafts.functions";
import type { Draft, RiskReport, RiskLevel } from "@/lib/contracts/types";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, FileWarning, ShieldAlert, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/szerzodes/$id/ellenorzes")({
  head: () => ({ meta: [{ title: "Jogi kockázati ellenőrzés" }] }),
  component: RiskPage,
});

const LEVEL_META: Record<RiskLevel, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  rendben: { label: "Rendben", icon: CheckCircle2, cls: "text-primary" },
  figyelmeztetes: { label: "Figyelmeztetés", icon: AlertTriangle, cls: "text-warning" },
  jogi_ellenorzes: { label: "Jogi ellenőrzést igényel", icon: ShieldAlert, cls: "text-warning" },
  hianyzo_kotelezo: { label: "Hiányzó kötelező adat", icon: FileWarning, cls: "text-destructive" },
};

function RiskPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetch = useServerFn(getDraft);
  const run = useServerFn(runRiskCheck);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [report, setReport] = useState<RiskReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await fetch({ data: { id } });
        setDraft(d);
        const r = await run({ data: { id } });
        setReport(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hiba");
      }
    })();
  }, [id, fetch, run]);

  const sections = [
    "Preambulum",
    "Szerződés tárgya",
    "Időtartam",
    "Haszonbérleti díj",
    "Előhaszonbérleti jog",
    "Földhasználat",
    "Megszűnés",
    "Záró rendelkezések",
  ];

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-serif text-3xl">Jogi kockázati ellenőrzés</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          A végleges szerződés szövege csak fizetés vagy elérhető előfizetési keret után készül el.
          Ezen a lépésen csak az ellenőrzést és a tervezett szerződés felépítését látod.
        </p>

        {error && <div className="text-destructive mt-4">{error}</div>}
        {draft && report && (
          <>
            <Card className="p-6 mt-6">
              <h2 className="font-serif text-xl">Adatok összesítése</h2>
              <dl className="grid md:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                <Row
                  k="Haszonbérbeadó"
                  v={[
                    draft.lessor_data?.name,
                    ...(draft.lessor_data?.co_lessors ?? []).map((c) => c.name),
                  ]
                    .filter(Boolean)
                    .join("; ")}
                />
                <Row k="Haszonbérlő" v={draft.lessee_data?.name} />
                <Row k="Parcellák száma" v={String(draft.parcels?.length ?? 0)} />
                <Row
                  k="Települések"
                  v={(draft.parcels ?? [])
                    .map((p) => p.settlement)
                    .filter(Boolean)
                    .join(", ")}
                />
                <Row
                  k="Időtartam"
                  v={`${draft.term?.start_date ?? "—"} → ${draft.term?.end_date ?? "—"}`}
                />
                <Row k="Díjmodell" v={draft.rent?.model ?? "—"} />
              </dl>
            </Card>

            <Card className="p-6 mt-4">
              <h2 className="font-serif text-xl">Kockázati riport</h2>
              <ul className="mt-3 space-y-2">
                {report.items.map((it) => {
                  const m = LEVEL_META[it.level];
                  const Icon = m.icon;
                  return (
                    <li key={it.id} className="flex items-start gap-2 text-sm">
                      <Icon className={"h-4 w-4 mt-0.5 " + m.cls} />
                      <div>
                        <Badge variant="outline" className={"mr-2 " + m.cls}>
                          {m.label}
                        </Badge>
                        <span>{it.message}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="p-6 mt-4 relative overflow-hidden">
              <h2 className="font-serif text-xl">Tervezett szerződés szakaszai</h2>
              <div className="mt-3 space-y-2">
                {sections.map((s, i) => (
                  <div key={s} className="text-sm border-l-2 border-primary/40 pl-3 py-1">
                    <span className="text-muted-foreground mr-2">{i + 1}.</span>
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-6 relative rounded-md border border-dashed border-border bg-muted/30 p-6 select-none">
                <div className="text-xs font-mono blur-sm text-muted-foreground leading-relaxed">
                  A végleges szerződés-előkészítő dokumentum a megadott felek, földterületek,
                  bérleti díj, időtartam és előhaszonbérleti adatok alapján készül el. A jogszabályi
                  hivatkozások és klauzulák a kiválasztott sablonverzió szerint kerülnek
                  beillesztésre.
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rotate-[-12deg] text-2xl font-bold text-primary/60 border-4 border-primary/40 px-6 py-2 rounded">
                    MINTA — NEM ÉRVÉNYES
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Lock className="h-3 w-3" /> A teljes szerződés szövege csak a véglegesítés után
                érhető el.
              </p>
            </Card>

            <div className="flex justify-between mt-6 gap-2 flex-wrap">
              <Button asChild variant="ghost">
                <Link to="/szerzodes/$id/szerkesztes" params={{ id: draft.id }}>
                  ← Vissza szerkesztésre
                </Link>
              </Button>
              <Button
                disabled={!report.can_finalize}
                onClick={() => navigate({ to: "/szerzodes/$id/fizetes", params: { id: draft.id } })}
              >
                {report.can_finalize
                  ? "Tovább a fizetésre / véglegesítésre"
                  : "Hiányzó kötelező adat — javítsd a vázlatban"}
              </Button>
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v ?? "—"}</dd>
    </>
  );
}
