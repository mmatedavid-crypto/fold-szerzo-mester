import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  FileCheck2,
  FileSignature,
  Handshake,
  MapPinned,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border-2 border-df-green bg-df-yellow px-3 py-1 font-brand text-xs font-black uppercase tracking-wide text-df-ink shadow-[2px_2px_0_var(--df-border)]",
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
        "inline-flex -rotate-2 items-center rounded-sm border-2 border-df-red px-3 py-1 font-brand text-xs font-black uppercase tracking-wide text-df-red",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RankBarsIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-16 items-end gap-1.5", className)} aria-hidden>
      <div className="grid h-8 w-7 place-items-center rounded-sm border-2 border-df-green bg-df-gray font-brand text-sm font-black text-df-card">
        2
      </div>
      <div className="relative grid h-14 w-9 place-items-center rounded-sm border-2 border-df-green bg-df-yellow font-brand text-2xl font-black text-df-green">
        1
        <span className="absolute -top-3 left-1/2 h-2 w-1 -translate-x-1/2 rounded-full bg-df-red" />
        <span className="absolute -top-1 -left-2 h-1.5 w-1 rotate-[-35deg] rounded-full bg-df-red" />
        <span className="absolute -top-1 -right-2 h-1.5 w-1 rotate-[35deg] rounded-full bg-df-red" />
      </div>
      <div className="grid h-7 w-7 place-items-center rounded-sm border-2 border-df-green bg-df-card font-brand text-sm font-black text-df-green">
        3
      </div>
    </div>
  );
}

export function NoticeBoardIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-16 w-16", className)} aria-hidden>
      <div className="absolute left-1 top-0 h-3 w-14 rounded-sm bg-df-green" />
      <div className="absolute left-3 top-3 h-11 w-10 rounded-sm border-2 border-df-green bg-df-card shadow-[2px_2px_0_var(--df-border)]">
        <div className="mx-2 mt-2 h-1.5 rounded-full bg-df-red" />
        <div className="mx-2 mt-2 h-1.5 rounded-full bg-df-green" />
        <div className="mx-2 mt-2 h-1.5 rounded-full bg-df-border" />
      </div>
      <div className="absolute bottom-0 left-4 h-4 w-1.5 rounded-sm bg-df-green" />
      <div className="absolute bottom-0 right-4 h-4 w-1.5 rounded-sm bg-df-green" />
    </div>
  );
}

export function DeadlineAlert({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border-2 border-df-red bg-df-card px-3 py-2 text-sm font-bold text-df-red",
        className,
      )}
    >
      <AlertTriangle className="h-4 w-4" />A határidő jogvesztő.
    </div>
  );
}

export function FeatureCard({
  title,
  kicker,
  text,
  to,
  cta,
  icon,
}: {
  title: string;
  kicker: string;
  text: string;
  to: string;
  cta: string;
  icon: "notice" | "rank" | "acceptance" | "contract" | "deadline" | "lawyer";
}) {
  const Icon = iconMap[icon];
  return (
    <Link
      to={to}
      className="group flex min-h-[220px] flex-col rounded-lg border-2 border-df-border bg-df-card p-5 shadow-[4px_4px_0_var(--df-border)] transition-transform hover:-translate-y-0.5 hover:border-df-green"
    >
      <div className="flex items-start justify-between gap-3">
        {icon === "notice" ? (
          <NoticeBoardIcon />
        ) : icon === "rank" ? (
          <RankBarsIcon />
        ) : (
          <Icon className="h-10 w-10 text-df-green" />
        )}
        <span className="rounded-sm bg-df-cream px-2 py-1 font-brand text-[11px] font-black uppercase text-df-green">
          {kicker}
        </span>
      </div>
      <h3 className="mt-5 font-brand text-xl font-black text-df-green">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-df-gray">{text}</p>
      <span className="mt-4 inline-flex font-bold text-df-green group-hover:underline">{cta}</span>
    </Link>
  );
}

const iconMap = {
  notice: MapPinned,
  rank: Check,
  acceptance: FileCheck2,
  contract: FileSignature,
  deadline: CalendarClock,
  lawyer: Handshake,
  sale: PenLine,
};
