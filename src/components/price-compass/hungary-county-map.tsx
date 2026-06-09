import { useMemo, useState, useRef, useId } from "react";
import countiesData from "@/data/hungary-counties.json";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

type CountyDatum = { name: string; d: string; c: [number, number] };
type MapData = { width: number; height: number; counties: CountyDatum[] };
const MAP = countiesData as MapData;

// Map alternative DB names to GeoJSON canonical names.
const NAME_ALIASES: Record<string, string> = {
  "Csongrád-Csanád": "Csongrád",
};

function canonicalName(name: string): string {
  return NAME_ALIASES[name] ?? name;
}

function shortLabel(name: string): string {
  if (name === "Budapest") return "BP";
  if (name === "Győr-Moson-Sopron") return "Győr-M-S";
  if (name === "Borsod-Abaúj-Zemplén") return "Borsod-A-Z";
  if (name === "Szabolcs-Szatmár-Bereg") return "Szabolcs-Sz-B";
  if (name === "Jász-Nagykun-Szolnok") return "JNK-Szolnok";
  if (name === "Komárom-Esztergom") return "Komárom-E";
  if (name === "Hajdú-Bihar") return "Hajdú-B";
  if (name === "Csongrád-Csanád" || name === "Csongrád") return "Csongrád-Cs";
  if (name === "Bács-Kiskun") return "Bács-K";
  return name;
}

export type CountyValue = {
  name: string;
  avg: number | null;
  samples: number;
  median?: number | null;
  unit: string;
  formatted: string;
};

export type HungaryCountyMapProps = {
  values: CountyValue[];
  unit: string;
  formatLegendValue: (value: number) => string;
  lowSampleThreshold?: number;
  emptyHint?: string;
};

const LOW_SAMPLE_DEFAULT = 3;

