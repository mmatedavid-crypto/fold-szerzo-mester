import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unsubscribeByToken } from "@/lib/subscriptions/subscribe.functions";
import { subscriptionErrorMessage } from "@/lib/user-facing-errors";
import { CheckCircle2, MailX } from "lucide-react";

export const Route = createFileRoute("/leiratkozas")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  head: () => ({ meta: [{ title: "Leiratkozás | Dr Föld" }] }),
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
      <section className="container mx-auto px-4 py-12 max-w-xl">
        <h1 className="font-serif text-3xl">Leiratkozás</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A Dr Föld kifüggesztés-értesítőjét itt tudod leállítani.
        </p>
        <Card className="p-6 mt-6 space-y-4">
          {state === "idle" && token && (
            <>
              <MailX className="h-10 w-10 text-df-red" />
              <div>
                <h2 className="font-serif text-xl text-df-green">Leállítod a heti értesítőt?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ha megerősíted, erre a feliratkozásra nem küldünk több heti kifüggesztés
                  összefoglalót.
                </p>
              </div>
              <Button onClick={confirm}>Igen, leiratkozom</Button>
            </>
          )}
          {state === "loading" && (
            <p className="text-sm text-muted-foreground">Leiratkozás rögzítése…</p>
          )}
          {state === "done" && (
            <div className="text-sm">
              <CheckCircle2 className="mb-3 h-10 w-10 text-df-green" />
              <h2 className="font-serif text-xl text-df-green">Sikeresen leiratkoztál.</h2>
              <p className="mt-2 text-muted-foreground">
                Erre az értesítőre nem küldünk több heti összefoglalót.
              </p>
              {(info.email || info.settlement) && (
                <p className="mt-3 rounded-md border border-df-border bg-df-card p-3 text-xs text-muted-foreground">
                  {info.email ?? "—"} · {info.settlement ?? "—"}
                </p>
              )}
            </div>
          )}
          {state === "error" && (
            <div>
              <h2 className="font-serif text-xl text-df-green">Nem sikerült a leiratkozás.</h2>
              <p className="mt-2 text-sm text-destructive">{message}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Ha továbbra is gond van, írj a hello@drfold.hu címre.
              </p>
            </div>
          )}
        </Card>
      </section>
    </PageShell>
  );
}
