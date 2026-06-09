import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoticesImport } from "@/components/admin/notices-import";

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
  return (
    <PageShell>
      <section className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="font-serif text-3xl">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sablonverziók, klauzulatár, generált dokumentumok.
        </p>

        <h2 className="font-serif text-xl mt-8">Sablonverziók</h2>
        <Card className="mt-3 overflow-x-auto">
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
              {(q.data?.templates ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono">{t.version}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>{t.effective_from}</TableCell>
                  <TableCell className="text-sm">{t.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <h2 className="font-serif text-xl mt-8">Klauzulatár</h2>
        <Card className="mt-3 overflow-x-auto">
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
              {(q.data?.clauses ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.category}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell className="font-mono text-xs">{c.clause_key}</TableCell>
                  <TableCell>{c.active ? "✓" : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <h2 className="font-serif text-xl mt-8">Legutóbbi generált dokumentumok</h2>
        <Card className="mt-3 overflow-x-auto">
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
              {(q.data?.documents ?? []).map((d) => (
                <TableRow key={d.document_number}>
                  <TableCell className="font-mono text-xs">{d.document_number}</TableCell>
                  <TableCell>{d.lessor_name}</TableCell>
                  <TableCell>{d.lessee_name}</TableCell>
                  <TableCell>{d.settlement}</TableCell>
                  <TableCell>{d.finalized_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <h2 className="font-serif text-xl mt-8">Kifüggesztések importálása</h2>
        <NoticesImport />

        <p className="text-xs text-muted-foreground mt-8">
          Az admin hozzáférést csak meglévő admin vagy üzemeltetői beavatkozás tudja engedélyezni.
          Ha jogosultságot kell módosítani, kezeld azt a belső üzemeltetési folyamat szerint.
        </p>
        <Link to="/dashboard" className="text-sm text-primary underline mt-4 inline-block">
          ← Vissza a műhelybe
        </Link>
      </section>
    </PageShell>
  );
}
