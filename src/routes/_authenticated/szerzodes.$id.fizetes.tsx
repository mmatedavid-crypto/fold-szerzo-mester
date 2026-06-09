import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listPlans } from "@/lib/plans.functions";
import { getMyQuota, finalizeContract } from "@/lib/contracts/finalize.functions";
import { getCheckoutAvailability, startCheckout } from "@/lib/payments/checkout.functions";
import { formatHuf } from "@/lib/format";
import { toast } from "sonner";
import { paymentErrorMessage } from "@/lib/user-facing-errors";
import { ArrowRight, CheckCircle2, CreditCard, FileCheck2 } from "lucide-react";

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
      <section className="container mx-auto max-w-5xl px-4 py-10">
        <div className="max-w-3xl">
          <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
            Fizetés és véglegesítés
          </Badge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
            Végleges PDF, rendezett fizetéssel.
          </h1>
          <p className="mt-3 text-sm leading-6 text-df-gray md:text-base">
            A végleges PDF csak sikeres fizetés vagy elérhető előfizetési keret felhasználása után
            készül el. A szerződés a megadott felekhez és helyrajzi számokhoz kötött.
          </p>
        </div>

        {hasAny && (
          <Card className="mt-6 border-df-green bg-df-card p-6 shadow-[0_18px_45px_rgba(31,77,55,0.14)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-df-green">
              <FileCheck2 className="h-5 w-5" />
              Elérhető kereted
            </div>
            <ul className="mt-4 space-y-2 text-sm text-df-ink">
              {hasCredit && (
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-df-green" />
                  <span>{quota.data!.single_credits} egyszeri szerződés-kredit elérhető.</span>
                </li>
              )}
              {hasSubQuota && (
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-df-green" />
                  <span>
                    Előfizetési keret: {sub!.used} / {sub!.total} felhasználva.
                  </span>
                </li>
              )}
            </ul>
            <Button
              className="mt-5 bg-df-green text-white hover:bg-[#173B2A]"
              disabled={busy}
              onClick={onFinalizeWithExisting}
            >
              1 szerződés felhasználása és véglegesítés <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-2 text-xs text-df-gray">
              Ez a művelet 1 szerződést használ fel a keretedből, és véglegesíti a dokumentumot.
            </p>
          </Card>
        )}

        <Card className="mt-6 border-df-border bg-df-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-df-green">
            <CreditCard className="h-5 w-5" />
            Új vásárlás
          </div>
          <h2 className="mt-2 font-brand text-2xl font-bold text-df-green">
            Válassz dokumentumkreditet vagy keretet.
          </h2>
          <p className="mt-1 text-sm leading-6 text-df-gray">
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
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(plans.data ?? []).map((p) => (
              <div key={p.id} className="rounded-md border border-df-border bg-df-cream/60 p-4">
                <div className="font-semibold text-df-green">{p.name}</div>
                <div className="mt-1 font-brand text-2xl font-bold text-df-ink">
                  {formatHuf(p.monthly_price_huf)}
                </div>
                <div className="mt-1 text-xs leading-5 text-df-gray">{p.description}</div>
                <Button
                  className="mt-3 w-full bg-df-green text-white hover:bg-[#173B2A]"
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
