import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  listClauseEditorEntries,
  resetClauseOverride,
  upsertClauseOverride,
  type ClauseEditorEntry,
  type LegalSourceOption,
} from "@/lib/legal/clauseOverrides.functions";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RotateCcw, ScrollText, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/klauzula-szerkesztes")({
  head: () => ({
    meta: [
      { title: "Klauzula szerkesztő | Dr Föld" },
      {
        name: "description",
        content:
          "Ügyvédi klauzula-szerkesztő: a Klauzula Társ szövegei és jogforrás-hivatkozásai itt javíthatók.",
      },
    ],
  }),
  component: ClauseEditorPage,
});

type DraftRef = {
  sourceId: string;
  section?: string;
  quotedText?: string;
  effectiveDate?: string;
};

function EditDialog({
  entry,
  sources,
  open,
  onOpenChange,
  onSaved,
}: {
  entry: ClauseEditorEntry;
  sources: LegalSourceOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const upsertFn = useServerFn(upsertClauseOverride);
  const [title, setTitle] = useState(entry.effective.title);
  const [body, setBody] = useState(entry.effective.bodyTemplate);
  const [refs, setRefs] = useState<DraftRef[]>(
    entry.effective.sourceRefs.length > 0
      ? entry.effective.sourceRefs.map((r) => ({
          sourceId: r.sourceId,
          section: r.section ?? "",
          quotedText: r.quotedText ?? "",
          effectiveDate: r.effectiveDate ?? "",
        }))
      : [{ sourceId: sources[0]?.id ?? "", section: "", quotedText: "", effectiveDate: "" }],
  );

  useEffect(() => {
    if (open) {
      setTitle(entry.effective.title);
      setBody(entry.effective.bodyTemplate);
      setRefs(
        entry.effective.sourceRefs.length > 0
          ? entry.effective.sourceRefs.map((r) => ({
              sourceId: r.sourceId,
              section: r.section ?? "",
              quotedText: r.quotedText ?? "",
              effectiveDate: r.effectiveDate ?? "",
            }))
          : [{ sourceId: sources[0]?.id ?? "", section: "", quotedText: "", effectiveDate: "" }],
      );
    }
  }, [open, entry, sources]);

  const mutation = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          clauseId: entry.clauseId,
          title: title.trim(),
          bodyTemplate: body.trim(),
          sourceRefs: refs
            .map((r) => ({
              sourceId: r.sourceId,
              section: r.section?.trim() || undefined,
              quotedText: r.quotedText?.trim() || undefined,
              effectiveDate: r.effectiveDate?.trim() || undefined,
            }))
            .filter((r) => r.sourceId),
        },
      }),
    onSuccess: () => {
      toast.success("Klauzula mentve. A jóváhagyás újra szükséges.");
      onSaved();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">Klauzula szerkesztése</DialogTitle>
          <DialogDescription className="text-left">
            Azonosító: <code>{entry.clauseId}</code> · Mentés után az ügyvédi jóváhagyás újra szükséges lesz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="clause-title" className="text-sm font-medium text-df-ink">
              Cím
            </Label>
            <Input
              id="clause-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clause-body" className="text-sm font-medium text-df-ink">
              Szöveg (a szerződésbe ez kerül, {`{{változó}}`} placeholderekkel)
            </Label>
            <Textarea
              id="clause-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-df-ink">Jogforrás-hivatkozások</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setRefs((r) => [
                    ...r,
                    { sourceId: sources[0]?.id ?? "", section: "", quotedText: "", effectiveDate: "" },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Hozzáadás
              </Button>
            </div>
            <div className="space-y-4">
              {refs.map((ref, i) => (
                <div key={i} className="space-y-2 rounded-md border border-df-border bg-df-cream/30 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-[200px] flex-1">
                      <Select
                        value={ref.sourceId}
                        onValueChange={(v) =>
                          setRefs((arr) => arr.map((r, idx) => (idx === i ? { ...r, sourceId: v } : r)))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Jogszabály" />
                        </SelectTrigger>
                        <SelectContent>
                          {sources.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.shortName} ({s.actNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      className="min-w-[140px] flex-1"
                      placeholder="§ pl. 44. § (2) b)"
                      value={ref.section ?? ""}
                      onChange={(e) =>
                        setRefs((arr) => arr.map((r, idx) => (idx === i ? { ...r, section: e.target.value } : r)))
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setRefs((arr) => arr.filter((_, idx) => idx !== i))}
                      disabled={refs.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-df-gray">
                      Hatályos törvényszöveg (szó szerinti másolat, nincs karakterkorlát)
                    </Label>
                    <Textarea
                      placeholder="Pl. „A haszonbérleti szerződés időtartama legalább egy év..."
                      value={ref.quotedText ?? ""}
                      onChange={(e) =>
                        setRefs((arr) =>
                          arr.map((r, idx) => (idx === i ? { ...r, quotedText: e.target.value } : r)),
                        )
                      }
                      rows={4}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-df-gray">
                      Hatályos állapot dátuma (opcionális)
                    </Label>
                    <Input
                      type="date"
                      className="max-w-[200px]"
                      value={ref.effectiveDate ?? ""}
                      onChange={(e) =>
                        setRefs((arr) =>
                          arr.map((r, idx) => (idx === i ? { ...r, effectiveDate: e.target.value } : r)),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-df-border bg-df-cream/40 p-3 text-xs text-df-gray">
            <div className="mb-1 font-semibold">Eredeti szöveg (kódbeli)</div>
            <p className="whitespace-pre-wrap">{entry.defaults.bodyTemplate}</p>
            <div className="mt-2">
              Eredeti hivatkozások:{" "}
              {entry.defaults.sourceRefs
                .map((r) => (r.section ? `${r.sourceId} ${r.section}` : r.sourceId))
                .join(", ")}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Mégse
          </Button>
          <Button
            className="bg-df-green text-df-card hover:bg-primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim() || !body.trim() || refs.length === 0}
          >
            {mutation.isPending ? "Mentés…" : "Mentés"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClauseEditorPage() {
  const listFn = useServerFn(listClauseEditorEntries);
  const resetFn = useServerFn(resetClauseOverride);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["clause-editor"],
    queryFn: () => listFn(),
  });
  const [active, setActive] = useState<ClauseEditorEntry | null>(null);

  const resetMutation = useMutation({
    mutationFn: (clauseId: string) => resetFn({ data: { clauseId } }),
    onSuccess: () => {
      toast.success("Visszaállítva a kódbeli alapértelmezésre.");
      qc.invalidateQueries({ queryKey: ["clause-editor"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const entries = data?.entries ?? [];
  const sources = data?.sources ?? [];
  const overridden = entries.filter((e) => e.override).length;

  return (
    <PageShell>
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="border-df-green bg-df-green/10 text-df-green" variant="outline">
              Ügyvédi szerkesztő
            </Badge>
            <h1 className="mt-4 font-brand text-4xl font-bold text-df-green">Klauzula szerkesztő</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-df-gray">
              Itt javíthatod a Klauzula Társ szövegeit és jogforrás-hivatkozásait. Minden mentés után
              a klauzula automatikusan visszakerül „jóváhagyandó" állapotba, és újra le kell lektorálni.
            </p>
          </div>
          <Button asChild variant="outline" className="border-df-green text-df-green">
            <Link to="/klauzula-jovahagyasok">Jóváhagyási nézet</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card className="border-df-border bg-df-card p-4">
            <div className="text-xs font-semibold text-df-gray">Összes klauzula</div>
            <div className="font-brand text-3xl font-bold text-df-green">
              {isLoading ? "…" : entries.length}
            </div>
          </Card>
          <Card className="border-df-border bg-df-card p-4">
            <div className="text-xs font-semibold text-df-gray">Ügyvédi javítással</div>
            <div className="font-brand text-3xl font-bold text-df-green">
              {isLoading ? "…" : overridden}
            </div>
          </Card>
        </div>

        {isLoading && (
          <Card className="mt-6 border-df-border bg-df-card p-5 text-sm text-df-gray">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-df-green" /> Betöltés…
          </Card>
        )}
        {error && (
          <Card className="mt-6 border-df-red/40 bg-df-red/10 p-5 text-sm text-df-red">
            {(error as Error).message}
          </Card>
        )}

        <div className="mt-6 space-y-3">
          {entries.map((entry) => {
            const isOverridden = !!entry.override;
            return (
              <Card key={entry.clauseId} className="border-df-border bg-df-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScrollText className="h-4 w-4 text-df-green" />
                      <h2 className="font-semibold text-df-ink">{entry.effective.title}</h2>
                      {isOverridden && (
                        <Badge variant="outline" className="border-df-green text-df-green">
                          Ügyvédi javítás
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-df-ink">
                      {entry.effective.bodyTemplate}
                    </p>
                    <div className="mt-2 text-xs text-df-gray">
                      <code>{entry.clauseId}</code> · Jogforrás:{" "}
                      {entry.effective.sourceRefs
                        .map((r) => (r.section ? `${r.sourceId} ${r.section}` : r.sourceId))
                        .join(", ") || "—"}
                    </div>
                    {isOverridden && entry.override && (
                      <div className="mt-1 text-xs text-df-gray">
                        Utolsó módosítás: {new Date(entry.override.updated_at).toLocaleString("hu-HU")} ·{" "}
                        {entry.override.updated_by_name ?? "Ügyvéd"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="bg-df-green text-df-card hover:bg-primary"
                      onClick={() => setActive(entry)}
                    >
                      <Pencil className="mr-1 h-4 w-4" /> Szerkesztés
                    </Button>
                    {isOverridden && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Biztosan visszaállítod a kódbeli alapértelmezésre?")) {
                            resetMutation.mutate(entry.clauseId);
                          }
                        }}
                        disabled={resetMutation.isPending}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" /> Visszaállít
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {active && (
          <EditDialog
            entry={active}
            sources={sources}
            open={!!active}
            onOpenChange={(o) => !o && setActive(null)}
            onSaved={() => qc.invalidateQueries({ queryKey: ["clause-editor"] })}
          />
        )}
      </main>
    </PageShell>
  );
}