import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Calculator } from "lucide-react";
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
  notice_type: string | null;
  publication_date: string | null;
  original_detail_url: string | null;
};

function NoticesPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");

  const q = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, source_notice_id, subject, settlement, municipality, parcel_numbers, notice_type, publication_date, original_detail_url")
        .order("publication_date", { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Notice[];
    },
  });

  const types = useMemo(() => {
    const set = new Set<string>();
    (q.data ?? []).forEach((n) => n.notice_type && set.add(n.notice_type));
    return Array.from(set).sort();
  }, [q.data]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter((n) => {
      if (type !== "all" && n.notice_type !== type) return false;
      if (!s) return true;
      const hay = [n.settlement, n.municipality, n.subject, (n.parcel_numbers ?? []).join(" "), n.source_notice_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [q.data, search, type]);

  return (
    <PageShell>
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="font-serif text-3xl">Kifüggesztések</h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
          Aktuális termőföld kifüggesztések. A részletekért (terület, díj, határidő, csatolmány) nyisd meg a hivatalos oldalt.
        </p>

        <Card className="p-4 mt-6">
          <div className="grid gap-3 md:grid-cols-[1fr,220px] items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Település, hrsz., azonosító..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Típus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden típus</SelectItem>
                {types.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="text-xs text-muted-foreground mt-3">
          {q.isLoading ? "Betöltés…" : `${filtered.length} találat`}
        </div>

        <Card className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Közzététel</TableHead>
                <TableHead>Típus</TableHead>
                <TableHead>Település</TableHead>
                <TableHead>Hrsz.</TableHead>
                <TableHead>Forrásintézmény</TableHead>
                <TableHead className="text-right">Részletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="text-sm whitespace-nowrap">{n.publication_date ? formatDate(n.publication_date) : "—"}</TableCell>
                  <TableCell className="text-sm"><Badge variant="outline">{n.notice_type ?? "—"}</Badge></TableCell>
                  <TableCell>{n.settlement ?? "—"}</TableCell>
                  <TableCell className="text-xs">{(n.parcel_numbers ?? []).join(", ") || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{n.municipality ?? "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/kifuggesztesek/$noticeId" params={{ noticeId: n.id }}>
                        <Calculator className="h-4 w-4 mr-1" /> Ranghely
                      </Link>
                    </Button>
                    {n.original_detail_url ? (
                      <Button asChild size="sm" variant="ghost">
                        <a href={n.original_detail_url} target="_blank" rel="noopener noreferrer" aria-label="Hivatalos oldal megnyitása">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {!q.isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Nincs találat. Az admin felületen futtasd le az RSS szinkront.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

      </section>
    </PageShell>
  );
}