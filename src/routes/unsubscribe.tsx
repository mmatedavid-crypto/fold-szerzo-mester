import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
  head: () => ({
    meta: [
      { title: "Leiratkozás – Dr Föld" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "done" }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const [state, setState] = React.useState<State>({ kind: "loading" });
  const [busy, setBusy] = React.useState(false);
  const token = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  React.useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) setState({ kind: "invalid" });
        else if (data.valid === false && data.reason === "already_unsubscribed")
          setState({ kind: "already" });
        else if (data.valid) setState({ kind: "valid" });
        else setState({ kind: "invalid" });
      })
      .catch((e) => setState({ kind: "error", message: String(e) }));
  }, [token]);

  async function confirm() {
    setBusy(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.success) setState({ kind: "done" });
      else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "error", message: data.error ?? "Ismeretlen hiba" });
    } catch (e) {
      setState({ kind: "error", message: String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Leiratkozás</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.kind === "loading" && <p>Token ellenőrzése…</p>}
          {state.kind === "valid" && (
            <>
              <p>
                Biztosan le szeretnél iratkozni a Dr Föld levelekről? A megerősítés után
                nem küldünk több értesítőt erre az email címre.
              </p>
              <Button onClick={confirm} disabled={busy}>
                {busy ? "Folyamatban…" : "Leiratkozás megerősítése"}
              </Button>
            </>
          )}
          {state.kind === "already" && (
            <p>Ez az email cím már le van iratkozva. További teendő nincs.</p>
          )}
          {state.kind === "done" && (
            <p>Sikeres leiratkozás. Több levelet nem fogsz tőlünk kapni.</p>
          )}
          {state.kind === "invalid" && (
            <p>A leiratkozó link érvénytelen vagy lejárt.</p>
          )}
          {state.kind === "error" && (
            <p className="text-destructive">Hiba történt: {state.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            <Link to="/">Vissza a főoldalra</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}