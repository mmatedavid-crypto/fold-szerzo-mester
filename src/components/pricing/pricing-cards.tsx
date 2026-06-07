import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
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
          <Card key={p.id} className={`p-6 flex flex-col ${isPopular ? "border-primary border-2 shadow-lg" : ""}`}>
            {isPopular && (
              <div className="text-xs font-medium text-primary mb-2">★ Legnépszerűbb</div>
            )}
            <h3 className="font-serif text-2xl">{p.name}</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{formatHuf(p.monthly_price_huf)}</span>
              {p.slug !== "single" && <span className="text-sm text-muted-foreground">/ hó</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{p.price_label}</p>
            <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
            <ul className="mt-4 space-y-2 text-sm flex-1">
              {(featuresBySlug[p.slug] ?? []).map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6" variant={isPopular ? "default" : "outline"}>
              <Link to="/szerzodes/uj" search={{ plan: p.slug }}>{ctaBySlug[p.slug] ?? "Választom"}</Link>
            </Button>
          </Card>
        );
      })}
    </div>
  );
}