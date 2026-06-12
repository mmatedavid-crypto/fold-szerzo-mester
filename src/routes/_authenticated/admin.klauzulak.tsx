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
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, XCircle, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/klauzulak")({
  component: AdminKlauzulakPage,
});

function StatusBadge({ summary }: { summary: ClauseReviewSummary }) {
  if (!summary.latestReview) {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" /> Nincs lektorálva
      </Badge>
    );
  }
  if (summary.latestReview.decision === "approved") {
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Jóváhagyva
      </Badge>
    );
  }
  if (summary.latestReview.decision === "rejected") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" /> Elutasítva
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <AlertTriangle className="h-3 w-3" /> Módosítás szükséges
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
  const [answers, setAnswers] = useState<ReviewChecklist>({});
  const [decision, setDecision] = useState<"approved" | "rejected" | "needs_changes" | "">("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [comment, setComment] = useState("");

  const allAnswered = REVIEW_CHECKLIST_QUESTIONS.every((q) => answers[q.id]);
  const allYes = REVIEW_CHECKLIST_QUESTIONS.every((q) => answers[q.id] === "yes");

  const mutation = useMutation({
    mutationFn: async () => {
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
      toast.success("Döntés rögzítve.");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{summary.title}</DialogTitle>
          <DialogDescription className="text-left">
            Klauzula azonosító: <code>{summary.clauseId}</code> · verzió: <code>{summary.currentVersion}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-md border bg-muted/40 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">A klauzula szövege</div>
            <p className="text-sm whitespace-pre-wrap">{summary.bodyTemplate}</p>
            <div className="text-xs text-muted-foreground mt-2">
              Jogforrás: {summary.sourceRefs.join(", ") || "—"}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-semibold">Eldöntendő kérdések</div>
            {REVIEW_CHECKLIST_QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-sm">{q.label}</Label>
                <RadioGroup
                  value={answers[q.id] ?? ""}
                  onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v as "yes" | "no" }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id={`${q.id}-yes`} />
                    <Label htmlFor={`${q.id}-yes`} className="font-normal cursor-pointer">Igen</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id={`${q.id}-no`} />
                    <Label htmlFor={`${q.id}-no`} className="font-normal cursor-pointer">Nem</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Összesített döntés</Label>
              <Select value={decision} onValueChange={(v) => setDecision(v as typeof decision)}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved" disabled={allAnswered && !allYes}>
                    Jóváhagyom
                  </SelectItem>
                  <SelectItem value="needs_changes">Módosítás szükséges</SelectItem>
                  <SelectItem value="rejected">Elutasítom</SelectItem>
                </SelectContent>
              </Select>
              {allAnswered && !allYes && (
                <p className="text-xs text-muted-foreground">
                  Jóváhagyás csak akkor adható, ha minden kérdésre IGEN a válasz.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Kockázati szint</Label>
              <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as typeof riskLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Alacsony</SelectItem>
                  <SelectItem value="medium">Közepes</SelectItem>
                  <SelectItem value="high">Magas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Megjegyzés (opcionális)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Pl. javasolt szövegpontosítás, hivatkozott §-módosítás dátuma…"
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Mégse</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!allAnswered || !decision || mutation.isPending}
          >
            {mutation.isPending ? "Mentés…" : "Döntés rögzítése"}
          </Button>
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
    <PageShell
      title="Klauzula-lektorálás"
      description="Ügyvédi jóváhagyás a haszonbérleti szerződés klauzula-katalógusához. Amíg egy klauzulához nincs jóváhagyott review, az érintett szerződés nem generálható."
    >
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
                  {" "}{c.latestReview.reviewer_name ?? "Ügyvéd"} ·
                  {" "}kockázat: {c.latestReview.risk_level}
                  {c.latestReview.comment ? ` · "${c.latestReview.comment}"` : ""}
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setActive(c)}>
              Lektorálás
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
    </PageShell>
  );
}