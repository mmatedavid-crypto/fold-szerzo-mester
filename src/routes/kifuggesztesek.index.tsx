import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Calculator, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { cleanSettlement } from "@/lib/notices/clean";
import { subscribeToSettlement } from "@/lib/subscriptions/subscribe.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/kifuggesztesek/")({
  head: () => ({
    meta: [
      { title: "Kifüggesztések keresése | Dr Föld" },
      {
        name: "description",
        content:
          "Aktív termőföld kifüggesztések böngészése településenként, helyrajzi szám alapján és ranghely-kalkulátorral.",
      },
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
        .select(
          "id, source_notice_id, subject, settlement, municipality, parcel_numbers, notice_type, publication_date, original_detail_url",
        )
        .order("publication_date", { ascending: false, nullsFirst: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as Notice[];
    },
  });

  const types = useMemo(() => {
    const set = new Set<string>();
    (q.data ?? []).forEach((n) => n.notice_type && set.add(n.notice_type));
    return Array.from(set).sort();
  }, [q.data]);

  const settlements = useMemo(() => {
    const set = new Set<string>();
    (q.data ?? []).forEach((n) => {
      const c = cleanSettlement(n.settlement);
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "hu"));
  }, [q.data]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter((n) => {
      if (type !== "all" && n.notice_type !== type) return false;
      if (!s) return true;
      const hay = [
        cleanSettlement(n.settlement),
        n.municipality,
        n.subject,
        (n.parcel_numbers ?? []).join(" "),
        n.source_notice_id,
      ]
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
          Aktuális termőföld kifüggesztések. A részletekért (terület, díj, határidő, csatolmány)
          nyisd meg a hivatalos oldalt.
        </p>

        <SubscribeBanner settlements={settlements} />

        <div className="mt-4 rounded border bg-primary/5 border-primary/30 p-3 flex flex-wrap items-center gap-2 text-sm">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="font-medium">Új: önálló Ranghely kalkulátor</span>
          <span className="text-muted-foreground">
            — jelöld be, mi igaz rád, és nézd meg, ki áll előrébb a sorban.
          </span>
          <Button asChild size="sm" className="ml-auto">
            <Link to="/ranghely-kalkulator">Kalkulátor megnyitása</Link>
          </Button>
        </div>

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
              <SelectTrigger>
                <SelectValue placeholder="Típus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden típus</SelectItem>
                {types.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
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
                <TableHead>Település</TableHead>
                <TableHead>Hrsz.</TableHead>
                <TableHead>Típus</TableHead>
                <TableHead className="text-right">Részletek</TableHead>
                <TableHead className="text-right">Közzététel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{cleanSettlement(n.settlement) ?? n.settlement ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {(n.parcel_numbers ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">{n.notice_type ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/kifuggesztesek/$noticeId" params={{ noticeId: n.id }}>
                        <Calculator className="h-4 w-4 mr-1" /> Ranghely
                      </Link>
                    </Button>
                    {n.original_detail_url ? (
                      <Button asChild size="sm" variant="ghost">
                        <a href={n.original_detail_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" /> Szerződés megtekintése
                        </a>
                      </Button>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right text-sm whitespace-nowrap">
                    {n.publication_date ? formatDate(n.publication_date) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!q.isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Nincs találat.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
    </PageShell>
  );
}

function SubscribeBanner({ settlements }: { settlements: string[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [settlement, setSettlement] = useState<string>("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const sub = useServerFn(subscribeToSettlement);

  const options = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const base = f ? settlements.filter((s) => s.toLowerCase().includes(f)) : settlements;
    return base.slice(0, 50);
  }, [settlements, filter]);

  async function submit() {
    if (!email || !settlement) {
      toast.error("Add meg az email címet és válassz települést.");
      return;
    }
    setLoading(true);
    try {
      const res = await sub({ data: { email, settlement } });
      if (res.ok) {
        toast.success(
          res.reactivated
            ? "Előfizetésed megújítva 52 hétre."
            : `Sikeres feliratkozás: ${res.settlement_clean}`,
        );
        setOpen(false);
        setEmail("");
        setSettlement("");
      } else {
        toast.error(res.error ?? "Hiba történt.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hiba történt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-5 p-4 md:p-5 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="font-serif text-lg">Heti értesítő emailben</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Válassz települést és minden héten elküldjük az aktuális kifüggesztéseket. 52 hét.{" "}
            <strong>9.990 Ft / év.</strong>
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Feliratkozás</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Heti kifüggesztés értesítő</DialogTitle>
              <DialogDescription>
                52 héten át minden héten emailben megkapod az adott település aktuális termőföld
                kifüggesztéseit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Email cím</label>
                <Input
                  type="email"
                  placeholder="te@email.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Település</label>
                <Input
                  placeholder="Keresés..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mb-2"
                />
                <Select value={settlement} onValueChange={setSettlement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz települést" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground">Nincs találat</div>
                    )}
                    {options.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                A feliratkozással elfogadod a heti értesítő küldését. Bármikor leiratkozhatsz az
                emailben található linkkel.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Mégse
              </Button>
              <Button onClick={submit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Feliratkozom
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
