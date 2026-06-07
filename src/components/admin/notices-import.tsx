import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { parseNoticesXlsx } from "@/lib/notices/parse";
import { importNotices } from "@/lib/notices/import.functions";
import { Upload } from "lucide-react";

export function NoticesImport() {
  const importFn = useServerFn(importNotices);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const rows = parseNoticesXlsx(buf);
      if (rows.length === 0) {
        toast.error("Nem találtam hirdetményt a fájlban.");
        return;
      }
      const r = await importFn({ data: { rows } });
      toast.success(`${r.imported} hirdetmény importálva / frissítve.`);
      setPreview({
        count: rows.length,
        sample: rows.slice(0, 5).map((x) => `${x.source_notice_id} — ${x.settlement ?? "?"} (${x.area_ha ?? "?"} ha)`),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba történt");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <Card className="p-5 mt-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <Input type="file" accept=".xlsx" onChange={onFile} disabled={busy} className="max-w-sm" />
          <Button variant="outline" disabled={busy} type="button" asChild>
            <span><Upload className="h-4 w-4 mr-1" />{busy ? "Feldolgozás…" : "Excel feltöltése"}</span>
          </Button>
        </label>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        A hirdetmenyek.gov.hu heti Excel kivonatát tudod feltölteni. A rendszer azonosító alapján frissít, így ugyanazt a fájlt többször is feltöltheted.
      </p>
      {preview && (
        <div className="mt-3 text-sm">
          <div className="text-muted-foreground">{preview.count} sor feldolgozva. Példa:</div>
          <ul className="list-disc pl-5 mt-1 text-xs">
            {preview.sample.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}