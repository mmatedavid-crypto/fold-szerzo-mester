import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { createDraft } from "@/lib/contracts/drafts.functions";
import { PageShell } from "@/components/layout/page-shell";
import { toast } from "sonner";
import { contractFlowErrorMessage } from "@/lib/user-facing-errors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus2, Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/szerzodes/uj")({
  head: () => ({ meta: [{ title: "Új szerződés | Dr Föld" }] }),
  component: NewContract,
});

function NewContract() {
  const navigate = useNavigate();
  const create = useServerFn(createDraft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    create()
      .then((d) => {
        if (!cancelled)
          navigate({ to: "/szerzodes/$id/szerkesztes", params: { id: d.id }, replace: true });
      })
      .catch((err) => {
        const message = contractFlowErrorMessage(err);
        if (!cancelled) setError(message);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <PageShell>
      <section className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="border-df-border bg-df-card p-6 text-center shadow-sm">
          {error ? (
            <>
              <ShieldAlert className="mx-auto h-12 w-12 text-df-red" />
              <h1 className="mt-4 font-brand text-3xl font-bold text-df-green">
                Nem indult el a szerződésvázlat.
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-df-gray">{error}</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  type="button"
                  className="bg-df-green text-white hover:bg-[#173B2A]"
                  onClick={() => window.location.reload()}
                >
                  Újrapróbálom
                </Button>
                <Button asChild variant="outline" className="border-df-green text-df-green">
                  <Link to="/dashboard">Vissza a Műhelybe</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-df-border bg-df-cream text-df-green">
                <FilePlus2 className="h-7 w-7" />
              </div>
              <h1 className="mt-4 font-brand text-3xl font-bold text-df-green">
                Új szerződésvázlat előkészítése
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-df-gray">
                Létrehozzuk a Műhelyben a vázlatot, hogy rendezett adatokkal indulhasson a
                földbérleti szerződés.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-df-border bg-df-cream px-3 py-2 text-sm font-semibold text-df-green">
                <Loader2 className="h-4 w-4 animate-spin" />
                Előkészítés folyamatban
              </div>
            </>
          )}
        </Card>
      </section>
    </PageShell>
  );
}
