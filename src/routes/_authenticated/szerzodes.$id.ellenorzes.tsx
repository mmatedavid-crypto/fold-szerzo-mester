import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { runRiskCheck, getDraft } from "@/lib/contracts/drafts.functions";
import type { Draft, RiskReport, RiskLevel } from "@/lib/contracts/types";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandBadge, StampBadge } from "@/components/brand/brand-elements";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { contractFlowErrorMessage } from "@/lib/user-facing-errors";

export const Route = createFileRoute("/_authenticated/szerzodes/$id/ellenorzes")({
  head: () => ({ meta: [{ title: "Jogi kockázati ellenőrzés" }] }),
  component: RiskPage,
});

const LEVEL_META: Record<
  RiskLevel,
  { label: string; icon: typeof CheckCircle2; cls: string; badge: string }
> = {
  rendben: {
    label: "Rendben",
    icon: CheckCircle2,
    cls: "text-df-green",
    badge: "border-df-green text-df-green",
  },
  figyelmeztetes: {
    label: "Figyelmeztetés",
    icon: AlertTriangle,
    cls: "text-df-yellow",
    badge: "border-df-yellow text-df-green",
  },
  jogi_ellenorzes: {
    label: "Jogi ellenőrzést igényel",
    icon: ShieldAlert,
    cls: "text-df-yellow",
    badge: "border-df-yellow text-df-green",
  },
  hianyzo_kotelezo: {
    label: "Hiányzó kötelező adat",
    icon: FileWarning,
    cls: "text-df-red",
    badge: "border-df-red text-df-red",
  },
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
        setError(contractFlowErrorMessage(e));
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
      <section className="container mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-lg border border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          <BrandBadge>Ravasz, de szabályos</BrandBadge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
            Jogi kockázati ellenőrzés
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-df-gray md:text-base">
            A végleges szerződés szövege csak fizetés vagy elérhető előfizetési keret után készül
            el. Itt még átnézed a kötelező adatokat, a kockázati jelzéseket és a tervezett szerződés
            felépítését.
          </p>
        </div>

        {error && (
          <Card className="mt-6 border-df-red/40 bg-df-red/10 p-6">
            <h2 className="font-brand text-xl font-bold text-df-red">
              Az ellenőrzés most nem futott le.
            </h2>
            <p className="mt-2 text-sm leading-6 text-df-ink">{error}</p>
            <Button asChild className="mt-4 border-df-green text-df-green" variant="outline">
              <Link to="/dashboard">Vissza a Műhelybe</Link>
            </Button>
          </Card>
        )}
        {!draft && !report && !error && (
          <Card className="mt-6 border-df-border bg-df-card p-6 text-sm text-df-gray">
            Kockázati ellenőrzés előkészítése…
          </Card>
        )}
        {draft && report && (
          <>
            <Card className="mt-6 border-df-border bg-df-card p-6 shadow-sm">
              <h2 className="font-brand text-2xl font-bold text-df-green">Adatok összesítése</h2>
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

            <Card className="mt-4 border-df-border bg-df-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-brand text-2xl font-bold text-df-green">Kockázati riport</h2>
                <StampBadge
                  className={
                    report.can_finalize
                      ? "border-df-green text-df-green"
                      : "border-df-red text-df-red"
                  }
                >
                  {report.can_finalize ? "Véglegesíthető" : "Javítandó"}
                </StampBadge>
              </div>
              <ul className="mt-3 space-y-2">
                {report.items.map((it) => {
                  const m = LEVEL_META[it.level];
                  const Icon = m.icon;
                  return (
                    <li
                      key={it.id}
                      className="flex items-start gap-3 rounded-md border border-df-border bg-white/70 p-3 text-sm"
                    >
                      <Icon className={"h-4 w-4 mt-0.5 " + m.cls} />
                      <div>
                        <Badge variant="outline" className={"mr-2 " + m.badge}>
                          {m.label}
                        </Badge>
                        <span>{it.message}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="relative mt-4 overflow-hidden border-df-border bg-df-card p-6 shadow-sm">
              <h2 className="font-brand text-2xl font-bold text-df-green">
                Tervezett szerződés szakaszai
              </h2>
              <div className="mt-3 space-y-2">
                {sections.map((s, i) => (
                  <div key={s} className="text-sm border-l-2 border-df-green/40 pl-3 py-1">
                    <span className="text-df-gray mr-2">{i + 1}.</span>
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-6 relative rounded-md border border-dashed border-df-border bg-df-cream/50 p-6 select-none">
                <div className="text-xs font-mono blur-sm text-df-gray leading-relaxed">
                  A végleges szerződés-előkészítő dokumentum a megadott felek, földterületek,
                  bérleti díj, időtartam és előhaszonbérleti adatok alapján készül el. A jogszabályi
                  hivatkozások és klauzulák a kiválasztott sablonverzió szerint kerülnek
                  beillesztésre.
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rotate-[-12deg] border-4 border-df-red/40 px-6 py-2 text-2xl font-bold text-df-red/70 rounded">
                    MINTA — NEM ÉRVÉNYES
                  </div>
                </div>
              </div>
              <p className="text-xs text-df-gray mt-3 flex items-center gap-1">
                <Lock className="h-3 w-3" /> A teljes szerződés szövege csak a véglegesítés után
                érhető el.
              </p>
            </Card>

            <div className="flex justify-between mt-6 gap-2 flex-wrap">
              <Button asChild variant="outline" className="border-df-green text-df-green">
                <Link to="/szerzodes/$id/szerkesztes" params={{ id: draft.id }}>
                  ← Vissza szerkesztésre
                </Link>
              </Button>
              <Button
                className="bg-df-green text-white hover:bg-[#173B2A]"
                disabled={!report.can_finalize}
                onClick={() => navigate({ to: "/szerzodes/$id/fizetes", params: { id: draft.id } })}
              >
                {report.can_finalize
                  ? "Tovább a fizetésre / véglegesítésre"
                  : "Hiányzó kötelező adat — javítsd a vázlatban"}
                {report.can_finalize && <ArrowRight className="ml-2 h-4 w-4" />}
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
      <dt className="text-df-gray">{k}</dt>
      <dd className="font-medium text-df-ink">{v ?? "—"}</dd>
    </>
  );
}
