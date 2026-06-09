import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getDraft } from "@/lib/contracts/drafts.functions";
import type { Draft } from "@/lib/contracts/types";
import { PageShell } from "@/components/layout/page-shell";
import { ContractEditor } from "@/components/wizard/contract-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { contractFlowErrorMessage } from "@/lib/user-facing-errors";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/szerzodes/$id/szerkesztes")({
  head: () => ({
    meta: [
      { title: "Földbérleti szerződés szerkesztése | Dr Föld" },
      {
        name: "description",
        content:
          "Földbérleti szerződésvázlat szerkesztése: felek, földterület, díj, időtartam és klauzulák rendezése.",
      },
    ],
  }),
  component: EditDraft,
});

function EditDraft() {
  const { id } = Route.useParams();
  const fetchDraft = useServerFn(getDraft);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetchDraft({ data: { id } })
      .then(setDraft)
      .catch((e) => setError(contractFlowErrorMessage(e)));
  }, [id, fetchDraft]);

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        {error && (
          <Card className="border-df-border bg-df-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <ShieldAlert className="h-10 w-10 shrink-0 text-df-red" />
              <div>
                <h1 className="font-brand text-3xl font-bold text-df-green">
                  Nem tudtuk betölteni a vázlatot.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-df-gray">{error}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
              </div>
            </div>
          </Card>
        )}
        {!draft && !error && (
          <Card className="border-df-border bg-df-card p-6 shadow-sm">
            <div className="flex items-center gap-3 text-df-green">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <div className="font-brand text-xl font-bold">Szerződésvázlat betöltése</div>
                <p className="mt-1 text-sm text-df-gray">
                  Előkészítjük a Műhelyben mentett adatokat.
                </p>
              </div>
            </div>
          </Card>
        )}
        {draft && <ContractEditor draft={draft} />}
      </section>
    </PageShell>
  );
}
