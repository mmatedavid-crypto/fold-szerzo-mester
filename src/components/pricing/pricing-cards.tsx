import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatHuf } from "@/lib/format";
import type { Plan } from "@/lib/plans.functions";

const featuresBySlug: Record<string, string[]> = {
  single: [
    "1 végleges PDF szerződéscsomag",
    "Kockázati ellenőrzőlista",
    "Jegyzői beadási lista",
    "Dokumentumazonosító",
  ],
  gazda: [
    "Éves 50 szerződéses keret",
    "Korábbi dokumentumok kezelése",
    "Gyors duplikálás új szerződésként",
    "Települési hirdetményfigyelő",
    "Piaci díj-összehasonlítás",
  ],
  pro: [
    "Éves 150 szerződéses keret",
    "Nagyobb gazdaságoknak",
    "Dokumentumarchívum",
    "Hirdetményi árfigyelő",
    "Prioritásos support jelölés",
  ],
};

const ctaBySlug: Record<string, string> = {
  single: "Egy szerződést kérek",
  gazda: "Gazda csomagot kérek",
  pro: "Pro csomagot kérek",
};

export function PricingCards({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((p) => {
        const isPopular = p.slug === "gazda";
        return (
          <Card
            key={p.id}
            className={`flex flex-col border-df-border bg-df-card p-6 shadow-sm ${
              isPopular ? "border-df-green shadow-[0_18px_45px_rgba(31,77,55,0.16)]" : ""
            }`}
          >
            {isPopular && (
              <div className="mb-3 w-fit rounded-full border border-df-yellow bg-df-yellow/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-df-green">
                Legnépszerűbb
              </div>
            )}
            <h3 className="font-brand text-2xl font-bold text-df-green">{p.name}</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-brand text-4xl font-bold text-df-ink">
                {formatHuf(p.monthly_price_huf)}
              </span>
              {p.slug !== "single" && <span className="text-sm text-df-gray">/ hó</span>}
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-df-gray">
              {p.price_label}
            </p>
            <p className="mt-3 text-sm leading-6 text-df-gray">{p.description}</p>
            <div className="mt-4 rounded-md border border-df-border bg-df-cream/60 p-3 text-sm text-df-ink">
              {p.annual_quota === 1
                ? "1 dokumentumcsomag"
                : `${p.annual_quota} dokumentum / év keret`}
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-df-ink">
              {(featuresBySlug[p.slug] ?? []).map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-df-green" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className={
                isPopular
                  ? "mt-6 bg-df-green text-white hover:bg-[#173B2A]"
                  : "mt-6 border-df-green text-df-green"
              }
              variant={isPopular ? "default" : "outline"}
            >
              <Link to="/szerzodes/uj">
                {ctaBySlug[p.slug] ?? "Választom"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
