import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/kifuggesztesek")({
  head: () => ({
    meta: [
      { title: "Kifüggesztés kereső — Földbérleti hirdetmények | Földbérleti Szerződés Generátor" },
      { name: "description", content: "Aktív földbérleti hirdetmények böngészése településenként és művelési áganként, közvetlen hivatkozással a hirdetmenyek.gov.hu eredeti dokumentumára." },
    ],
  }),
  component: NoticesPage,
});

type Notice = {
  id: string;
  source_notice_id: string | null;
  subject: string | null;
  settlement: string | null;
  municipality: string | null;
  parcel_numbers: string[] | null;
  area_raw: string | null;
  area_ha: number | null;
  cultivation_branch: string | null;
  rent_raw: string | null;
  rent_normalized_huf_per_ha_year: number | null;
  deadline_date: string | null;
  original_attachment_url: string | null;
};

function NoticesPage() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<string>("all");
  const [onlyActive, setOnlyActive] = useState(true);

  const q = useQuery({
    queryKey: ["notices", onlyActive],
    queryFn: async () => {
      let query = supabase
        .from("notices")
        .select("id, source_notice_id, subject, settlement, municipality, parcel_numbers, area_raw, area_ha, cultivation_branch, rent_raw, rent_normalized_huf_per_ha_year, deadline_date, original_attachment_url")
        .order("deadline_date", { ascending: true })
        .limit(500);
      if (onlyActive) {
        const today = new Date().toISOString().slice(0, 10);
        query = query.gte("deadline_date", today);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Notice[];
    },
  });

  const branches = useMemo(() => {
    const set = new Set<string>();
    (q.data ?? []).forEach((n) => n.cultivation_branch && set.add(n.cultivation_branch));
    return Array.from(set).sort();
  }, [q.data]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter((n) => {
      if (branch !== "all" && n.cultivation_branch !== branch) return false;
      if (!s) return true;
      const hay = [n.settlement, n.municipality, n.subject, (n.parcel_numbers ?? []).join(" "), n.source_notice_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [q.data, search, branch]);

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="font-serif text-3xl">Kifüggesztések</h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
          Aktív földbérleti hirdetmények a hirdetmenyek.gov.hu-ról. Szűrj településre, művelési ágra, vagy keress helyrajzi számra.
        </p>

        <Card className="p-4 mt-6">
          <div className="grid gap-3 md:grid-cols-[1fr,200px,auto] items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Település, hrsz., azonosító..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger><SelectValue placeholder="Művelési ág" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden művelési ág</SelectItem>
                {branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setOnlyActive((v) => !v)}>
              {onlyActive ? "Lejártakat is" : "Csak aktívak"}
            </Button>
          </div>
        </Card>

        <div className="text-xs text-muted-foreground mt-3">
          {q.isLoading ? "Betöltés…" : `${filtered.length} találat`}
        </div>

        <Card className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Azonosító</TableHead>
                <TableHead>Település</TableHead>
                <TableHead>Hrsz.</TableHead>
                <TableHead>Művelési ág</TableHead>
                <TableHead className="text-right">Terület</TableHead>
                <TableHead>Haszonbér</TableHead>
                <TableHead>Határidő</TableHead>
                <TableHead className="text-right">Csatolmány</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-xs">{n.source_notice_id}</TableCell>
                  <TableCell>{n.settlement ?? "—"}</TableCell>
                  <TableCell className="text-xs">{(n.parcel_numbers ?? []).join(", ") || "—"}</TableCell>
                  <TableCell className="text-sm"><Badge variant="outline">{n.cultivation_branch ?? "—"}</Badge></TableCell>
                  <TableCell className="text-right text-sm">{n.area_raw ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {n.rent_normalized_huf_per_ha_year
                      ? <span className="font-medium">{n.rent_normalized_huf_per_ha_year.toLocaleString("hu-HU")} Ft/ha/év</span>
                      : <span className="text-muted-foreground">{n.rent_raw ?? "—"}</span>}
                  </TableCell>
                  <TableCell className="text-sm">{n.deadline_date ? formatDate(n.deadline_date) : "—"}</TableCell>
                  <TableCell className="text-right">
                    {n.original_attachment_url ? (
                      <Button asChild size="sm" variant="ghost">
                        <a href={n.original_attachment_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!q.isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  Nincs találat. Az admin felületen tölts fel egy heti Excel kivonatot.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <p className="text-xs text-muted-foreground mt-4">
          Forrás: hirdetmenyek.gov.hu — a csatolmány-linkek a hirdetmény jelentkezési határideje után már nem elérhetők.
        </p>
      </section>
    </PageShell>
  );
}