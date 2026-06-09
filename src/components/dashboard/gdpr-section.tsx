import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportMyData, deleteMyAccount } from "@/lib/gdpr/gdpr.functions";
import { gdprErrorMessage } from "@/lib/user-facing-errors";

export function GdprSection() {
  const navigate = useNavigate();
  const doExport = useServerFn(exportMyData);
  const doDelete = useServerFn(deleteMyAccount);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function onExport() {
    try {
      setBusy(true);
      const res = await doExport();
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adatexport-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Adatexport letöltve.");
    } catch (e) {
      toast.error(gdprErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (confirmText !== "TÖRLÉS") {
      toast.error("Írd be pontosan: TÖRLÉS");
      return;
    }
    try {
      setBusy(true);
      await doDelete({ data: { confirm: "TÖRLÉS" } });
      await supabase.auth.signOut();
      toast.success("Fiókod törölve.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(gdprErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-10">
        <h2 className="font-brand text-2xl font-bold text-df-green">Adataid és fiókod</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-df-gray">
          Itt kérheted le a rólad tárolt adatokat, vagy indíthatod a fiók végleges törlését. A
          földügy legyen rendezett, az adatkezelés is.
        </p>
      </div>
      <Card className="mt-3 space-y-6 border-df-border bg-df-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-df-green" />
            <div>
              <div className="font-semibold text-df-ink">Adatexport</div>
              <p className="mt-1 max-w-prose text-sm leading-6 text-df-gray">
                Letöltheted strukturált (JSON) formában az összes rólad tárolt adatot: profil,
                vázlatok, generált dokumentumok, fizetések, használati napló.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-df-green text-df-green"
            onClick={onExport}
            disabled={busy}
          >
            <Download className="mr-1 h-4 w-4" />
            Adatexport (JSON)
          </Button>
        </div>

        <div className="border-t border-df-border pt-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-df-red" />
            <div className="flex-1">
              <div className="font-semibold text-df-ink">Fiók végleges törlése</div>
              <p className="mt-1 max-w-prose text-sm leading-6 text-df-gray">
                Töröljük a profilodat, vázlataidat, krediteidet és az aktív előfizetésedet. A
                korábban kibocsátott szerződések és számlák a számviteli kötelezettség (8 év) miatt
                anonimizált formában megmaradnak. A művelet nem visszavonható.
              </p>

              {!confirmOpen ? (
                <Button
                  variant="destructive"
                  className="mt-3 bg-df-red text-white hover:bg-df-red/90"
                  onClick={() => setConfirmOpen(true)}
                >
                  Fiók törlése
                </Button>
              ) : (
                <div className="mt-3 max-w-sm space-y-2 rounded-md border border-df-red/30 bg-df-red/10 p-3">
                  <Label htmlFor="confirm">
                    Megerősítéshez írd be: <code className="font-mono">TÖRLÉS</code>
                  </Label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="TÖRLÉS"
                    className="border-df-red/40 bg-white"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      className="bg-df-red text-white hover:bg-df-red/90"
                      onClick={onDelete}
                      disabled={busy || confirmText !== "TÖRLÉS"}
                    >
                      Véglegesen törlöm
                    </Button>
                    <Button
                      variant="outline"
                      className="border-df-border bg-df-card text-df-green"
                      onClick={() => {
                        setConfirmOpen(false);
                        setConfirmText("");
                      }}
                    >
                      Mégse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
