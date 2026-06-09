import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { createDraft } from "@/lib/contracts/drafts.functions";
import { PageShell } from "@/components/layout/page-shell";
import { toast } from "sonner";
import { contractFlowErrorMessage } from "@/lib/user-facing-errors";

export const Route = createFileRoute("/_authenticated/szerzodes/uj")({
  head: () => ({ meta: [{ title: "Új szerződés | Dr Föld" }] }),
  component: NewContract,
});

function NewContract() {
  const navigate = useNavigate();
  const create = useServerFn(createDraft);
  useEffect(() => {
    let cancelled = false;
    create()
      .then((d) => {
        if (!cancelled)
          navigate({ to: "/szerzodes/$id/szerkesztes", params: { id: d.id }, replace: true });
      })
      .catch((err) => {
        toast.error(contractFlowErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <PageShell>
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Új szerződésvázlat előkészítése…
      </div>
    </PageShell>
  );
}
