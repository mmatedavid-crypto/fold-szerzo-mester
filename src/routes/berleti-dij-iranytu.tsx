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
      { title: "Ár iránytű — bérleti díjak és földárak | Dr Föld" },
      {
        name: "description",
        content:
          "Megyei hőtérkép és statisztika nyilvános haszonbérleti és adás-vételi hirdetményekből származó földár adatokhoz.",
      },
      { property: "og:title", content: "Dr Föld — Ár iránytű" },
      {
        property: "og:description",
        content:
          "Haszonbérleti díjak és földárak megyei hőtérképen, nyilvános hirdetményekből gyűjtve.",
      },
    ],
  }),
  component: PriceCompassPage,
});

type CompassMode = "rent" | "sale";

type CountyStat = {
  county_name: string;
  sample_count: number;
  avg_value: number | null;
  median_value: number | null;
  p25_value: number | null;
  p75_value: number | null;
  min_value: number | null;
  max_value: number | null;
  latest_publication_date: string | null;
  latest_observed_at: string | null;
};

type RawRentCountyStat = {
  county_name: string;
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

type RawSaleCountyStat = {
  county_name: string;
  sample_count: number;
  avg_huf_per_ha: number | null;
  median_huf_per_ha: number | null;
  p25_huf_per_ha: number | null;
  p75_huf_per_ha: number | null;
  min_huf_per_ha: number | null;
  max_huf_per_ha: number | null;
  latest_publication_date: string | null;
  latest_observed_at: string | null;
};

type ObservationRow = {
  id: string;
  county: string | null;
  settlement_clean: string | null;
  publication_date: string | null;
  observed_at: string;
  area_ha: number | null;
  cultivation_branch: string | null;
  value: number | null;
  raw: string | null;
  confidence: number;
  extraction_method: string;
};

type UntypedQueryResult = {
  data: unknown;
  error: { message?: string; code?: string } | null;
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

const MODE_COPY: Record<
  CompassMode,
  {
    label: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    unit: string;
    empty: string;
    nextStep: string;
    chartLabel: string;
    tableTitle: string;
  }
> = {
  rent: {
    label: "Bérleti díj",
    eyebrow: "Haszonbérleti árfigyelő",
    title: "Bérleti díj iránytű",
    subtitle:
      "Megyénként gyűjtjük a nyilvános haszonbérleti hirdetményekből kinyerhető Ft/ha/év egységárakat.",
    unit: "Ft / ha / év",
    empty:
      "Még nincs normalizált bérleti díj árpont. XLSX/PDF csatolmány-feldolgozás után automatikusan megjelennek a megyei értékek.",
    nextStep: "A következő lépés a haszonbérleti szerződés-csatolmányok díjkinyerése.",
    chartLabel: "Medián Ft/ha/év",
    tableTitle: "Megyei bérleti díjak",
  },
  sale: {
    label: "Földár",
    eyebrow: "Adás-vételi árfigyelő",
    title: "Földár iránytű",
    subtitle: "Megyénként gyűjtjük az adás-vételi kifüggesztésekből kinyerhető Ft/ha földárakat.",
    unit: "Ft / ha",
    empty:
      "Még nincs normalizált földár árpont. Az adás-vételi PDF/XLSX csatolmányokból a vételár és terület kinyerése lesz a következő adatlépés.",
    nextStep: "A következő lépés az adás-vételi csatolmányok vételár- és területkinyerése.",
    chartLabel: "Medián Ft/ha",
    tableTitle: "Megyei földárak",
  },
};

const COUNTY_LAYOUT = [
  { name: "Győr-Moson-Sopron", x: 0, y: 1 },
  { name: "Vas", x: 0, y: 2 },
  { name: "Zala", x: 0, y: 3 },
  { name: "Veszprém", x: 1, y: 2 },
  { name: "Komárom-Esztergom", x: 2, y: 1 },
  { name: "Fejér", x: 2, y: 2 },
  { name: "Somogy", x: 1, y: 4 },
  { name: "Tolna", x: 2, y: 4 },
  { name: "Baranya", x: 2, y: 5 },
  { name: "Pest", x: 3, y: 2 },
  { name: "Nógrád", x: 3, y: 0 },
  { name: "Heves", x: 4, y: 1 },
  { name: "Jász-Nagykun-Szolnok", x: 4, y: 3 },
  { name: "Bács-Kiskun", x: 3, y: 4 },
  { name: "Csongrád-Csanád", x: 4, y: 5 },
  { name: "Borsod-Abaúj-Zemplén", x: 5, y: 0 },
  { name: "Hajdú-Bihar", x: 6, y: 2 },
  { name: "Szabolcs-Szatmár-Bereg", x: 7, y: 1 },
  { name: "Békés", x: 6, y: 5 },
];

function PriceCompassPage() {
  const [mode, setMode] = useState<CompassMode>("rent");
  const [search, setSearch] = useState("");
  const copy = MODE_COPY[mode];

  const rentCountyQuery = useQuery({
    queryKey: ["rent-observation-county-stats"],
    queryFn: async () => {
      const { data, error } = await untypedSupabase
        .from("rent_observation_county_stats")
        .select(
          "county_name, sample_count, avg_huf_per_ha_year, median_huf_per_ha_year, p25_huf_per_ha_year, p75_huf_per_ha_year, min_huf_per_ha_year, max_huf_per_ha_year, latest_publication_date, latest_observed_at",
        )
        .order("sample_count", { ascending: false })
        .limit(100);
      if (error) throw error;
      return ((data ?? []) as RawRentCountyStat[]).map(mapRentCountyStat);
    },
  });

  const saleCountyQuery = useQuery({
    queryKey: ["sale-price-county-stats"],
    queryFn: async () => {
      const { data, error } = await untypedSupabase
        .from("sale_price_county_stats")
        .select(
          "county_name, sample_count, avg_huf_per_ha, median_huf_per_ha, p25_huf_per_ha, p75_huf_per_ha, min_huf_per_ha, max_huf_per_ha, latest_publication_date, latest_observed_at",
        )
        .order("sample_count", { ascending: false })
        .limit(100);
      if (error) throw error;
      return ((data ?? []) as RawSaleCountyStat[]).map(mapSaleCountyStat);
    },
  });

  const rentObservationsQuery = useQuery({
    queryKey: ["rent-observations-latest"],
    queryFn: async () => {
      const { data, error } = await untypedSupabase
        .from("notice_rent_observations")
        .select(
          "id, county, settlement_clean, publication_date, observed_at, area_ha, cultivation_branch, rent_raw, rent_huf_per_ha_year, confidence, extraction_method",
        )
        .not("rent_huf_per_ha_year", "is", null)
        .order("publication_date", { ascending: false, nullsFirst: false })
        .limit(12);
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        county: valueOrNull(row.county),
        settlement_clean: valueOrNull(row.settlement_clean),
        publication_date: valueOrNull(row.publication_date),
        observed_at: String(row.observed_at),
        area_ha: numberOrNull(row.area_ha),
        cultivation_branch: valueOrNull(row.cultivation_branch),
        value: numberOrNull(row.rent_huf_per_ha_year),
        raw: valueOrNull(row.rent_raw),
        confidence: numberOrNull(row.confidence) ?? 0,
        extraction_method: String(row.extraction_method ?? ""),
      }));
    },
  });

  const saleObservationsQuery = useQuery({
    queryKey: ["sale-price-observations-latest"],
    queryFn: async () => {
      const { data, error } = await untypedSupabase
        .from("notice_sale_price_observations")
        .select(
          "id, county, settlement_clean, publication_date, observed_at, area_ha, cultivation_branch, price_raw, price_huf_per_ha, confidence, extraction_method",
        )
        .not("price_huf_per_ha", "is", null)
        .order("publication_date", { ascending: false, nullsFirst: false })
        .limit(12);
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        county: valueOrNull(row.county),
        settlement_clean: valueOrNull(row.settlement_clean),
        publication_date: valueOrNull(row.publication_date),
        observed_at: String(row.observed_at),
        area_ha: numberOrNull(row.area_ha),
        cultivation_branch: valueOrNull(row.cultivation_branch),
        value: numberOrNull(row.price_huf_per_ha),
        raw: valueOrNull(row.price_raw),
        confidence: numberOrNull(row.confidence) ?? 0,
        extraction_method: String(row.extraction_method ?? ""),
      }));
    },
  });

  const activeCountyQuery = mode === "rent" ? rentCountyQuery : saleCountyQuery;
  const activeObservationsQuery = mode === "rent" ? rentObservationsQuery : saleObservationsQuery;
  const stats = useMemo(() => activeCountyQuery.data ?? [], [activeCountyQuery.data]);
  const observations = useMemo(
    () => activeObservationsQuery.data ?? [],
    [activeObservationsQuery.data],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return stats;
    return stats.filter((row) => row.county_name.toLowerCase().includes(needle));
  }, [search, stats]);

  const topChart = useMemo(
    () =>
      filtered
        .filter((row) => row.median_value != null)
        .slice(0, 10)
        .map((row) => ({
          county: row.county_name,
          median: row.median_value,
          sample: row.sample_count,
        })),
    [filtered],
  );

  const maxMedian = Math.max(0, ...stats.map((row) => row.median_value ?? 0));
  const totalSamples = stats.reduce((sum, row) => sum + row.sample_count, 0);
  const latestObserved = stats
    .map((row) => row.latest_observed_at)
    .filter(Boolean)
    .sort()
    .at(-1);
  const dbSetupMissing =
    isMissingRelationError(rentCountyQuery.error) ||
    isMissingRelationError(saleCountyQuery.error) ||
    isMissingRelationError(rentObservationsQuery.error) ||
    isMissingRelationError(saleObservationsQuery.error);

  return (
    <PageShell>
      <main className="bg-df-cream">
        <section className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr,380px] lg:items-end">
            <div>
              <Badge className="border-df-yellow bg-df-yellow/15 text-df-green" variant="outline">
                {copy.eyebrow}
              </Badge>
              <h1 className="mt-4 font-brand text-4xl font-bold leading-tight text-df-green md:text-6xl">
                Ár iránytű
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-df-gray md:text-lg">
                {copy.subtitle} Válts bérleti díj és földár között, és nézd meg, hol rajzolódik ki
                erősebb megyei árszint.
              </p>
              <div className="mt-6 inline-flex rounded-md border border-df-border bg-df-card p-1">
                {(["rent", "sale"] as CompassMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`rounded px-4 py-2 text-sm font-semibold transition ${
                      mode === item ? "bg-df-green text-white" : "text-df-green hover:bg-df-cream"
                    }`}
                  >
                    {MODE_COPY[item].label}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-df-green text-white hover:bg-[#173B2A]">
                  <Link to="/kifuggesztesek">
                    Kifüggesztések keresése <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-df-green text-df-green">
                  <Link to={mode === "rent" ? "/foldberleti-szerzodes" : "/fold-adas-vetel"}>
                    {mode === "rent" ? "Szerződés készítése" : "Adásvétel modul"}
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="border-df-border bg-df-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-df-green">
                <Database className="h-4 w-4" />
                Adatállapot
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Megye" value={String(stats.length)} />
                <Metric label="Árpont" value={String(totalSamples)} />
                <Metric
                  label="Utolsó mérés"
                  value={latestObserved ? formatDate(latestObserved) : "nincs még"}
                />
                <Metric label="Egység" value={copy.unit} />
              </div>
              {dbSetupMissing ? (
                <p className="mt-4 rounded-md border border-df-red/40 bg-df-red/10 p-3 text-xs leading-5 text-df-ink">
                  Az árstatisztikai adatbázis-réteg még nincs aktiválva a live környezetben. A
                  Supabase migration lefuttatása után indulhat az árpontok gyűjtése.
                </p>
              ) : totalSamples === 0 ? (
                <p className="mt-4 rounded-md border border-df-yellow/40 bg-df-yellow/10 p-3 text-xs leading-5 text-df-ink">
                  {copy.empty}
                </p>
              ) : null}
            </Card>
          </div>
        </section>

        <section className="border-y border-df-border bg-df-card">
          <div className="container mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-3">
            <TrustItem
              icon={<BarChart3 className="h-5 w-5" />}
              title="Megyei medián"
              text="Országos térképen nem apró településpontokkal zajosítunk."
            />
            <TrustItem
              icon={<MapPinned className="h-5 w-5" />}
              title="Hőtérkép"
              text="A színintenzitás az adott megye medián árszintjét mutatja."
            />
            <TrustItem
              icon={<TrendingUp className="h-5 w-5" />}
              title="Nem értékbecslés"
              text="Tájékoztató iránytű, nem hatósági vagy szakértői ármegállapítás."
            />
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <Card className="border-df-border bg-df-card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-df-green">{copy.tableTitle}</h2>
                  <p className="text-sm text-df-gray">Medián érték, {copy.unit}.</p>
                </div>
                <div className="relative md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-df-gray" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Megye keresése..."
                    className="border-df-border bg-white pl-9"
                  />
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Megye</TableHead>
                      <TableHead className="text-right">Medián</TableHead>
                      <TableHead className="text-right">Sáv</TableHead>
                      <TableHead className="text-right">Minta</TableHead>
                      <TableHead className="text-right">Frissítés</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 30).map((row) => (
                      <TableRow key={row.county_name}>
                        <TableCell className="font-medium">{row.county_name}</TableCell>
                        <TableCell className="text-right">
                          {formatUnitValue(row.median_value, mode)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-df-gray">
                          {formatRange(row.p25_value, row.p75_value)}
                        </TableCell>
                        <TableCell className="text-right">{row.sample_count}</TableCell>
                        <TableCell className="text-right text-xs text-df-gray">
                          {row.latest_publication_date
                            ? formatDate(row.latest_publication_date)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!activeCountyQuery.isLoading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-df-gray">
                          Még nincs megjeleníthető megyei árstatisztika.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="border-df-border bg-df-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-brand text-2xl font-bold text-df-green">Országos hőtérkép</h2>
                  <p className="mt-1 text-sm text-df-gray">
                    Megyei medián {copy.unit}. Sötétebb zöld: magasabb árszint.
                  </p>
                </div>
                <Badge variant="outline" className="border-df-yellow text-df-green">
                  {copy.label}
                </Badge>
              </div>

              <CountyHeatmap stats={stats} mode={mode} maxMedian={maxMedian} />

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-df-green">Top megyei mediánok</h3>
                <ChartContainer
                  config={{ median: { label: copy.chartLabel, color: "#1F4D37" } }}
                  className="mt-3 h-[240px] w-full"
                >
                  <BarChart data={topChart}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="county" tickLine={false} axisLine={false} hide />
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
                  Dátummal gyűjtött megfigyelések a kiválasztott iránytűhöz.
                </p>
              </div>
              <Badge variant="outline" className="w-fit border-df-red text-df-red">
                Tájékoztató adat, nem értékbecslés
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {observations.map((row) => (
                <ObservationCard key={row.id} row={row} mode={mode} />
              ))}
              {!activeObservationsQuery.isLoading && observations.length === 0 && (
                <div className="rounded-md border border-dashed border-df-border p-5 text-sm text-df-gray md:col-span-2 xl:col-span-3">
                  Még nincs árpont. {copy.nextStep}
                </div>
              )}
            </div>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

function CountyHeatmap({
  stats,
  mode,
  maxMedian,
}: {
  stats: CountyStat[];
  mode: CompassMode;
  maxMedian: number;
}) {
  const byCounty = new Map(stats.map((row) => [row.county_name, row]));

  return (
    <div className="mt-5 overflow-x-auto rounded-md border border-df-border bg-[linear-gradient(135deg,#FAF6EF,#E9DDC9)] p-4">
      <div
        className="grid min-w-[720px] gap-2"
        style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}
      >
        {COUNTY_LAYOUT.map((county) => {
          const row = byCounty.get(county.name);
          const intensity = maxMedian > 0 && row?.median_value ? row.median_value / maxMedian : 0;
          return (
            <div
              key={county.name}
              className="min-h-[74px] rounded-md border p-2 text-left text-xs shadow-sm transition"
              style={{
                gridColumn: county.x + 1,
                gridRow: county.y + 1,
                background: heatColor(intensity),
                borderColor: intensity > 0 ? "#C9A44B" : "#E5D8C3",
                color: intensity > 0.45 ? "#FFFDF7" : "#1A1A1A",
              }}
              title={`${county.name}: ${formatUnitValue(row?.median_value ?? null, mode)}`}
            >
              <div className="font-semibold leading-tight">{county.name}</div>
              <div className="mt-1 text-[11px] opacity-90">
                {row ? formatUnitValue(row.median_value, mode) : "nincs adat"}
              </div>
              {row && <div className="mt-1 text-[10px] opacity-80">{row.sample_count} minta</div>}
            </div>
          );
        })}
      </div>
    </div>
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

function ObservationCard({ row, mode }: { row: ObservationRow; mode: CompassMode }) {
  return (
    <div className="rounded-md border border-df-border bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-df-green">
            {row.county ?? row.settlement_clean ?? "Ismeretlen"}
          </div>
          <div className="text-xs text-df-gray">
            {row.publication_date ? formatDate(row.publication_date) : "dátum nélkül"}
          </div>
        </div>
        <Badge variant="outline" className="border-df-yellow text-df-green">
          {Math.round(row.confidence * 100)}%
        </Badge>
      </div>
      <div className="mt-3 font-brand text-2xl font-bold text-df-ink">
        {formatUnitValue(row.value, mode)}
      </div>
      <div className="mt-1 text-xs text-df-gray">
        {mode === "rent" ? "Ft/ha/év normalizált egységár" : "Ft/ha normalizált földár"}
      </div>
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
      {row.raw && <p className="mt-3 line-clamp-2 text-xs text-df-gray">{row.raw}</p>}
    </div>
  );
}

function mapRentCountyStat(row: RawRentCountyStat): CountyStat {
  return {
    county_name: row.county_name,
    sample_count: row.sample_count,
    avg_value: row.avg_huf_per_ha_year,
    median_value: row.median_huf_per_ha_year,
    p25_value: row.p25_huf_per_ha_year,
    p75_value: row.p75_huf_per_ha_year,
    min_value: row.min_huf_per_ha_year,
    max_value: row.max_huf_per_ha_year,
    latest_publication_date: row.latest_publication_date,
    latest_observed_at: row.latest_observed_at,
  };
}

function mapSaleCountyStat(row: RawSaleCountyStat): CountyStat {
  return {
    county_name: row.county_name,
    sample_count: row.sample_count,
    avg_value: row.avg_huf_per_ha,
    median_value: row.median_huf_per_ha,
    p25_value: row.p25_huf_per_ha,
    p75_value: row.p75_huf_per_ha,
    min_value: row.min_huf_per_ha,
    max_value: row.max_huf_per_ha,
    latest_publication_date: row.latest_publication_date,
    latest_observed_at: row.latest_observed_at,
  };
}

function formatUnitValue(value: number | null | undefined, mode: CompassMode): string {
  if (value == null) return "—";
  return `${formatHuf(value)} / ha${mode === "rent" ? " / év" : ""}`;
}

function formatRange(min: number | null, max: number | null): string {
  if (min == null || max == null) return "—";
  return `${formatShortHuf(min)}–${formatShortHuf(max)}`;
}

function formatShortHuf(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M Ft`;
  if (value >= 1000) return `${Math.round(value / 1000)}e Ft`;
  return formatHuf(value);
}

function heatColor(intensity: number): string {
  if (intensity <= 0) return "#FFFDF7";
  if (intensity < 0.25) return "#DDE8D2";
  if (intensity < 0.5) return "#95B985";
  if (intensity < 0.75) return "#4F8057";
  return "#1F4D37";
}

function valueOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";
  return code === "PGRST205" || /schema cache|relation|does not exist/i.test(message);
}
