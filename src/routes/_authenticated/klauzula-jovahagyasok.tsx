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
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" /> Jóváhagyandó
      </Badge>
    );
  }
  if (summary.latestReview.decision === "approved") {
    return (
      <Badge className="gap-1 bg-df-green text-df-card hover:bg-df-green">
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
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}) {
  const submitFn = useServerFn(submitClauseReview);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      submitFn({
        data: {
          clauseId: summary.clauseId,
          decision,
          comment: comment.trim() || null,
        },
      }),
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{summary.title}</DialogTitle>
          <DialogDescription className="text-left">
            Azonosító: <code>{summary.clauseId}</code> · verzió: <code>{summary.currentVersion}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-df-border bg-df-cream/40 p-3">
            <div className="mb-1 text-xs font-semibold text-df-gray">Klauzula szövege</div>
            <p className="whitespace-pre-wrap text-sm text-df-ink">{summary.bodyTemplate}</p>
            <div className="mt-2 text-xs text-df-gray">
              Jogforrás: {summary.sourceRefs.join(", ") || "—"}
            </div>
          </div>

          {rejecting && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-df-ink">Miért nem hagyod jóvá?</Label>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Írd le röviden, mit kell javítani vagy miért nem használható a klauzula."
                rows={4}
                maxLength={2000}
                autoFocus
              />
              <p className="text-xs text-df-gray">
                Az indoklás kötelező — ez alapján tud a rendszer javítást készíteni.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {!rejecting ? (
            <>
              <Button
                variant="outline"
                onClick={() => setRejecting(true)}
                disabled={mutation.isPending}
              >
                Nem hagyom jóvá
              </Button>
              <Button
                className="bg-df-green text-df-card hover:bg-primary"
                onClick={() => mutation.mutate("approved")}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Mentés…" : "Jóváhagyom"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setRejecting(false);
                  setComment("");
                }}
                disabled={mutation.isPending}
              >
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

function ClauseApprovalsPage() {
  const listFn = useServerFn(listClausesForReview);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["clause-approvals"],
    queryFn: () => listFn(),
  });
  const [active, setActive] = useState<ClauseReviewSummary | null>(null);

  const total = data?.length ?? 0;
  const approved = data?.filter((clause) => clause.latestReview?.decision === "approved").length ?? 0;
  const rejected = data?.filter((clause) => clause.latestReview?.decision === "rejected").length ?? 0;
  const pending = total - approved - rejected;

  return (
    <PageShell>
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="border-df-green bg-df-green/10 text-df-green" variant="outline">
              Ügyvédi nézet
            </Badge>
            <h1 className="mt-4 font-brand text-4xl font-bold text-df-green">Klauzula jóváhagyások</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-df-gray">
              Itt vannak a jóváhagyandó klauzulák. Az ügyvéd minden klauzulát jóváhagy vagy elutasít.
              Elutasítás esetén rövid indoklás szükséges, amely alapján a rendszer javítást tud készíteni.
            </p>
          </div>
          <Button asChild variant="outline" className="border-df-green text-df-green">
            <Link to="/dashboard">Vissza a műhelybe</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
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
          <Card className="border-df-border bg-df-card p-4">
            <div className="text-xs font-semibold text-df-gray">Nem jóváhagyott</div>
            <div className="font-brand text-3xl font-bold text-df-red">{isLoading ? "…" : rejected}</div>
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
          {data?.map((clause) => {
            const review = clause.latestReview;
            const isRejected = review?.decision === "rejected";
            return (
              <Card key={clause.clauseId} className="border-df-border bg-df-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScrollText className="h-4 w-4 text-df-green" />
                      <h2 className="font-semibold text-df-ink">{clause.title}</h2>
                      <StatusBadge summary={clause} />
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-df-ink">
                      {clause.bodyTemplate}
                    </p>
                    <div className="mt-2 text-xs text-df-gray">
                      <code>{clause.clauseId}</code> · Jogforrás: {clause.sourceRefs.join(", ") || "—"}
                    </div>
                    {review && (
                      <div className="mt-1 text-xs text-df-gray">
                        Utolsó döntés: {new Date(review.reviewed_at).toLocaleString("hu-HU")} ·{" "}
                        {review.reviewer_name ?? "Ügyvéd"}
                      </div>
                    )}
                    {isRejected && review?.comment && (
                      <div className="mt-2 rounded-md border border-df-red/40 bg-df-red/10 p-2 text-xs text-df-red">
                        <span className="font-semibold">Indoklás:</span> {review.comment}
                      </div>
                    )}
                  </div>
                  <Button
                    className="bg-df-green text-df-card hover:bg-primary"
                    onClick={() => setActive(clause)}
                  >
                    {review ? "Új döntés" : "Jóváhagyás"}
                  </Button>
                </div>
              </Card>
            );
          })}
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