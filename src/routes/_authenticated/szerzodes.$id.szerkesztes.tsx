import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getDraft } from "@/lib/contracts/drafts.functions";
import type { Draft } from "@/lib/contracts/types";
import { PageShell } from "@/components/layout/page-shell";
import { ContractEditor } from "@/components/wizard/contract-editor";

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
    fetchDraft({ data: { id } }).then(setDraft).catch((e) => setError(e instanceof Error ? e.message : "Hiba"));
  }, [id, fetchDraft]);

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        {error && <div className="text-destructive">{error}</div>}
        {!draft && !error && <div className="text-muted-foreground">Betöltés…</div>}
        {draft && <ContractEditor draft={draft} />}
      </section>
    </PageShell>
  );
}