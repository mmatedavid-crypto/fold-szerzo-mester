import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPlans } from "@/lib/plans.functions";
import { getMyQuota, finalizeContract } from "@/lib/contracts/finalize.functions";
import { getCheckoutAvailability, startCheckout } from "@/lib/payments/checkout.functions";
import { formatHuf } from "@/lib/format";
import { toast } from "sonner";
import { paymentErrorMessage } from "@/lib/user-facing-errors";

export const Route = createFileRoute("/_authenticated/szerzodes/$id/fizetes")({
  head: () => ({ meta: [{ title: "Fizetés és véglegesítés | Dr Föld" }] }),
  component: PayPage,
});

function PayPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });
  const quota = useQuery({ queryKey: ["my-quota"], queryFn: () => getMyQuota() });
  const checkoutAvailability = useQuery({
    queryKey: ["checkout-availability"],
    queryFn: () => getCheckoutAvailability(),
  });
  const checkout = useServerFn(startCheckout);
  const finalize = useServerFn(finalizeContract);
  const [busy, setBusy] = useState(false);

  const hasCredit = (quota.data?.single_credits ?? 0) > 0;
  const sub = quota.data?.subscription;
  const hasSubQuota = sub && sub.used < sub.total;

  async function onFinalizeWithExisting() {
    setBusy(true);
    try {
      const r = await finalize({ data: { draft_id: id } });
      navigate({ to: "/szerzodes/$id/kesz", params: { id }, search: { doc: r.document_id } });
    } catch (err) {
      toast.error(paymentErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onBuy(slug: "single" | "gazda" | "pro") {
    setBusy(true);
    try {
      const returnUrl = `${window.location.origin}/szerzodes/${id}/fizetes?paid=1`;
      const r = await checkout({ data: { plan_slug: slug, draft_id: id, return_url: returnUrl } });
      window.location.href = r.redirect_url;
    } catch (err) {
      toast.error(paymentErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const hasAny = hasCredit || hasSubQuota;
  const checkoutEnabled = checkoutAvailability.data?.enabled ?? false;
  const mockCheckoutActive = checkoutAvailability.data?.provider === "mock";

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-serif text-3xl">Fizetés és véglegesítés</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          A végleges PDF csak a sikeres fizetés vagy az elérhető előfizetési keret felhasználása
          után készül el. A szerződés a megadott felekhez és helyrajzi számokhoz kötött.
        </p>

        {hasAny && (
          <Card className="p-6 mt-6 border-primary border-2">
            <h2 className="font-serif text-xl">Elérhető kereted</h2>
            <ul className="text-sm mt-3 space-y-1">
              {hasCredit && (
                <li>• {quota.data!.single_credits} egyszeri szerződés-kredit elérhető.</li>
              )}
              {hasSubQuota && (
                <li>
                  • Előfizetési keret: {sub!.used} / {sub!.total} felhasználva.
                </li>
              )}
            </ul>
            <Button className="mt-4" disabled={busy} onClick={onFinalizeWithExisting}>
              1 szerződés felhasználása és véglegesítés
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Ez a művelet 1 szerződést használ fel a keretedből, és véglegesíti a dokumentumot.
            </p>
          </Card>
        )}

        <Card className="p-6 mt-6">
          <h2 className="font-serif text-xl">Új vásárlás</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Válassz egyszeri dokumentumkreditet vagy előfizetési csomagot. A vásárlás után a
            szerződés-előkészítő dokumentum véglegesíthető.
          </p>
          {!checkoutEnabled && (
            <div className="mt-4 rounded-md border border-df-yellow bg-df-yellow/10 p-3 text-sm text-df-ink">
              Az online fizetés még nincs megnyitva ezen a környezeten. Ha már van elérhető kredited
              vagy előfizetési kereted, fent tudod véglegesíteni a dokumentumot.
            </div>
          )}
          {mockCheckoutActive && (
            <div className="mt-4 rounded-md border border-df-red bg-df-red/10 p-3 text-sm text-df-ink">
              Teszt fizetés aktív ezen a környezeten. Éles használat előtt kapcsold ki a mock
              fizetést, vagy állíts be valódi fizetési szolgáltatót.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3 mt-4">
            {(plans.data ?? []).map((p) => (
              <div key={p.id} className="border border-border rounded-md p-4">
                <div className="font-medium">{p.name}</div>
                <div className="text-2xl font-semibold mt-1">{formatHuf(p.monthly_price_huf)}</div>
                <div className="text-xs text-muted-foreground">{p.description}</div>
                <Button
                  className="mt-3 w-full"
                  disabled={busy || !checkoutEnabled}
                  onClick={() => onBuy(p.slug as "single" | "gazda" | "pro")}
                >
                  {p.slug === "single" ? "Megveszem" : "Előfizetek"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
