import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { verifyDocument } from "@/lib/contracts/verify.functions";

export const Route = createFileRoute("/dokumentum-ellenorzes")({
  head: () => ({
    meta: [
      { title: "Dokumentum ellenőrzése — Földbérleti Szerződés Generátor" },
      { name: "description", content: "Ellenőrizd egy generált szerződés dokumentumazonosítóját és hash-ét." },
    ],
  }),
  component: VerifyPage,
});

type VerifyResult = { ok: boolean; message: string; meta?: Record<string, string> };

function VerifyPage() {
  const verify = useServerFn(verifyDocument);
  const [num, setNum] = useState("");
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await verify({ data: { document_number: num.trim(), document_hash: hash.trim() || undefined } });
      // meta is Record<string, unknown>; coerce
      const meta = r.meta ? Object.fromEntries(Object.entries(r.meta).map(([k, v]) => [k, String(v)])) : undefined;
      setResult({ ok: r.ok, message: r.message, meta });
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Ismeretlen hiba" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="font-serif text-3xl">Dokumentum ellenőrzése</h1>
        <p className="mt-3 text-muted-foreground">
          Add meg a dokumentumazonosítót (és opcionálisan az ellenőrző hash-t) a szerződés lábléce alapján.
        </p>
        <Card className="p-6 mt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="num">Dokumentumazonosító</Label>
              <Input id="num" required value={num} onChange={(e) => setNum(e.target.value)} placeholder="pl. FBSZ-2026-AB12CD" />
            </div>
            <div>
              <Label htmlFor="hash">Ellenőrző hash (opcionális)</Label>
              <Input id="hash" value={hash} onChange={(e) => setHash(e.target.value)} placeholder="SHA-256 hex" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Ellenőrzés..." : "Ellenőrzés"}</Button>
          </form>
          {result && (
            <div className={`mt-6 p-4 rounded-md border ${result.ok ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"}`}>
              <div className={`font-medium ${result.ok ? "text-primary" : "text-destructive"}`}>{result.message}</div>
              {result.meta && (
                <dl className="mt-3 text-sm grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
                  {Object.entries(result.meta).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono break-all">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
        </Card>
      </section>
    </PageShell>
  );
}