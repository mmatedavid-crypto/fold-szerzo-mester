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
import { AlertTriangle, ExternalLink, Search, Calculator, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { cleanSettlement } from "@/lib/notices/clean";
import { subscribeToSettlement } from "@/lib/subscriptions/subscribe.functions";
import { subscriptionErrorMessage } from "@/lib/user-facing-errors";
import { company } from "@/lib/company";
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
    links: [{ rel: "canonical", href: `${company.websiteUrl}/kifuggesztesek` }],
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
      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-3xl">
          <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
            Kifüggesztésből lehetőség
          </Badge>
          <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-5xl">
            Kifüggesztések keresése
          </h1>
          <p className="mt-3 text-base leading-7 text-df-gray">
            Aktuális termőföld kifüggesztések település, helyrajzi szám és típus szerint. A
            részletekért, csatolmányokért és szerződésért nyisd meg a hivatalos hirdetményi oldalt.
          </p>
        </div>

        <SubscribeBanner settlements={settlements} />

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-df-border bg-df-card p-3 text-sm shadow-sm">
          <Calculator className="h-4 w-4 text-df-green" />
          <span className="font-semibold text-df-ink">A magyar gazda nem találgat.</span>
          <span className="text-df-gray">
            — jelöld be, mi igaz rád, és nézd meg, ki áll előrébb a sorban.
          </span>
          <Button asChild size="sm" className="ml-auto bg-df-green text-white hover:bg-[#173B2A]">
            <Link to="/ranghely-kalkulator">Kalkulátor megnyitása</Link>
          </Button>
        </div>

        <Card className="mt-6 border-df-border bg-df-card p-4 shadow-sm">
          <div className="grid items-center gap-3 md:grid-cols-[1fr,220px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-df-gray" />
              <Input
                placeholder="Település, hrsz., azonosító..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-df-border bg-white pl-8"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="border-df-border bg-white">
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

        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-df-gray">
          {q.isLoading ? "Betöltés..." : `${filtered.length} találat`}
        </div>

        {q.isError && (
          <Card className="mt-3 border-df-red/40 bg-df-red/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-df-red" />
                <div>
                  <div className="font-semibold text-df-ink">
                    Most nem tudtuk betölteni a kifüggesztéseket.
                  </div>
                  <p className="mt-1 text-sm text-df-gray">
                    Ez nem jelent üres listát. Próbáld újra, vagy nyisd meg később az oldalt.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-df-red text-df-red hover:bg-df-red/10"
                onClick={() => void q.refetch()}
                disabled={q.isFetching}
              >
                {q.isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Újrapróbálom
              </Button>
            </div>
          </Card>
        )}

        <Card className="mt-3 overflow-x-auto border-df-border bg-df-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-df-cream/60">
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
                    <Badge className="border-df-border text-df-green" variant="outline">
                      {n.notice_type ?? "—"}
                    </Badge>
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
                          <ExternalLink className="h-4 w-4 mr-1" /> Hirdetmény megnyitása
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
                    {q.isError ? "A lista betöltése most nem sikerült." : "Nincs találat."}
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
        toast.error(subscriptionErrorMessage(res.error));
      }
    } catch (e) {
      toast.error(subscriptionErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-5 border-df-border bg-[linear-gradient(135deg,#FFFDF7,#F4E7CF)] p-4 shadow-sm md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-df-green" />
            <h2 className="font-brand text-lg font-bold text-df-green">Heti értesítő e-mailben</h2>
          </div>
          <p className="mt-1 text-sm text-df-gray">
            Válassz települést, és hetente küldjük az aktuális kifüggesztéseket. 52 hét.{" "}
            <strong>9.990 Ft / év.</strong>
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-df-green text-white hover:bg-[#173B2A]">Feliratkozás</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Heti kifüggesztés értesítő</DialogTitle>
              <DialogDescription>
                52 héten át minden héten e-mailben megkapod az adott település aktuális termőföld
                kifüggesztéseit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="notice-email">
                  E-mail cím
                </label>
                <Input
                  id="notice-email"
                  type="email"
                  autoComplete="email"
                  placeholder="te@email.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="settlement-filter">
                  Település
                </label>
                <Input
                  id="settlement-filter"
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
                e-mailben található linkkel.
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
