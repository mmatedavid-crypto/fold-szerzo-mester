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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  AlertTriangle,
  ExternalLink,
  Search,
  Calculator,
  Mail,
  Loader2,
  SearchX,
} from "lucide-react";
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-df-gray">
          <span>{q.isLoading ? "Kifüggesztések betöltése..." : `${filtered.length} találat`}</span>
          {!q.isLoading && !q.isError && filtered.length > 0 && (
            <span className="normal-case tracking-normal text-df-green">
              Kifüggesztést láttál? Nézd meg, van-e benne lehetőség.
            </span>
          )}
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
                    <Button asChild size="sm" className="bg-df-green text-white hover:bg-[#173B2A]">
                      <Link to="/kifuggesztesek/$noticeId" params={{ noticeId: n.id }}>
                        <Calculator className="h-4 w-4 mr-1" /> Ranghely
                      </Link>
                    </Button>
                    {n.original_detail_url ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="ml-1 border-df-green text-df-green"
                      >
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
                  <TableCell colSpan={5} className="py-10">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-md border border-df-border bg-df-cream text-df-green">
                        {q.isError ? (
                          <AlertTriangle className="h-5 w-5 text-df-red" />
                        ) : (
                          <SearchX className="h-5 w-5" />
                        )}
                      </span>
                      <div className="mt-3 font-brand text-xl font-bold text-df-green">
                        {q.isError ? "A lista most nem töltött be" : "Nincs ilyen kifüggesztés"}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-df-gray">
                        {q.isError
                          ? "Ez nem jelent üres listát. Próbáld újra, vagy nézz vissza később."
                          : "Próbálj másik települést, helyrajzi számot vagy hirdetménytípust keresni."}
                      </p>
                    </div>
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
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const sub = useServerFn(subscribeToSettlement);

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
    <Card className="mt-5 border-df-border bg-[linear-gradient(135deg,#FFFDF7,#F4E7CF)] p-4 shadow-[0_12px_34px_rgba(26,26,26,0.07)] md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-df-border bg-df-card text-df-green">
              <Mail className="h-4 w-4" />
            </span>
            <h2 className="font-brand text-lg font-bold text-df-green">Heti értesítő e-mailben</h2>
          </div>
          <p className="mt-1 text-sm text-df-gray">
            Válassz települést, és hetente küldjük az aktuális kifüggesztéseket. Kifüggesztésből
            lehetőség. 52 hét. <strong>9.990 Ft / év.</strong>
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-df-green text-white hover:bg-[#173B2A]">Feliratkozás</Button>
          </DialogTrigger>
          <DialogContent className="border-df-border bg-df-card">
            <DialogHeader>
              <DialogTitle className="font-brand text-2xl text-df-green">
                Heti kifüggesztés értesítő
              </DialogTitle>
              <DialogDescription className="leading-6 text-df-gray">
                52 héten át minden héten e-mailben megkapod az adott település aktuális termőföld
                kifüggesztéseit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-df-gray"
                  htmlFor="notice-email"
                >
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
                <label
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-df-gray"
                  htmlFor="settlement-combobox"
                >
                  Település
                </label>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="settlement-combobox"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={pickerOpen}
                      className="w-full justify-between border-df-border bg-white font-normal text-df-ink hover:bg-white"
                    >
                      {settlement || "Kezdd el gépelni a település nevét..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command
                      filter={(value, search) =>
                        value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                      }
                    >
                      <CommandInput placeholder="Település keresése..." />
                      <CommandList>
                        <CommandEmpty>Nincs ilyen település.</CommandEmpty>
                        <CommandGroup>
                          {settlements.map((s) => (
                            <CommandItem
                              key={s}
                              value={s}
                              onSelect={(val) => {
                                setSettlement(val === settlement ? "" : val);
                                setPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  settlement === s ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {s}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="rounded-md border border-df-border bg-df-cream/60 p-3 text-xs leading-5 text-df-gray">
                A feliratkozással elfogadod a heti értesítő küldését. Bármikor leiratkozhatsz az
                e-mailben található linkkel.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-df-green text-df-green"
                onClick={() => setOpen(false)}
              >
                Mégse
              </Button>
              <Button
                className="bg-df-green text-white hover:bg-[#173B2A]"
                onClick={submit}
                disabled={loading}
              >
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