/** Dr Föld choropleth scale: cream → forest green. */
const SCALE_STOPS = [
  { t: 0, c: "#F1E9D1" },
  { t: 0.2, c: "#D7DEB3" },
  { t: 0.45, c: "#A8C189" },
  { t: 0.7, c: "#5F8C5E" },
  { t: 1, c: "#1F4D37" },
];

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ] as [number, number, number];
}
function rgbToHex([r, g, b]: [number, number, number]) {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(Math.round(r))}${h(Math.round(g))}${h(Math.round(b))}`;
}
function scaleColor(t: number): string {
  if (!Number.isFinite(t)) return SCALE_STOPS[0].c;
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < SCALE_STOPS.length; i++) {
    const a = SCALE_STOPS[i - 1];
    const b = SCALE_STOPS[i];
    if (x <= b.t) {
      const k = (x - a.t) / (b.t - a.t);
      const ca = hexToRgb(a.c);
      const cb = hexToRgb(b.c);
      return rgbToHex([
        ca[0] + (cb[0] - ca[0]) * k,
        ca[1] + (cb[1] - ca[1]) * k,
        ca[2] + (cb[2] - ca[2]) * k,
      ]);
    }
  }
  return SCALE_STOPS[SCALE_STOPS.length - 1].c;
}

export function HungaryCountyMap({
  values,
  unit,
  formatLegendValue,
  lowSampleThreshold = LOW_SAMPLE_DEFAULT,
  emptyHint,
}: HungaryCountyMapProps) {
  const valueByCanonical = useMemo(() => {
    const m = new Map<string, CountyValue>();
    for (const v of values) m.set(canonicalName(v.name), v);
    return m;
  }, [values]);

  const max = useMemo(
    () => Math.max(0, ...values.map((v) => v.avg ?? 0)),
    [values],
  );

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const patternId = useId();
  const isMobile = useIsMobile();

  const hoveredValue = hovered ? valueByCanonical.get(canonicalName(hovered)) : null;

  const sorted = useMemo(() => {
    return [...values].sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  }, [values]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-df-border/70 bg-gradient-to-b from-white to-df-cream/60 p-3 shadow-[0_1px_0_rgba(20,40,30,0.04),0_8px_30px_-12px_rgba(20,40,30,0.18)] sm:p-5">
        <svg
          viewBox={`0 0 ${MAP.width} ${MAP.height}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Magyarország megyei térkép"
          onMouseMove={(e) => {
            const rect = wrapRef.current?.getBoundingClientRect();
            if (!rect) return;
            setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          onMouseLeave={() => {
            setHovered(null);
            setMouse(null);
          }}
        >
          <defs>
            <pattern
              id={`${patternId}-nodata`}
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="#F6F1E4" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#E1D9C0" strokeWidth="1.2" />
            </pattern>
            <filter id={`${patternId}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow
                dx="0"
                dy="1.2"
                stdDeviation="1.2"
                floodColor="#1F4D37"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          {MAP.counties.map((county) => {
            const isBudapest = county.name === "Budapest";
            const v = valueByCanonical.get(canonicalName(county.name));
            const hasData = v && v.avg != null && v.samples > 0;
            const low = hasData && v!.samples < lowSampleThreshold;
            const t = hasData && max > 0 ? (v!.avg as number) / max : 0;
            const baseFill = hasData ? scaleColor(t) : `url(#${patternId}-nodata)`;
            const isHover = hovered === county.name;
            const isSel = selected === county.name;
            return (
              <g
                key={county.name}
                onMouseEnter={() => setHovered(county.name)}
                onClick={() =>
                  setSelected((prev) => (prev === county.name ? null : county.name))
                }
                style={{ cursor: "pointer" }}
              >
                <path
                  d={county.d}
                  fill={baseFill}
                  stroke={isSel ? "#1F4D37" : isHover ? "#2F6B4A" : "#ffffff"}
                  strokeWidth={isSel ? 2.2 : isHover ? 1.8 : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{
                    transition: "fill 200ms ease, stroke 150ms ease",
                    filter:
                      isHover || isSel ? `url(#${patternId}-shadow)` : undefined,
                  }}
                  opacity={isBudapest ? 0.95 : 1}
                >
                  <title>
                    {`${county.name}: ${v?.formatted ?? "nincs adat"}${
                      v ? ` · ${v.samples} minta` : ""
                    }${low ? " · kevés adat" : ""}`}
                  </title>
                </path>
                {low && (
                  <circle
                    cx={county.c[0]}
                    cy={county.c[1] - 8}
                    r={2.2}
                    fill="#C9A44B"
                    opacity="0.9"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {/* Desktop county label only */}
                {!isMobile && (
                <text
                  x={county.c[0]}
                  y={county.c[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={t > 0.55 ? "#FFFFFF" : "#1F2A22"}
                  fontSize={isBudapest ? 8 : 9}
                  fontWeight={600}
                  className="pointer-events-none select-none"
                  style={{ paintOrder: "stroke", stroke: t > 0.55 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.6)", strokeWidth: 0.6 }}
                >
                  {shortLabel(county.name)}
                </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredValue && hovered && mouse && (
          <div
            className="pointer-events-none absolute z-10 min-w-[180px] -translate-x-1/2 -translate-y-full rounded-lg border border-df-border bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
            style={{ left: mouse.x, top: mouse.y - 10 }}
          >
            <div className="font-semibold text-df-green">{hovered}</div>
            <div className="mt-0.5 font-brand text-base font-bold text-df-ink">
              {hoveredValue.formatted}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-df-gray">
              {unit} · {hoveredValue.samples} minta
              {hoveredValue.samples < lowSampleThreshold ? " · kevés adat" : ""}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <div
              className="h-2.5 w-44 rounded-full"
              style={{
                background: `linear-gradient(to right, ${SCALE_STOPS.map(
                  (s) => `${s.c} ${Math.round(s.t * 100)}%`,
                ).join(", ")})`,
              }}
            />
            <div className="text-[11px] text-df-gray">
              <span className="mr-3">alacsony</span>
              <span>magas</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-df-gray">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-df-border"
              style={{ background: `url(#${patternId}-nodata) #F6F1E4` }}
            />
            nincs adat
          </div>
          <div className="flex items-center gap-2 text-[11px] text-df-gray">
            <span className="inline-block h-2 w-2 rounded-full bg-[#C9A44B]" />
            kevés adat (&lt; {lowSampleThreshold} minta)
          </div>
          <div className="ml-auto text-[11px] text-df-gray">
            Egység: <span className="font-medium text-df-ink">{unit}</span>
          </div>
        </div>
      </div>

      {/* Selected detail */}
      {selected && (() => {
        const v = valueByCanonical.get(canonicalName(selected));
        return (
          <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-df-border bg-white p-3 shadow-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-df-gray">
                Kiválasztott vármegye
              </div>
              <div className="mt-0.5 font-brand text-lg font-bold text-df-green">
                {selected}
              </div>
              <div className="mt-1 font-brand text-2xl font-bold text-df-ink">
                {v?.formatted ?? "nincs adat"}
              </div>
              <div className="text-[11px] text-df-gray">
                {unit} · {v?.samples ?? 0} minta
                {v && v.samples < lowSampleThreshold ? " · kevés adat" : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-df-gray hover:text-df-green"
            >
              Bezárás
            </button>
          </div>
        );
      })()}

      {/* Mobile-friendly sorted list (also useful on desktop as scannable view) */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-df-gray">
            Vármegyei rangsor
          </div>
          {emptyHint && sorted.every((s) => s.avg == null) && (
            <Badge variant="outline" className="border-df-yellow text-df-green">
              {emptyHint}
            </Badge>
          )}
        </div>
        <ul className="divide-y divide-df-border/70 overflow-hidden rounded-xl border border-df-border bg-white">
          {sorted.length === 0 && (
            <li className="p-3 text-sm text-df-gray">Még nincs adat.</li>
          )}
          {sorted.map((row) => {
            const t = max > 0 && row.avg ? row.avg / max : 0;
            const low = row.samples > 0 && row.samples < lowSampleThreshold;
            const has = row.avg != null && row.samples > 0;
            return (
              <li
                key={row.name}
                onClick={() =>
                  setSelected((prev) => (prev === row.name ? null : row.name))
                }
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-df-cream/60 ${
                  selected === row.name ? "bg-df-cream/80" : ""
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border border-df-border"
                  style={{
                    background: has ? scaleColor(t) : "repeating-linear-gradient(45deg,#F6F1E4 0 4px,#E1D9C0 4px 5px)",
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-df-ink">
                  {row.name}
                  {low && (
                    <span className="ml-2 align-middle text-[10px] font-normal text-df-gray">
                      kevés adat
                    </span>
                  )}
                </span>
                <span className="font-brand text-sm font-bold text-df-green">
                  {has ? formatLegendValue(row.avg as number) : "—"}
                </span>
                <span className="w-14 text-right text-[11px] text-df-gray">
                  {row.samples} minta
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default HungaryCountyMap;