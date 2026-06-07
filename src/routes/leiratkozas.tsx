import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unsubscribeByToken } from "@/lib/subscriptions/subscribe.functions";

export const Route = createFileRoute("/leiratkozas")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
  head: () => ({ meta: [{ title: "Leiratkozás | Földbérleti értesítő" }] }),
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
        setMessage(res.error ?? "Ismeretlen hiba.");
      }
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Ismeretlen hiba.");
    }
  }

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-12 max-w-xl">
        <h1 className="font-serif text-3xl">Leiratkozás</h1>
        <Card className="p-6 mt-6 space-y-4">
          {state === "idle" && token && (
            <>
              <p>Megerősíted, hogy leiratkozol a heti kifüggesztés értesítőről?</p>
              <Button onClick={confirm}>Igen, leiratkozom</Button>
            </>
          )}
          {state === "loading" && <p>Folyamatban…</p>}
          {state === "done" && (
            <p className="text-sm">
              Sikeresen leiratkoztál.<br />
              {info.email} – {info.settlement}
            </p>
          )}
          {state === "error" && <p className="text-sm text-destructive">{message}</p>}
        </Card>
      </section>
    </PageShell>
  );
}