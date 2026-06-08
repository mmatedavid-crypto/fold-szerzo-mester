import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatHuf } from "@/lib/format";
import { ArrowRight, BarChart3, Database, MapPinned, Search, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/berleti-dij-iranytu")({
  head: () => ({
    meta: [
      { title: "Bérleti díj iránytű — haszonbérleti egységárak | Dr Föld" },
      {
        name: "description",
        content:
          "Településenként gyűjtött, nyilvános hirdetményekből származó haszonbérleti egységárak és statisztikák Dr Földdel.",
      },
      { property: "og:title", content: "Dr Föld — Bérleti díj iránytű" },
      {
        property: "og:description",
        content: "Haszonbérleti hirdetményekből gyűjtött Ft/ha/év statisztikák településenként.",
      },
    ],
  }),
  component: RentCompassPage,
});

type SettlementStat = {
  settlement_clean: string;
  settlement_label: string | null;
  county: string | null;
  municipality: string | null;
  lat: number | null;
  lng: number | null;
  sample_count: number;
  avg_huf_per_ha_year: number | null;
  median_huf_per_ha_year: number | null;
  p25_huf_per_ha_year: number | null;
  p75_huf_per_ha_year: number | null;
  min_huf_per_ha_year: number | null;
  max_huf_per_ha_year: number | null;
  latest_publication_date: string | null;
  latest_observed_at: string | null;
};

type ObservationRow = {
  id: string;
  settlement_clean: string | null;
  publication_date: string | null;
  observed_at: string;
  area_ha: number | null;
  cultivation_branch: string | null;
  rent_raw: string | null;
  rent_huf_per_ha_year: number | null;
  rent_unit: string | null;
  confidence: number;
  extraction_method: string;
  source_attachment_url: string | null;
};

type UntypedQueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type UntypedPostgrestQuery = PromiseLike<UntypedQueryResult> & {
  select: (columns: string) => UntypedPostgrestQuery;
  not: (column: string, operator: string, value: unknown) => UntypedPostgrestQuery;
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean },
  ) => UntypedPostgrestQuery;
  limit: (count: number) => UntypedPostgrestQuery;
};

const untypedSupabase = supabase as unknown as {
  from: (relation: string) => UntypedPostgrestQuery;
};

