import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/lib/contracts/finalize.functions";
import { CheckCircle2, Download, FileCheck2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { contractFlowErrorMessage } from "@/lib/user-facing-errors";

const Search = z.object({ doc: z.string().uuid() });

export const Route = createFileRoute("/_authenticated/szerzodes/$id/kesz")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({
    meta: [
      { title: "Szerződés elkészült | Dr Föld" },
      {
        name: "description",
        content:
          "A végleges Dr Föld földbérleti szerződés PDF letöltése és dokumentumazonosító ellenőrzése.",
      },
    ],
  }),
  component: DonePage,
});

function DonePage() {
  const { doc } = Route.useSearch();
  const dl = useServerFn(getDownloadUrl);
  const [loading, setLoading] = useState(false);

  async function onDownload() {
    setLoading(true);
    try {
      const r = await dl({ data: { document_id: doc } });
      window.open(r.url, "_blank");
    } catch (err) {
      toast.error(contractFlowErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="container mx-auto max-w-3xl px-4 py-14">
        <Card className="overflow-hidden border-df-border bg-df-card shadow-[0_18px_45px_rgba(26,26,26,0.10)]">
          <div className="bg-df-green p-7 text-df-card">
            <CheckCircle2 className="h-14 w-14 text-df-yellow" />
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-df-yellow">
              Dokumentum elkészült
            </p>
            <h1 className="mt-2 font-brand text-4xl font-bold leading-tight md:text-5xl">
              A szerződésed elkészült.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-df-cream">
              A végleges PDF a Műhelyedben is elérhető. Töltsd le, ellenőrizd az adatokat, és őrizd
              meg a dokumentumazonosítót.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-md border border-df-yellow/60 bg-df-yellow/10 p-4 text-sm leading-6 text-df-ink">
              <span className="font-semibold text-df-green">Ravasz ellenőrzési pont:</span> a PDF
              lábrészében szereplő dokumentumazonosítóval később is ellenőrizheted, hogy a Dr Föld
              nyilvántartásában szereplő iratról van szó.
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow
                icon={<FileCheck2 className="h-5 w-5" />}
                title="Dokumentumazonosító"
                text="A PDF lábrészén szerepel, és később a dokumentumellenőrző oldalon visszakereshető."
              />
              <InfoRow
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Ellenőrzés javasolt"
                text="Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés továbbra is javasolt."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={onDownload}
                disabled={loading}
                className="bg-df-green text-white hover:bg-[#173B2A]"
              >
                <Download className="mr-2 h-4 w-4" /> {loading ? "Letöltés..." : "PDF letöltése"}
              </Button>
              <Button asChild size="lg" variant="outline" className="border-df-green text-df-green">
                <Link to="/dokumentum-ellenorzes">Dokumentum ellenőrzése</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-df-green">
                <Link to="/dashboard">Vissza a Műhelybe</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function InfoRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-df-border bg-df-cream/70 p-3">
      <div className="mt-0.5 shrink-0 text-df-green">{icon}</div>
      <div>
        <div className="font-semibold text-df-ink">{title}</div>
        <p className="mt-1 text-sm leading-6 text-df-gray">{text}</p>
      </div>
    </div>
  );
}
