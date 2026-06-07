import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { BrandButton } from "@/components/brand/brand-buttons";
import {
  HeroResultCard,
  RankPreview,
  ServiceCard,
  TrustStrip,
} from "@/components/brand/brand-elements";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Dr Föld – ranghely kalkulátor, kifüggesztések és földbérleti szerződés",
      },
      {
        name: "description",
        content:
          "Dr Föld segít gazdáknak és földtulajdonosoknak kifüggesztéseket figyelni, előhaszonbérleti ranghelyet ellenőrizni, elfogadó nyilatkozatot és földbérleti szerződést készíteni.",
      },
      { property: "og:title", content: "Dr Föld – Ravasz a gazda" },
      {
        property: "og:description",
        content:
          "Kifüggesztések, ranghely kalkulátor, elfogadó nyilatkozat és földbérleti szerződés gazdáknak. Nézd meg, hol állsz a sorban.",
      },
      { property: "og:image", content: "https://drfold.hu/og/drfold-og.svg" },
    ],
    links: [{ rel: "canonical", href: "https://drfold.hu/" }],
  }),
  component: Index,
});

const services = [
  {
    icon: "rank" as const,
    title: "Ranghely kalkulátor",
    text: "Ellenőrizd, hogy a szabályok alapján hol állsz a haszonbérleti rangsorban.",
    to: "/ranghely-kalkulator",
    cta: "Számolok most",
  },
  {
    icon: "notice" as const,
    title: "Kifüggesztések",
    text: "Keresd és kövesd a friss kifüggesztéseket egyszerűen.",
    to: "/kifuggesztesek",
    cta: "Keresek kifüggesztést",
  },
  {
    icon: "acceptance" as const,
    title: "Elfogadó nyilatkozat",
    text: "Készíts jogszerű elfogadó nyilatkozatot gyorsan, hibamentesen.",
    to: "/elfogado-nyilatkozat",
    cta: "Nyilatkozatot készítek",
  },
  {
    icon: "contract" as const,
    title: "Bérleti szerződés",
    text: "Földbérleti szerződés sablonok és szakértői támogatás.",
    to: "/foldberleti-szerzodes",
    cta: "Szerződést készítek",
  },
];

function Index() {
  return (
    <PageShell>
      <section className="df-landscape border-b border-df-border">
        <div className="container mx-auto grid gap-10 px-4 pb-12 pt-12 md:grid-cols-[1fr_440px] md:items-center md:pb-24 md:pt-20">
          <div className="max-w-3xl">
            <h1 className="font-brand text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-df-green md:text-7xl">
              Ki áll előrébb a haszonbérleti rangsorban?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-df-ink md:text-xl">
              Kifüggesztések, ranghely kalkulátor, elfogadó nyilatkozat és földbérleti szerződés egy
              helyen.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <BrandButton asChild>
                <Link to="/ranghely-kalkulator">
                  Ranghelyem ellenőrzése <ArrowRight className="h-4 w-4" />
                </Link>
              </BrandButton>
              <BrandButton asChild variant="secondary">
                <Link to="/kifuggesztesek">
                  Kifüggesztések keresése <ArrowRight className="h-4 w-4" />
                </Link>
              </BrandButton>
            </div>
          </div>

          <HeroResultCard className="order-first md:order-none" />
        </div>
      </section>

      <section className="container mx-auto -mt-8 px-4 pb-8 md:-mt-14">
        <div className="grid overflow-hidden rounded-lg border border-df-border bg-df-card shadow-[0_16px_42px_rgba(26,26,26,0.08)] md:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </section>

      <RankPreview />
      <TrustStrip />
    </PageShell>
  );
}
