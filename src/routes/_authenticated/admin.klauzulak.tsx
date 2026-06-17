import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listClausesForReview,
  submitClauseReview,
  type ClauseReviewSummary,
} from "@/lib/legal/clauseReviews.functions";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, XCircle, ScrollText, Loader2, RefreshCw, Link2 } from "lucide-react";
import { checkSourceFreshness, type FreshnessResult } from "@/lib/legal/sourceFreshness.functions";

export const Route = createFileRoute("/_authenticated/admin/klauzulak")({
  component: AdminKlauzulakPage,
});

function StatusBadge({ summary }: { summary: ClauseReviewSummary }) {
  if (!summary.latestReview) {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" /> Jóváhagyandó
      </Badge>
    );
  }
  if (summary.latestReview.decision === "approved") {
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Jóváhagyott
      </Badge>
    );
  }
  if (summary.latestReview.decision === "rejected") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" /> Nem jóváhagyott
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <AlertTriangle className="h-3 w-3" /> Jóváhagyandó
    </Badge>
  );
}

function ReviewDialog({
  summary,
  open,
  onOpenChange,
  onSubmitted,
}: {
  summary: ClauseReviewSummary;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmitted: () => void;
}) {
  const submitFn = useServerFn(submitClauseReview);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: async (decision: "approved" | "rejected") => {
      return submitFn({
        data: {
          clauseId: summary.clauseId,
          decision,
          comment: comment.trim() || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Döntés rögzítve.");
      onSubmitted();
      onOpenChange(false);
      setRejecting(false);
      setComment("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{summary.title}</DialogTitle>
          <DialogDescription className="text-left">
            Klauzula azonosító: <code>{summary.clauseId}</code> · verzió: <code>{summary.currentVersion}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">A klauzula szövege</div>
            <p className="text-sm whitespace-pre-wrap">{summary.bodyTemplate}</p>
            <div className="text-xs text-muted-foreground mt-2">
              Jogforrás: {summary.sourceRefs.join(", ") || "—"}
            </div>
          </div>

          {rejecting && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Miért nem hagyod jóvá?</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Írd le röviden, mit kell javítani vagy miért nem használható a klauzula."
                rows={4}
                maxLength={2000}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Az indoklás kötelező — ez alapján tud a rendszer javítást készíteni.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {!rejecting ? (
            <>
              <Button variant="outline" onClick={() => setRejecting(true)} disabled={mutation.isPending}>
                Nem hagyom jóvá
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-600/90"
                onClick={() => mutation.mutate("approved")}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Mentés…" : "Jóváhagyom"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setRejecting(false); setComment(""); }} disabled={mutation.isPending}>
                Mégse
              </Button>
              <Button
                variant="destructive"
                onClick={() => mutation.mutate("rejected")}
                disabled={mutation.isPending || !comment.trim()}
              >
                {mutation.isPending ? "Mentés…" : "Elutasítás mentése"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminKlauzulakPage() {
  const listFn = useServerFn(listClausesForReview);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["clause-reviews"],
    queryFn: () => listFn(),
  });
  const [active, setActive] = useState<ClauseReviewSummary | null>(null);

  const total = data?.length ?? 0;
  const approved = data?.filter((c) => c.isApproved).length ?? 0;
  const pending = total - approved;

  return (
    <PageShell>
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Klauzula-lektorálás</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ügyvédi jóváhagyás a haszonbérleti szerződés klauzula-katalógusához. Amíg egy klauzulához
            nincs jóváhagyott review, az érintett szerződés nem generálható.
          </p>
        </div>
        <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Vissza az adminra</Link>
        </Button>
        </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Összes klauzula</div>
          <div className="text-2xl font-semibold">{total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Jóváhagyott</div>
          <div className="text-2xl font-semibold text-emerald-600">{approved}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Lektorálásra vár</div>
          <div className="text-2xl font-semibold text-amber-600">{pending}</div>
        </Card>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Betöltés…</p>}
      {error && (
        <Card className="p-4 border-destructive">
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        </Card>
      )}

      <div className="space-y-2">
        {data?.map((c) => (
          <Card key={c.clauseId} className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ScrollText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{c.title}</span>
                <StatusBadge summary={c} />
              </div>
              <div className="text-xs text-muted-foreground">
                <code>{c.clauseId}</code> · Jogforrás: {c.sourceRefs.join(", ") || "—"}
              </div>
              {c.latestReview && (
                <div className="text-xs text-muted-foreground mt-1">
                  Utolsó döntés: {new Date(c.latestReview.reviewed_at).toLocaleString("hu-HU")} ·
                  {" "}{c.latestReview.reviewer_name ?? "Ügyvéd"}
                  {c.latestReview.comment ? ` · indoklás: "${c.latestReview.comment}"` : ""}
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setActive(c)}>
              Döntés
            </Button>
          </Card>
        ))}
      </div>

      {active && (
        <ReviewDialog
          summary={active}
          open={!!active}
          onOpenChange={(o) => !o && setActive(null)}
          onSubmitted={() => qc.invalidateQueries({ queryKey: ["clause-reviews"] })}
        />
      )}
      <div className="mt-10">
        <SourceFreshnessPanel />
      </div>
      </div>
    </PageShell>
  );
}

function SourceFreshnessPanel() {
  const run = useServerFn(checkSourceFreshness);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<FreshnessResult[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setErr(null);
    try {
      setResults(await run());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-semibold">Jogforrás-frissesség</h2>
          <p className="text-sm text-muted-foreground">
            Újra letölti az NJT-források HTML-jét, és összeveti a tárolt SHA‑256 hash-sel.
            Ha bármelyik forrás megváltozott, az érintett klauzulákat újra le kell lektorálni.
          </p>
        </div>
        <Button onClick={go} disabled={busy} size="sm">
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Most ellenőrzés
        </Button>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {results && (
        <div className="space-y-2">
          {results.map((r) => {
            const tone =
              r.status === "unchanged"
                ? "border-emerald-300 bg-emerald-50"
                : r.status === "changed"
                ? "border-amber-400 bg-amber-50"
                : r.status === "unreachable"
                ? "border-destructive/50 bg-destructive/5"
                : "border-df-border bg-muted/40";
            const label =
              r.status === "unchanged"
                ? "Változatlan"
                : r.status === "changed"
                ? "MEGVÁLTOZOTT — ügyvédi review kell"
                : r.status === "unreachable"
                ? "Nem elérhető"
                : "Soha nem volt letöltve";
            return (
              <div key={r.id} className={`rounded border p-3 text-sm ${tone}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{r.shortName}</div>
                  <Badge variant="outline">{label}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1 break-all">
                  <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                    <Link2 className="h-3 w-3" />{r.sourceUrl}
                  </a>
                </div>
                <div className="text-xs mt-1 grid sm:grid-cols-2 gap-x-4">
                  <div>Tárolt hash: <code>{r.storedHash ?? "—"}</code>{r.storedAt ? ` (${r.storedAt})` : ""}</div>
                  <div>Jelenlegi hash: <code>{r.currentHash ?? "—"}</code>{r.byteLength ? ` (${r.byteLength} B)` : ""}</div>
                </div>
                {r.message && <div className="text-xs text-destructive mt-1">{r.message}</div>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}