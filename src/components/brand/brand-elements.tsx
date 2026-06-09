import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  CalendarDays,
  Check,
  FileCheck2,
  FileSignature,
  Lock,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandButton } from "./brand-buttons";

export function BrandBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-df-border bg-df-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-df-green",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StampBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-df-red/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-df-red",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function GoldSeal({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid aspect-square place-items-center rounded-full border border-[#B88F2D] bg-df-yellow text-df-green shadow-sm",
        className,
      )}
      aria-hidden
    >
      <Scale className="h-5 w-5" />
    </div>
  );
}

export function SelectableChip({
  children,
  selected,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors",
        selected
          ? "border-df-green bg-df-green text-df-card"
          : "border-df-border bg-df-card text-df-ink hover:border-df-green",
        className,
      )}
    >
      {children}
      {selected && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

export function HeroResultCard({ className }: { className?: string }) {
  const rows = ["Helyben lakó szomszéd", "Földműves státusz", "Földhasználat", "Igazolható jogcím"];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-df-border bg-df-card shadow-[0_18px_45px_rgba(26,26,26,0.12)]",
        className,
      )}
    >
      <div className="df-dark-card relative p-7 text-df-card">
        <GoldSeal className="absolute right-5 top-4 h-14 w-14" />
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-df-yellow">
          Előzetes eredmény
        </div>
        <div className="mt-3 font-brand text-3xl font-bold leading-tight">TE ÁLLHATSZ ELŐRÉBB</div>
      </div>
      <div className="p-7">
        <p className="text-sm font-semibold text-df-ink">
          Az adatok alapján a rangsorban előrébb állhatsz.
        </p>
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-3 text-sm text-df-ink">
              <span className="grid h-5 w-5 place-items-center rounded-full border border-df-green text-df-green">
                <Check className="h-3 w-3" />
              </span>
              {row}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-end justify-between border-t border-df-border pt-5">
          <span className="text-sm text-df-gray">Becsült rangsor pozíció</span>
          <span className="font-brand text-2xl font-bold text-df-green">2–3. hely</span>
        </div>
      </div>
    </div>
  );
}

export function ServiceCard({
  title,
  text,
  to,
  cta,
  icon,
}: {
  title: string;
  text: string;
  to: string;
  cta: string;
  icon: "rank" | "notice" | "acceptance" | "contract" | "price";
}) {
  const Icon = serviceIconMap[icon];
  return (
    <Link
      to={to}
      className="group flex min-h-[210px] flex-col border border-df-border bg-df-card p-7 transition-colors hover:border-df-green"
    >
      <Icon className="h-10 w-10 text-df-green" strokeWidth={1.7} />
      <h3 className="mt-6 font-brand text-2xl font-bold text-df-green">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-df-ink">{text}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-df-green">
        {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function FeatureCard(props: Parameters<typeof ServiceCard>[0] & { kicker?: string }) {
  return <ServiceCard {...props} />;
}

export function RankPreview() {
  const chips = [
    ["Termőföld", true],
    ["Erdő", false],
    ["Gyep", false],
    ["Kivett terület", false],
    ["Helyben lakó szomszéd", true],
    ["Helyi gazdálkodó", false],
    ["Földműves végzettség", false],
    ["Fiatal gazda", false],
    ["Bio / öko", true],
    ["Állattartó", false],
    ["Integrátor", false],
    ["Egyéb körülmény", false],
  ] as const;

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="grid gap-8 rounded-lg border border-df-border bg-df-card p-6 md:grid-cols-[1fr_360px] md:p-8">
        <div>
          <h2 className="font-brand text-3xl font-bold text-df-ink">
            Ranghely kalkulátor – előnézet
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {chips.map(([label, selected]) => (
              <SelectableChip key={label} selected={selected}>
                {label}
              </SelectableChip>
            ))}
          </div>
        </div>
        <div className="df-dark-card rounded-lg p-7 text-df-card">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-df-yellow">
            Előzetes eredmény
          </div>
          <div className="mt-4 font-brand text-2xl font-bold">Nagy eséllyel előrébb állsz.</div>
          <div className="mt-5 text-sm text-df-cream">Becsült rangsor pozíció</div>
          <div className="mt-1 font-brand text-4xl font-bold text-df-yellow">2–3. hely</div>
          <BrandButton asChild variant="secondary" className="mt-7 w-full bg-df-card">
            <Link to="/ranghely-kalkulator">
              Teljes kalkulátor megnyitása <ArrowRight className="h-4 w-4" />
            </Link>
          </BrandButton>
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  const items = [
    {
      icon: ShieldCheck,
      text: "Jogszabályok alapján és folyamatosan frissítve.",
    },
    {
      icon: Lock,
      text: "Az adataid biztonságban vannak. Nem adjuk tovább harmadik félnek.",
    },
    {
      icon: UserCheck,
      text: "Ügyvédi szakértelem a földügyek mögött.",
    },
  ];

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="relative grid gap-5 rounded-lg border border-df-border bg-df-card p-6 md:grid-cols-3">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-4 text-sm text-df-ink">
            <Icon className="h-8 w-8 shrink-0 text-df-green" strokeWidth={1.6} />
            {text}
          </div>
        ))}
        <StampBadge className="md:absolute md:-right-4 md:-bottom-4 bg-df-card">
          Jogszerű megoldások
        </StampBadge>
      </div>
    </section>
  );
}

export function NoticeBoardIcon({ className }: { className?: string }) {
  return <Search className={cn("h-10 w-10 text-df-green", className)} strokeWidth={1.7} />;
}

export function RankBarsIcon({ className }: { className?: string }) {
  return <Calculator className={cn("h-10 w-10 text-df-green", className)} strokeWidth={1.7} />;
}

export function DeadlineAlert({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-df-red bg-df-card px-3 py-2 text-sm font-semibold text-df-red",
        className,
      )}
    >
      <CalendarDays className="h-4 w-4" />A határidő jogvesztő.
    </div>
  );
}

const serviceIconMap = {
  rank: Calculator,
  notice: Search,
  acceptance: FileCheck2,
  contract: FileSignature,
  price: TrendingUp,
};