function RentCompassPage() {
  const [search, setSearch] = useState("");

  const statsQuery = useQuery({
    queryKey: ["rent-observation-settlement-stats"],
    queryFn: async () => {
      const { data, error } = await untypedSupabase
        .from("rent_observation_settlement_stats")
        .select(
          "settlement_clean, settlement_label, county, municipality, lat, lng, sample_count, avg_huf_per_ha_year, median_huf_per_ha_year, p25_huf_per_ha_year, p75_huf_per_ha_year, min_huf_per_ha_year, max_huf_per_ha_year, latest_publication_date, latest_observed_at",
        )
        .order("sample_count", { ascending: false })
        .limit(250);
      if (error) throw error;
      return (data ?? []) as SettlementStat[];
    },
  });

  const observationsQuery = useQuery({
    queryKey: ["rent-observations-latest"],
    queryFn: async () => {
      const { data, error } = await untypedSupabase
        .from("notice_rent_observations")
        .select(
          "id, settlement_clean, publication_date, observed_at, area_ha, cultivation_branch, rent_raw, rent_huf_per_ha_year, rent_unit, confidence, extraction_method, source_attachment_url",
        )
        .not("rent_huf_per_ha_year", "is", null)
        .order("publication_date", { ascending: false, nullsFirst: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as ObservationRow[];
    },
  });

  const stats = useMemo(() => statsQuery.data ?? [], [statsQuery.data]);
  const observations = useMemo(() => observationsQuery.data ?? [], [observationsQuery.data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return stats;
    return stats.filter((row) =>
      [row.settlement_clean, row.settlement_label, row.county, row.municipality]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [search, stats]);

  const topChart = useMemo(
    () =>
      filtered
        .filter((row) => row.median_huf_per_ha_year != null)
        .slice(0, 10)
        .map((row) => ({
          settlement: row.settlement_clean,
          median: row.median_huf_per_ha_year,
          sample: row.sample_count,
        })),
    [filtered],
  );

  const totalSamples = stats.reduce((sum, row) => sum + row.sample_count, 0);
  const latestObserved = stats
    .map((row) => row.latest_observed_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <PageShell>
      <main className="bg-df-cream">
        <section className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr,360px] lg:items-end">
            <div>
              <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
                Haszonbérleti árfigyelő
              </Badge>
              <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-6xl">
                Bérleti díj iránytű
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-df-gray md:text-lg">
                Településenként gyűjtjük a nyilvános haszonbérleti hirdetményekből kinyerhető
                egységárakat. A cél: dátummal követhető, térképre tehető Ft/ha/év statisztika.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-df-green text-white hover:bg-[#173B2A]">
                  <Link to="/kifuggesztesek">
                    Kifüggesztések keresése <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-df-green text-df-green">
                  <Link to="/foldberleti-szerzodes">Szerződés készítése</Link>
                </Button>
              </div>
            </div>

            <Card className="border-df-border bg-df-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-df-green">
                <Database className="h-4 w-4" />
                Adatállapot
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Település" value={String(stats.length)} />
                <Metric label="Árpont" value={String(totalSamples)} />
                <Metric
                  label="Utolsó mérés"
                  value={latestObserved ? formatDate(latestObserved) : "nincs még"}
                />
                <Metric label="Forrás" value="hirdetmény" />
              </div>
              {totalSamples === 0 && (
                <p className="mt-4 rounded-md border border-df-yellow/40 bg-df-yellow/10 p-3 text-xs leading-5 text-df-ink">
                  A live adatbázisban még nincs normalizált Ft/ha/év árpont. A statisztikai réteg
                  készen áll; az első XLSX/PDF import után automatikusan megjelennek az adatok.
                </p>
              )}
            </Card>
          </div>
        </section>

        <section className="border-y border-df-border bg-df-card">
          <div className="container mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-3">
            <TrustItem
              icon={<BarChart3 className="h-5 w-5" />}
              title="Medián alapú"
              text="Nem egyetlen szélsőséges hirdetmény viszi el az irányt."
            />
            <TrustItem
              icon={<MapPinned className="h-5 w-5" />}
              title="Térképre készítve"
              text="Településenként, dátummal és mintaszámmal gyűjtjük."
            />
            <TrustItem
              icon={<TrendingUp className="h-5 w-5" />}
              title="Nem értékbecslés"
              text="Tájékoztató iránytű, nem hatósági vagy szakértői ármegállapítás."
            />
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <Card className="border-df-border bg-df-card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-df-green">
                    Települési rangsor
                  </h2>
                  <p className="text-sm text-df-gray">Medián haszonbérleti díj, Ft/ha/év.</p>
                </div>
                <div className="relative md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-df-gray" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Település keresése..."
                    className="border-df-border bg-white pl-9"
                  />
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Település</TableHead>
                      <TableHead className="text-right">Medián</TableHead>
                      <TableHead className="text-right">Sáv</TableHead>
                      <TableHead className="text-right">Minta</TableHead>
                      <TableHead className="text-right">Frissítés</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 30).map((row) => (
                      <TableRow key={row.settlement_clean}>
                        <TableCell className="font-medium">{row.settlement_clean}</TableCell>
                        <TableCell className="text-right">
                          {formatMaybeHuf(row.median_huf_per_ha_year)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-df-gray">
                          {formatRange(row.p25_huf_per_ha_year, row.p75_huf_per_ha_year)}
                        </TableCell>
                        <TableCell className="text-right">{row.sample_count}</TableCell>
                        <TableCell className="text-right text-xs text-df-gray">
                          {row.latest_publication_date
                            ? formatDate(row.latest_publication_date)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!statsQuery.isLoading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-df-gray">
                          Még nincs megjeleníthető árstatisztika.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="border-df-border bg-df-card p-5">
              <h2 className="font-brand text-2xl font-bold text-df-green">Térképes előnézet</h2>
              <p className="mt-1 text-sm text-df-gray">
                A buborékok a későbbi térképréteg adatpontjait jelzik. Koordináta-dúsítás után
                ugyanez MapLibre térképre köthető.
              </p>

              <div className="relative mt-5 min-h-[280px] overflow-hidden rounded-md border border-df-border bg-[radial-gradient(circle_at_20%_20%,rgba(201,164,75,0.18),transparent_28%),linear-gradient(135deg,#FAF6EF,#E9DDC9)] p-4">
                {filtered.length > 0 ? (
                  filtered
                    .slice(0, 18)
                    .map((row, index) => (
                      <MapBubble key={row.settlement_clean} row={row} index={index} />
                    ))
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-center text-sm text-df-gray">
                    Amint érkezik normalizált egységár, itt jelennek meg a települési pontok.
                  </div>
                )}
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-df-green">Top mediánok</h3>
                <ChartContainer
                  config={{ median: { label: "Medián Ft/ha/év", color: "#1F4D37" } }}
                  className="mt-3 h-[240px] w-full"
                >
                  <BarChart data={topChart}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="settlement" tickLine={false} axisLine={false} hide />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${Math.round(Number(value) / 1000)}e`}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="median" fill="var(--color-median)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </Card>
          </div>

          <Card className="mt-6 border-df-border bg-df-card p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-brand text-2xl font-bold text-df-green">Legutóbbi árpontok</h2>
                <p className="text-sm text-df-gray">
                  Dátummal gyűjtött megfigyelések a statisztikai táblából.
                </p>
              </div>
              <Badge variant="outline" className="w-fit border-df-red text-df-red">
                Tájékoztató adat, nem értékbecslés
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {observations.map((row) => (
                <ObservationCard key={row.id} row={row} />
              ))}
              {!observationsQuery.isLoading && observations.length === 0 && (
                <div className="rounded-md border border-dashed border-df-border p-5 text-sm text-df-gray md:col-span-2 xl:col-span-3">
                  Még nincs árpont. A következő lépés a hirdetmény csatolmányokból/PDF-ekből történő
                  automatikus díjkinyerés batch folyamatának bekötése.
                </div>
              )}
            </div>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-df-border bg-white/70 p-3">
      <div className="text-xs text-df-gray">{label}</div>
      <div className="mt-1 font-brand text-xl font-bold text-df-green">{value}</div>
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 text-df-green">{icon}</div>
      <div>
        <div className="font-semibold text-df-ink">{title}</div>
        <p className="text-sm text-df-gray">{text}</p>
      </div>
    </div>
  );
}

function MapBubble({ row, index }: { row: SettlementStat; index: number }) {
  const x = 12 + ((index * 23) % 74);
  const y = 18 + ((index * 37) % 64);
  const value = row.median_huf_per_ha_year ?? row.avg_huf_per_ha_year ?? 0;
  const size = Math.max(42, Math.min(92, 38 + row.sample_count * 8));

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-df-yellow bg-df-green text-center text-[10px] font-semibold leading-tight text-df-card shadow-lg"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      title={`${row.settlement_clean}: ${formatMaybeHuf(value)}`}
    >
      <span className="px-1">{row.settlement_clean}</span>
    </div>
  );
}

function ObservationCard({ row }: { row: ObservationRow }) {
  return (
    <div className="rounded-md border border-df-border bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-df-green">{row.settlement_clean ?? "Ismeretlen"}</div>
          <div className="text-xs text-df-gray">
            {row.publication_date ? formatDate(row.publication_date) : "dátum nélkül"}
          </div>
        </div>
        <Badge variant="outline" className="border-df-yellow text-df-green">
          {Math.round(row.confidence * 100)}%
        </Badge>
      </div>
      <div className="mt-3 font-brand text-2xl font-bold text-df-ink">
        {formatMaybeHuf(row.rent_huf_per_ha_year)}
      </div>
      <div className="mt-1 text-xs text-df-gray">Ft/ha/év normalizált egységár</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-df-gray">Terület</span>
          <div className="font-medium">{row.area_ha ? `${row.area_ha} ha` : "—"}</div>
        </div>
        <div>
          <span className="text-df-gray">Művelési ág</span>
          <div className="font-medium">{row.cultivation_branch ?? "—"}</div>
        </div>
      </div>
      {row.rent_raw && <p className="mt-3 line-clamp-2 text-xs text-df-gray">{row.rent_raw}</p>}
    </div>
  );
}

function formatMaybeHuf(value: number | null | undefined): string {
  return value == null ? "—" : `${formatHuf(value)} / ha / év`;
}

function formatRange(min: number | null, max: number | null): string {
  if (min == null || max == null) return "—";
  return `${formatShortHuf(min)}–${formatShortHuf(max)}`;
}

function formatShortHuf(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}e Ft`;
  return formatHuf(value);
}
