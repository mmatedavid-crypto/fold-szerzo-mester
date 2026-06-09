import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifyDocument } from "@/lib/contracts/verify.functions";
import { company } from "@/lib/company";
import { CheckCircle2, FileCheck2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/dokumentum-ellenorzes")({
  head: () => ({
    meta: [
      { title: "Dokumentum ellenőrzése | Dr Föld" },
      {
        name: "description",
        content: "Ellenőrizd, hogy egy Dr Föld dokumentumazonosító szerepel-e a nyilvántartásban.",
      },
    ],
    links: [{ rel: "canonical", href: `${company.websiteUrl}/dokumentum-ellenorzes` }],
  }),
  component: VerifyPage,
});

type VerifyResult = { ok: boolean; message: string; meta?: Record<string, string> };

function VerifyPage() {
  const verify = useServerFn(verifyDocument);
  const [num, setNum] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await verify({
        data: {
          document_number: num.trim(),
          document_hash: verificationCode.trim() || undefined,
        },
      });
      // meta is Record<string, unknown>; coerce
      const meta = r.meta
        ? Object.fromEntries(Object.entries(r.meta).map(([k, v]) => [k, String(v)]))
        : undefined;
      setResult({ ok: r.ok, message: r.message, meta });
    } catch {
      setResult({
        ok: false,
        message: "Az ellenőrzés most nem sikerült. Kérjük, próbáld újra később.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="container mx-auto max-w-3xl px-4 py-16">
        <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
          Dokumentum azonosítás
        </Badge>
        <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
          Dokumentum ellenőrzése
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-df-gray">
          Add meg a Dr Föld PDF lábrészén szereplő dokumentumazonosítót. Az ellenőrző kód nem
          kötelező, de ha nálad van, pontosabb egyezést ad.
        </p>

        <Card className="mt-6 border-df-border bg-df-card p-6 shadow-sm">
          <div className="mb-5 flex gap-3 rounded-md border border-df-border bg-df-cream/70 p-3 text-sm text-df-gray">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-df-green" />
            <p>
              Az ellenőrzés azt mutatja meg, hogy az azonosító szerepel-e a Dr Föld
              nyilvántartásában. Ez nem ügyvédi hitelesítés, hanem dokumentumazonosítás.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="num">Dokumentumazonosító</Label>
              <Input
                id="num"
                required
                value={num}
                onChange={(e) => setNum(e.target.value)}
                placeholder="pl. FBSZ-2026-AB12CD"
                className="border-df-border bg-white"
              />
            </div>
            <div>
              <Label htmlFor="verification-code">Ellenőrző kód (opcionális)</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="ha szerepel a PDF lábrészén"
                className="border-df-border bg-white"
              />
              <p className="mt-1 text-xs text-df-gray">
                Ez a hosszabb technikai azonosító segít kizárni, hogy a dokumentumot módosították.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-df-green text-white hover:bg-[#173B2A]"
            >
              {loading ? "Ellenőrzés..." : "Dokumentum ellenőrzése"}
            </Button>
          </form>
          {result && (
            <div
              className={`mt-6 rounded-md border p-4 ${
                result.ok ? "border-df-green/40 bg-df-green/10" : "border-df-red/40 bg-df-red/10"
              }`}
            >
              <div className="flex gap-3">
                {result.ok ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-df-green" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-df-red" />
                )}
                <div>
                  <div className={`font-semibold ${result.ok ? "text-df-green" : "text-df-red"}`}>
                    {result.message}
                  </div>
                  <p className="mt-1 text-xs text-df-gray">
                    Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.
                  </p>
                </div>
              </div>
              {result.meta && (
                <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 border-t border-df-border pt-3 text-sm">
                  {Object.entries(result.meta).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-df-gray">{k}</dt>
                      <dd className="break-all font-medium text-df-ink">{v}</dd>
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
