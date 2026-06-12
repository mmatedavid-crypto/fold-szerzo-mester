import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Loader2, Search } from "lucide-react";
import { lookupParcel, type ParcelLookupResult } from "@/lib/legal/parcelLookup.functions";

export function ParcelHrszCheck({
  settlement,
  lotNumber,
  onPickSuggestion,
}: {
  settlement?: string;
  lotNumber?: string;
  onPickSuggestion?: (lotNumber: string) => void;
}) {
  const lookup = useServerFn(lookupParcel);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ParcelLookupResult | null>(null);
  const disabled = !settlement?.trim() || !lotNumber?.trim();

  async function run() {
    if (disabled) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await lookup({ data: { settlement: settlement!, lotNumber: lotNumber! } });
      setResult(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="md:col-span-3 rounded-md border border-df-border/60 bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={disabled || busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1" />}
          HRSZ ellenőrzés (oeny.hu)
        </Button>
        {result?.status === "found" && (
          <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />Hivatalos találat
          </Badge>
        )}
        {result && result.status !== "found" && (
          <Badge variant="outline" className="border-amber-400 text-amber-900 bg-amber-50">
            <AlertTriangle className="h-3 w-3 mr-1" />Ellenőrzés kell
          </Badge>
        )}
      </div>
      {result && (
        <div className="mt-2 space-y-1">
          <div>{result.message}</div>
          {!!result.suggestions?.length && result.status === "lot_not_found" && (
            <div className="flex flex-wrap gap-1">
              {result.suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onPickSuggestion?.(s.lotNumber)}
                  className="rounded border border-df-border px-2 py-0.5 text-xs hover:bg-white"
                >
                  {s.lotNumber}
                </button>
              ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Forrás: Lechner Tudásközpont – Helyrajziszám-kereső · {new Date(result.checkedAt).toLocaleString("hu-HU")}
          </div>
        </div>
      )}
    </div>
  );
}