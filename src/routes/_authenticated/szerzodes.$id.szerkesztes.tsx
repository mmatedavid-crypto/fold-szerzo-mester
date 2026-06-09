import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getDraft } from "@/lib/contracts/drafts.functions";
import type { Draft } from "@/lib/contracts/types";
import { PageShell } from "@/components/layout/page-shell";
import { ContractEditor } from "@/components/wizard/contract-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { contractFlowErrorMessage } from "@/lib/user-facing-errors";

export const Route = createFileRoute("/_authenticated/szerzodes/$id/szerkesztes")({
  head: () => ({ meta: [{ title: "Szerződés szerkesztése" }] }),
  component: EditDraft,
});

function EditDraft() {
  const { id } = Route.useParams();
  const fetchDraft = useServerFn(getDraft);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDraft({ data: { id } })
      .then(setDraft)
      .catch((e) => setError(contractFlowErrorMessage(e)));
  }, [id, fetchDraft]);

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        {error && (
          <Card className="p-6">
            <h1 className="font-serif text-2xl text-df-green">Nem tudtuk betölteni a vázlatot.</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/dashboard">Vissza a Műhelybe</Link>
            </Button>
          </Card>
        )}
        {!draft && !error && (
          <div className="rounded-md border border-df-border bg-df-card p-6 text-muted-foreground">
            Szerződésvázlat betöltése…
          </div>
        )}
        {draft && <ContractEditor draft={draft} />}
      </section>
    </PageShell>
  );
}
