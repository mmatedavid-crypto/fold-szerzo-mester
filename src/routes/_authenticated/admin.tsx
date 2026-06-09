import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandBadge } from "@/components/brand/brand-elements";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoticesImport } from "@/components/admin/notices-import";
import { AlertTriangle, Database, FileCheck2, Library, Loader2 } from "lucide-react";

const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

const adminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleCheck) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [tpls, clauses, docs] = await Promise.all([
      supabaseAdmin
        .from("legal_template_versions")
        .select("*")
        .order("effective_from", { ascending: false }),
      supabaseAdmin
        .from("clauses")
        .select("id, title, category, clause_key, active")
        .order("sort_order"),
      supabaseAdmin
        .from("generated_documents")
        .select("document_number, lessor_name, lessee_name, settlement, finalized_at")
        .order("finalized_at", { ascending: false })
        .limit(20),
    ]);
    return {
      templates: tpls.data ?? [],
      clauses: clauses.data ?? [],
      documents: docs.data ?? [],
    };
  });

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | Dr Föld" }] }),
  beforeLoad: async () => {
    const r = await checkAdmin();
    if (!r.isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  const q = useQuery({ queryKey: ["admin"], queryFn: () => adminData() });
  const templates = q.data?.templates ?? [];
  const clauses = q.data?.clauses ?? [];
  const documents = q.data?.documents ?? [];

  return (
    <PageShell>
      <section className="container mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border border-df-border bg-df-card p-6 shadow-[0_18px_45px_rgba(26,26,26,0.08)]">
          <BrandBadge>Üzemeltetői műhely</BrandBadge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green">Admin</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-df-gray">
            Sablonverziók, klauzulatár, generált dokumentumok és kifüggesztés import. Itt látszik,
            hogy a Dr Föld jogi és adatoldali műhelye rendben van-e.
          </p>
        </div>

        {q.isLoading && (
          <Card className="mt-6 border-df-border bg-df-card p-5 text-sm text-df-gray">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-df-green" />
            Admin adatok betöltése…
          </Card>
        )}

        {q.isError && (
          <Card className="mt-6 border-df-red/40 bg-df-red/10 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-df-red" />
              <div>
                <div className="font-semibold text-df-ink">
                  Az admin adatok most nem töltöttek be.
                </div>
                <p className="mt-1 text-sm text-df-gray">
                  Ellenőrizd a jogosultságot vagy próbáld újra az oldal frissítésével.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <MetricCard
            icon={<Library className="h-5 w-5" />}
            label="Sablonverzió"
            value={String(templates.length)}
          />
          <MetricCard
            icon={<Database className="h-5 w-5" />}
            label="Klauzula"
            value={String(clauses.length)}
          />
          <MetricCard
            icon={<FileCheck2 className="h-5 w-5" />}
            label="Legutóbbi dokumentum"
            value={String(documents.length)}
          />
        </div>

        <SectionTitle title="Sablonverziók" text="Aktív jogi sablonok és érvényességi állapotuk." />
        <Card className="mt-3 overflow-x-auto border-df-border bg-df-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verzió</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead>Érvényes</TableHead>
                <TableHead>Megjegyzés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono">{t.version}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-df-green text-df-green">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.effective_from}</TableCell>
                  <TableCell className="text-sm">{t.notes}</TableCell>
                </TableRow>
              ))}
              {!q.isLoading && templates.length === 0 && (
                <EmptyRow colSpan={4} text="Még nincs sablonverzió betöltve." />
              )}
            </TableBody>
          </Table>
        </Card>

        <SectionTitle
          title="Klauzulatár"
          text="A szerződésgenerálásban használt klauzulák áttekintése."
        />
        <Card className="mt-3 overflow-x-auto border-df-border bg-df-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategória</TableHead>
                <TableHead>Cím</TableHead>
                <TableHead>Kulcs</TableHead>
                <TableHead>Aktív</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clauses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.category}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell className="font-mono text-xs">{c.clause_key}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.active ? "border-df-green text-df-green" : "border-df-border text-df-gray"
                      }
                    >
                      {c.active ? "Aktív" : "Inaktív"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!q.isLoading && clauses.length === 0 && (
                <EmptyRow colSpan={4} text="Még nincs klauzula betöltve." />
              )}
            </TableBody>
          </Table>
        </Card>

        <SectionTitle
          title="Legutóbbi generált dokumentumok"
          text="Friss dokumentumkibocsátások gyors ellenőrzése."
        />
        <Card className="mt-3 overflow-x-auto border-df-border bg-df-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dok. ID</TableHead>
                <TableHead>Beadó</TableHead>
                <TableHead>Bérlő</TableHead>
                <TableHead>Település</TableHead>
                <TableHead>Dátum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.document_number}>
                  <TableCell className="font-mono text-xs">{d.document_number}</TableCell>
                  <TableCell>{d.lessor_name}</TableCell>
                  <TableCell>{d.lessee_name}</TableCell>
                  <TableCell>{d.settlement}</TableCell>
                  <TableCell>{d.finalized_at}</TableCell>
                </TableRow>
              ))}
              {!q.isLoading && documents.length === 0 && (
                <EmptyRow colSpan={5} text="Még nincs generált dokumentum a listában." />
              )}
            </TableBody>
          </Table>
        </Card>

        <SectionTitle
          title="Kifüggesztések importálása"
          text="RSS szinkron és kézi Excel import az adatfrissítéshez."
        />
        <NoticesImport />

        <p className="mt-8 rounded-md border border-df-border bg-df-card p-3 text-xs leading-5 text-df-gray">
          Az admin hozzáférést csak meglévő admin vagy üzemeltetői beavatkozás tudja engedélyezni.
          Ha jogosultságot kell módosítani, kezeld azt a belső üzemeltetési folyamat szerint.
        </p>
        <Button asChild variant="outline" className="mt-4 border-df-green text-df-green">
          <Link to="/dashboard">← Vissza a műhelybe</Link>
        </Button>
      </section>
    </PageShell>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-8">
      <h2 className="font-brand text-2xl font-bold text-df-green">{title}</h2>
      <p className="mt-1 text-sm text-df-gray">{text}</p>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="border-df-border bg-df-card p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md border border-df-border bg-df-cream text-df-green">
          {icon}
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-df-gray">
            {label}
          </div>
          <div className="font-brand text-2xl font-bold text-df-green">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-df-gray">
        {text}
      </TableCell>
    </TableRow>
  );
}
