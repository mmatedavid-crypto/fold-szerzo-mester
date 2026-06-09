import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listMyDocuments, getMyQuota, getDownloadUrl } from "@/lib/contracts/finalize.functions";
import { listDrafts } from "@/lib/contracts/drafts.functions";
import { formatDate } from "@/lib/format";
import {
  AlertTriangle,
  Archive,
  Download,
  FileCheck2,
  FilePlus2,
  Gauge,
  Loader2,
  LogOut,
  Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GdprSection } from "@/components/dashboard/gdpr-section";
import { contractFlowErrorMessage } from "@/lib/user-facing-errors";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Műhely | Dr Föld" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const docs = useQuery({ queryKey: ["my-documents"], queryFn: () => listMyDocuments() });
  const quota = useQuery({ queryKey: ["my-quota"], queryFn: () => getMyQuota() });
  const drafts = useQuery({ queryKey: ["my-drafts"], queryFn: () => listDrafts() });
  const dl = useServerFn(getDownloadUrl);

  async function onDownload(id: string) {
    try {
      const r = await dl({ data: { document_id: id } });
      window.open(r.url, "_blank");
    } catch (err) {
      toast.error(contractFlowErrorMessage(err));
    }
  }

  async function onSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <PageShell>
      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
              Dr Föld Műhely
            </Badge>
            <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
              A földügyek munkapadja.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-df-gray md:text-base">
              Szerződéseid, vázlataid, dokumentumaid és kereted egy helyen. Ha előrébb állsz, ne
              maradj hátul.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-df-green text-white hover:bg-[#173B2A]">
              <Link to="/szerzodes/uj">
                <FilePlus2 className="mr-1 h-4 w-4" />
                Új szerződés
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-df-border text-df-green"
              onClick={onSignOut}
            >
              <LogOut className="mr-1 h-4 w-4" />
              Kilépés
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={<FileCheck2 className="h-5 w-5" />}
            label="Elérhető egyszeri kreditek"
            value={quota.isLoading ? "…" : (quota.data?.single_credits ?? "—")}
            helper="Fizetett, még felhasználható dokumentumcsomag"
            loading={quota.isLoading}
            error={quota.isError}
          />
          <Card className="border-df-border bg-df-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-df-green">
              <Gauge className="h-5 w-5" />
              Előfizetési keret
            </div>
            {quota.isLoading ? (
              <MetricLoading text="Keret ellenőrzése…" />
            ) : quota.isError ? (
              <MetricError text="Most nem látjuk biztosan a keretedet." />
            ) : quota.data?.subscription ? (
              <>
                <div className="mt-2 font-brand text-3xl font-bold text-df-ink">
                  {quota.data.subscription.used} / {quota.data.subscription.total}
                </div>
                <div className="mt-1 text-xs text-df-gray">
                  Felhasznált szerződések az éves keretből
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-df-gray">
                Nincs aktív előfizetés.{" "}
                <Link to="/arak" className="font-semibold text-df-green underline">
                  Előfizetés
                </Link>
              </div>
            )}
          </Card>
          <MetricCard
            icon={<Archive className="h-5 w-5" />}
            label="Nyitott vázlatok"
            value={
              drafts.isLoading
                ? "…"
                : (drafts.data?.filter((d) => d.status !== "finalized").length ?? "—")
            }
            helper="Megkezdett szerződés-előkészítések"
            loading={drafts.isLoading}
            error={drafts.isError}
          />
        </div>

        <h2 className="mt-10 font-brand text-2xl font-bold text-df-green">Generált dokumentumok</h2>
        <Card className="mt-3 overflow-x-auto border-df-border bg-df-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-df-cream/60">
                <TableHead>Dátum</TableHead>
                <TableHead>Dok. ID</TableHead>
                <TableHead>Haszonbérbeadó</TableHead>
                <TableHead>Haszonbérlő</TableHead>
                <TableHead>Település</TableHead>
                <TableHead>Hrsz</TableHead>
                <TableHead>Sablon</TableHead>
                <TableHead className="text-right">Letöltés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-df-gray">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-df-green" />
                    Dokumentumok betöltése…
                  </TableCell>
                </TableRow>
              )}
              {docs.isError && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-df-red">
                    Most nem tudtuk betölteni a generált dokumentumokat.
                  </TableCell>
                </TableRow>
              )}
              {(docs.data ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">{formatDate(d.finalized_at as string)}</TableCell>
                  <TableCell className="font-mono text-xs">{d.document_number}</TableCell>
                  <TableCell>{d.lessor_name ?? "—"}</TableCell>
                  <TableCell>{d.lessee_name ?? "—"}</TableCell>
                  <TableCell>{d.settlement ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {(d.parcel_numbers ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-xs">{d.legal_template_version}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => onDownload(d.id as string)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!docs.isLoading && !docs.isError && (!docs.data || docs.data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-df-gray">
                    <div className="mx-auto max-w-md">
                      <div className="font-semibold text-df-ink">
                        Még nincs generált dokumentum.
                      </div>
                      <p className="mt-1 text-sm">
                        Ha elkészül az első végleges PDF, itt tudod újra letölteni és ellenőrizni.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <h2 className="mt-10 font-brand text-2xl font-bold text-df-green">Vázlatok</h2>
        <Card className="mt-3 overflow-x-auto border-df-border bg-df-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-df-cream/60">
                <TableHead>Cím</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead>Frissítve</TableHead>
                <TableHead className="text-right">Folytatás</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-df-gray">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-df-green" />
                    Vázlatok betöltése…
                  </TableCell>
                </TableRow>
              )}
              {drafts.isError && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-df-red">
                    Most nem tudtuk betölteni a vázlatokat.
                  </TableCell>
                </TableRow>
              )}
              {(drafts.data ?? [])
                .filter((d) => d.status !== "finalized")
                .map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.title ?? "Vázlat"}</TableCell>
                    <TableCell className="text-xs">{d.status}</TableCell>
                    <TableCell className="text-sm">{formatDate(d.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          size="sm"
                          className="bg-df-green text-white hover:bg-[#173B2A]"
                        >
                          <Link to="/szerzodes/$id/szerkesztes" params={{ id: d.id }}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Szerkesztés
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-df-green text-df-green"
                        >
                          <Link to="/szerzodes/$id/ellenorzes" params={{ id: d.id }}>
                            Ellenőrzés
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {!drafts.isLoading &&
                !drafts.isError &&
                (!drafts.data ||
                  drafts.data.filter((d) => d.status !== "finalized").length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-df-gray">
                      <div className="mx-auto max-w-md">
                        <div className="font-semibold text-df-ink">Nincs nyitott vázlat.</div>
                        <p className="mt-1 text-sm">
                          Indíts egy földbérleti szerződést, és a Műhely automatikusan menti a
                          vázlatot.
                        </p>
                        <Button
                          asChild
                          className="mt-4 bg-df-green text-white hover:bg-[#173B2A]"
                          size="sm"
                        >
                          <Link to="/szerzodes/uj">
                            <FilePlus2 className="mr-1 h-4 w-4" />
                            Új szerződés indítása
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </Card>

        <GdprSection />
      </section>
    </PageShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  loading,
  error,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  helper: string;
  loading?: boolean;
  error?: boolean;
}) {
  return (
    <Card className="border-df-border bg-df-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-df-green">
        {icon}
        {label}
      </div>
      {loading ? (
        <MetricLoading text="Adat betöltése…" />
      ) : error ? (
        <MetricError text="Most nem elérhető." />
      ) : (
        <>
          <div className="mt-2 font-brand text-3xl font-bold text-df-ink">{value}</div>
          <div className="mt-1 text-xs text-df-gray">{helper}</div>
        </>
      )}
    </Card>
  );
}

function MetricLoading({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-df-gray">
      <Loader2 className="h-4 w-4 animate-spin text-df-green" />
      {text}
    </div>
  );
}

function MetricError({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-df-red">
      <AlertTriangle className="h-4 w-4" />
      {text}
    </div>
  );
}
