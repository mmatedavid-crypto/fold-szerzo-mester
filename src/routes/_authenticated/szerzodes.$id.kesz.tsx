import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/lib/contracts/finalize.functions";
import { CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

const Search = z.object({ doc: z.string().uuid() });

export const Route = createFileRoute("/_authenticated/szerzodes/$id/kesz")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({ meta: [{ title: "Szerződés kész — letöltés" }] }),
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
      toast.error(err instanceof Error ? err.message : "Hiba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
        <h1 className="font-serif text-3xl mt-3">A szerződésed elkészült</h1>
        <p className="text-muted-foreground mt-2">
          A végleges PDF a műhelyedben is bármikor elérhető. A dokumentumazonosító megjelenik a PDF lábrészén,
          és bármikor ellenőrizhető a /dokumentum-ellenorzes oldalon.
        </p>
        <Card className="p-6 mt-6">
          <Button size="lg" onClick={onDownload} disabled={loading}>
            <Download className="h-4 w-4 mr-2" /> {loading ? "Letöltés…" : "PDF letöltése"}
          </Button>
          <div className="mt-4">
            <Button asChild variant="ghost"><Link to="/dashboard">Vissza a műhelybe</Link></Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}