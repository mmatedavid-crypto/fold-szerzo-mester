import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listClausesForReview,
  submitClauseReview,
  REVIEW_CHECKLIST_QUESTIONS,
  type ClauseReviewSummary,
  type ReviewChecklist,
} from "@/lib/legal/clauseReviews.functions";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, Loader2, ScrollText, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/klauzula-jovahagyasok")({
  head: () => ({
    meta: [
      { title: "Klauzula jóváhagyások | Dr Föld" },
      {
        name: "description",
        content: "Ügyvédi klauzula-jóváhagyási felület a Dr Föld haszonbérleti szerződés klauzuláihoz.",
      },
    ],
  }),
  component: ClauseApprovalsPage,
});

function StatusBadge({ summary }: { summary: ClauseReviewSummary }) {
  if (!summary.latestReview) {
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Jóváhagyandó</Badge>;
  }
  if (summary.latestReview.decision === "approved") {
    return <Badge className="gap-1 bg-df-green text-df-card hover:bg-df-green"><CheckCircle2 className="h-3 w-3" /> Jóváhagyva</Badge>;
  }
  if (summary.latestReview.decision === "rejected") {
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Elutasítva</Badge>;
  }
  return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" /> Módosítás szükséges</Badge>;
}

function ReviewDialog({
  summary,
  open,
  onOpenChange,
  onSubmitted,
}: {
  summary: ClauseReviewSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const submitFn = useServerFn(submitClauseReview);
  const [answers, setAnswers] = useState<ReviewChecklist>({});
  const [decision, setDecision] = useState<"approved" | "rejected" | "needs_changes" | "">("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [comment, setComment] = useState("");

  const allAnswered = REVIEW_CHECKLIST_QUESTIONS.every((q) => answers[q.id]);
  const allYes = REVIEW_CHECKLIST_QUESTIONS.every((q) => answers[q.id] === "yes");

  const mutation = useMutation({
    mutationFn: () => {
      if (!decision) throw new Error("Válassz döntést.");
      return submitFn({
        data: {
          clauseId: summary.clauseId,
          decision,
          riskLevel,
          checklist: answers,
          comment: comment.trim() || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Klauzula-döntés rögzítve.");
      onSubmitted();
      onOpenChange(false);
      setAnswers({});
      setDecision("");
      setRiskLevel("low");
      setComment("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{summary.title}</DialogTitle>
          <DialogDescription className="text-left">
            Azonosító: <code>{summary.clauseId}</code> · verzió: <code>{summary.currentVersion}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-md border border-df-border bg-df-cream/40 p-3">
            <div className="mb-1 text-xs font-semibold text-df-gray">Klauzula szövege</div>
            <p className="whitespace-pre-wrap text-sm text-df-ink">{summary.bodyTemplate}</p>
            <div className="mt-2 text-xs text-df-gray">Jogforrás: {summary.sourceRefs.join(", ") || "—"}</div>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-semibold text-df-ink">Jóváhagyási kérdések</div>
            {REVIEW_CHECKLIST_QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-sm text-df-ink">{q.label}</Label>
                <RadioGroup
                  value={answers[q.id] ?? ""}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value as "yes" | "no" }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id={`${summary.clauseId}-${q.id}-yes`} />
                    <Label htmlFor={`${summary.clauseId}-${q.id}-yes`} className="cursor-pointer font-normal">Igen</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id={`${summary.clauseId}-${q.id}-no`} />
                    <Label htmlFor={`${summary.clauseId}-${q.id}-no`} className="cursor-pointer font-normal">Nem</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Döntés</Label>
              <Select value={decision} onValueChange={(value) => setDecision(value as typeof decision)}>
                <SelectTrigger><SelectValue placeholder="Válassz döntést" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved" disabled={allAnswered && !allYes}>Jóváhagyom</SelectItem>
                  <SelectItem value="needs_changes">Módosítás szükséges</SelectItem>
                  <SelectItem value="rejected">Elutasítom</SelectItem>
                </SelectContent>
              </Select>
              {allAnswered && !allYes && <p className="text-xs text-df-gray">Jóváhagyás csak minden kérdésre adott IGEN válasszal menthető.</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Kockázati szint</Label>
              <Select value={riskLevel} onValueChange={(value) => setRiskLevel(value as typeof riskLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Alacsony</SelectItem>
                  <SelectItem value="medium">Közepes</SelectItem>
                  <SelectItem value="high">Magas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Megjegyzés</Label>
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} maxLength={2000} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Mégse</Button>
          <Button onClick={() => mutation.mutate()} disabled={!allAnswered || !decision || mutation.isPending}>
            {mutation.isPending ? "Mentés…" : "Döntés rögzítése"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClauseApprovalsPage() {
  const listFn = useServerFn(listClausesForReview);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["clause-approvals"], queryFn: () => listFn() });
  const [active, setActive] = useState<ClauseReviewSummary | null>(null);

  const total = data?.length ?? 0;
  const approved = data?.filter((clause) => clause.isApproved).length ?? 0;
  const pending = total - approved;

  return (
    <PageShell>
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="border-df-green bg-df-green/10 text-df-green" variant="outline">Ügyvédi nézet</Badge>
            <h1 className="mt-4 font-brand text-4xl font-bold text-df-green">Klauzula jóváhagyások</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-df-gray">
              Itt vannak a jóváhagyandó klauzulák. A „Lektorálás” gombbal nyílik a kérdéssor és a döntés mentése.
            </p>
          </div>
          <Button asChild variant="outline" className="border-df-green text-df-green">
            <Link to="/dashboard">Vissza a műhelybe</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card className="border-df-border bg-df-card p-4">
            <div className="text-xs font-semibold text-df-gray">Összes klauzula</div>
            <div className="font-brand text-3xl font-bold text-df-green">{isLoading ? "…" : total}</div>
          </Card>
          <Card className="border-df-border bg-df-card p-4">
            <div className="text-xs font-semibold text-df-gray">Jóváhagyott</div>
            <div className="font-brand text-3xl font-bold text-df-green">{isLoading ? "…" : approved}</div>
          </Card>
          <Card className="border-df-border bg-df-card p-4">
            <div className="text-xs font-semibold text-df-gray">Jóváhagyandó</div>
            <div className="font-brand text-3xl font-bold text-df-red">{isLoading ? "…" : pending}</div>
          </Card>
        </div>

        {isLoading && (
          <Card className="mt-6 border-df-border bg-df-card p-5 text-sm text-df-gray">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-df-green" /> Klauzulák betöltése…
          </Card>
        )}

        {error && (
          <Card className="mt-6 border-df-red/40 bg-df-red/10 p-5 text-sm text-df-red">
            {(error as Error).message}
          </Card>
        )}

        <div className="mt-6 space-y-3">
          {data?.map((clause) => (
            <Card key={clause.clauseId} className="border-df-border bg-df-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ScrollText className="h-4 w-4 text-df-green" />
                    <h2 className="font-semibold text-df-ink">{clause.title}</h2>
                    <StatusBadge summary={clause} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-df-ink">{clause.bodyTemplate}</p>
                  <div className="mt-2 text-xs text-df-gray">
                    <code>{clause.clauseId}</code> · Jogforrás: {clause.sourceRefs.join(", ") || "—"}
                  </div>
                  {clause.latestReview && (
                    <div className="mt-1 text-xs text-df-gray">
                      Utolsó döntés: {new Date(clause.latestReview.reviewed_at).toLocaleString("hu-HU")} · {clause.latestReview.reviewer_name ?? "Ügyvéd"}
                      {clause.latestReview.comment ? ` · ${clause.latestReview.comment}` : ""}
                    </div>
                  )}
                </div>
                <Button className="bg-df-green text-df-card hover:bg-primary" onClick={() => setActive(clause)}>
                  Lektorálás
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {active && (
          <ReviewDialog
            summary={active}
            open={!!active}
            onOpenChange={(open) => !open && setActive(null)}
            onSubmitted={() => queryClient.invalidateQueries({ queryKey: ["clause-approvals"] })}
          />
        )}
      </main>
    </PageShell>
  );
}