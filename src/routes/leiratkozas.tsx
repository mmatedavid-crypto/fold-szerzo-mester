import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandBadge } from "@/components/brand/brand-elements";
import { unsubscribeByToken } from "@/lib/subscriptions/subscribe.functions";
import { subscriptionErrorMessage } from "@/lib/user-facing-errors";
import { company } from "@/lib/company";
import { CheckCircle2, Loader2, MailX, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/leiratkozas")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Leiratkozás | Dr Föld" },
      {
        name: "description",
        content: "Leiratkozás a Dr Föld heti kifüggesztés értesítőjéről.",
      },
      { property: "og:title", content: "Leiratkozás | Dr Föld" },
      {
        property: "og:description",
        content: "Leiratkozás a Dr Föld heti kifüggesztés értesítőjéről.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/leiratkozas` }],
  }),
  component: UnsubPage,
});

function UnsubPage() {
  const { token } = Route.useSearch();
  const unsub = useServerFn(unsubscribeByToken);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [info, setInfo] = useState<{ email?: string; settlement?: string }>({});

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Hiányzó vagy érvénytelen leiratkozási link.");
    }
  }, [token]);

  async function confirm() {
    setState("loading");
    try {
      const res = await unsub({ data: { token } });
      if (res.ok) {
        setState("done");
        setInfo({ email: res.email, settlement: res.settlement });
      } else {
        setState("error");
        setMessage(subscriptionErrorMessage(res.error));
      }
    } catch (e) {
      setState("error");
      setMessage(subscriptionErrorMessage(e));
    }
  }

  return (
    <PageShell>
      <section className="container mx-auto max-w-xl px-4 py-12">
        <div className="rounded-lg border border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          <BrandBadge>Heti kifüggesztés értesítő</BrandBadge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green">
            Leiratkozás
          </h1>
          <p className="mt-3 text-sm leading-6 text-df-gray">
            A Dr Föld kifüggesztés-értesítőjét itt tudod leállítani. Ha később újra szükséged lesz
            rá, bármikor feliratkozhatsz egy településre.
          </p>
        </div>
        <Card className="mt-6 space-y-4 border-df-border bg-df-card p-6 shadow-sm">
          {state === "idle" && token && (
            <>
              <div className="flex gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-df-red/40 bg-df-red/10 text-df-red">
                  <MailX className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-brand text-2xl font-bold text-df-green">
                    Leállítod a heti értesítőt?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-df-gray">
                    Ha megerősíted, erre a feliratkozásra nem küldünk több heti kifüggesztés
                    összefoglalót.
                  </p>
                </div>
              </div>
              <Button className="bg-df-red text-white hover:bg-[#8F2F26]" onClick={confirm}>
                Igen, leiratkozom
              </Button>
            </>
          )}
          {state === "loading" && (
            <div className="flex items-center gap-2 text-sm text-df-gray">
              <Loader2 className="h-4 w-4 animate-spin text-df-green" />
              Leiratkozás rögzítése…
            </div>
          )}
          {state === "done" && (
            <div className="text-sm">
              <CheckCircle2 className="mb-3 h-10 w-10 text-df-green" />
              <h2 className="font-brand text-2xl font-bold text-df-green">
                Sikeresen leiratkoztál.
              </h2>
              <p className="mt-2 leading-6 text-df-gray">
                Erre az értesítőre nem küldünk több heti összefoglalót.
              </p>
              {(info.email || info.settlement) && (
                <p className="mt-3 rounded-md border border-df-border bg-df-cream/60 p-3 text-xs text-df-gray">
                  {info.email ?? "—"} · {info.settlement ?? "—"}
                </p>
              )}
            </div>
          )}
          {state === "error" && (
            <div>
              <ShieldCheck className="mb-3 h-10 w-10 text-df-red" />
              <h2 className="font-brand text-2xl font-bold text-df-green">
                Nem sikerült a leiratkozás.
              </h2>
              <p className="mt-2 text-sm leading-6 text-df-red">{message}</p>
              <p className="mt-3 rounded-md border border-df-border bg-df-cream/60 p-3 text-xs leading-5 text-df-gray">
                Ha továbbra is gond van, írj a{" "}
                <a
                  className="font-semibold text-df-green underline"
                  href={`mailto:${company.contactEmail}`}
                >
                  {company.contactEmail}
                </a>{" "}
                címre.
              </p>
            </div>
          )}
        </Card>
      </section>
    </PageShell>
  );
}
