import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMyDocuments, getMyQuota, getDownloadUrl } from "@/lib/contracts/finalize.functions";
import { listDrafts } from "@/lib/contracts/drafts.functions";
import { formatDate } from "@/lib/format";
import { Download, FilePlus2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GdprSection } from "@/components/dashboard/gdpr-section";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Műhely — Földbérleti Szerződés Generátor" }] }),
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
      toast.error(err instanceof Error ? err.message : "Hiba történt");
    }
  }

  async function onSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl">Műhely</h1>
            <p className="text-muted-foreground text-sm mt-1">Szerződéseid, vázlataid és kereted egy helyen.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild><Link to="/szerzodes/uj"><FilePlus2 className="h-4 w-4 mr-1" />Új szerződés</Link></Button>
            <Button variant="ghost" onClick={onSignOut}><LogOut className="h-4 w-4 mr-1" />Kilépés</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <Card className="p-5">
            <div className="text-sm text-muted-foreground">Elérhető egyszeri kreditek</div>
            <div className="text-3xl font-semibold mt-1">{quota.data?.single_credits ?? "—"}</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-muted-foreground">Előfizetési keret</div>
            {quota.data?.subscription ? (
              <>
                <div className="text-3xl font-semibold mt-1">
                  {quota.data.subscription.used} / {quota.data.subscription.total}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Felhasznált szerződések az éves keretből</div>
              </>
            ) : (
              <div className="text-sm mt-2 text-muted-foreground">Nincs aktív előfizetés. <Link to="/arak" className="text-primary underline">Előfizetés</Link></div>
            )}
          </Card>
          <Card className="p-5">
            <div className="text-sm text-muted-foreground">Korábbi vázlatok</div>
            <div className="text-3xl font-semibold mt-1">{drafts.data?.filter((d) => d.status !== "finalized").length ?? "—"}</div>
          </Card>
        </div>

        <h2 className="font-serif text-xl mt-10">Generált dokumentumok</h2>
        <Card className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
              {(docs.data ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">{formatDate(d.finalized_at as string)}</TableCell>
                  <TableCell className="font-mono text-xs">{d.document_number}</TableCell>
                  <TableCell>{d.lessor_name ?? "—"}</TableCell>
                  <TableCell>{d.lessee_name ?? "—"}</TableCell>
                  <TableCell>{d.settlement ?? "—"}</TableCell>
                  <TableCell className="text-xs">{(d.parcel_numbers ?? []).join(", ") || "—"}</TableCell>
                  <TableCell className="text-xs">{d.legal_template_version}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => onDownload(d.id as string)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!docs.data || docs.data.length === 0) && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Még nincs generált dokumentum.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <h2 className="font-serif text-xl mt-10">Vázlatok</h2>
        <Card className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cím</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead>Frissítve</TableHead>
                <TableHead className="text-right">Folytatás</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(drafts.data ?? []).filter((d) => d.status !== "finalized").map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.title ?? "Vázlat"}</TableCell>
                  <TableCell className="text-xs">{d.status}</TableCell>
                  <TableCell className="text-sm">{formatDate(d.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/szerzodes/$id/ellenorzes" params={{ id: d.id }}>Folytatás</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!drafts.data || drafts.data.filter((d) => d.status !== "finalized").length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nincs nyitott vázlat.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <GdprSection />
      </section>
    </PageShell>
  );
}