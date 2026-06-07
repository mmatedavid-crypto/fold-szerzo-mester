import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportMyData, deleteMyAccount } from "@/lib/gdpr/gdpr.functions";

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
      const data = await doExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adatexport-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Adatexport letöltve.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export sikertelen.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (confirmText !== "TÖRLÉS") {
      toast.error('Írd be pontosan: TÖRLÉS');
      return;
    }
    try {
      setBusy(true);
      await doDelete({ data: { confirm: "TÖRLÉS" } });
      await supabase.auth.signOut();
      toast.success("Fiókod törölve.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Törlés sikertelen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2 className="font-serif text-xl mt-10">Adataim (GDPR)</h2>
      <Card className="p-5 mt-3 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-medium">Adatexport</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-prose">
              Letöltheted strukturált (JSON) formában az összes rólad tárolt adatot:
              profil, vázlatok, generált dokumentumok, fizetések, használati napló.
            </p>
          </div>
          <Button variant="outline" onClick={onExport} disabled={busy}>
            <Download className="h-4 w-4 mr-1" />
            Adatexport (JSON)
          </Button>
        </div>

        <div className="border-t border-border pt-5">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">Fiók végleges törlése</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-prose">
                Töröljük a profilodat, vázlataidat, krediteidet és az aktív
                előfizetésedet. A korábban kibocsátott szerződések és számlák
                a számviteli kötelezettség (8 év) miatt anonimizált formában
                megmaradnak. A művelet nem visszavonható.
              </p>

              {!confirmOpen ? (
                <Button
                  variant="destructive"
                  className="mt-3"
                  onClick={() => setConfirmOpen(true)}
                >
                  Fiók törlése
                </Button>
              ) : (
                <div className="mt-3 space-y-2 max-w-sm">
                  <Label htmlFor="confirm">
                    Megerősítéshez írd be: <code className="font-mono">TÖRLÉS</code>
                  </Label>
                  <Input
                    id="confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="TÖRLÉS"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={onDelete}
                      disabled={busy || confirmText !== "TÖRLÉS"}
                    >
                      Véglegesen törlöm
                    </Button>
                    <Button
                      variant="ghost"
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