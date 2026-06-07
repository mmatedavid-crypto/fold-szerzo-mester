import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileSignature, Handshake, Search } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { BrandButton } from "@/components/brand/brand-buttons";
import {
  BrandBadge,
  FeatureCard,
  NoticeBoardIcon,
  RankBarsIcon,
  StampBadge,
} from "@/components/brand/brand-elements";
import { DrFoldLogo } from "@/components/brand/dr-fold-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dr Föld | Ha előrébb állsz, ne maradj hátul." },
      {
        name: "description",
        content:
          "Ravasz a gazda. Dr Föld megmutatja, hol állsz a ranghelyben, mire hivatkozhatsz, és segít időben lépni.",
      },
      { property: "og:title", content: "Dr Föld — Ha előrébb állsz, ne maradj hátul." },
      {
        property: "og:description",
        content:
          "Kifüggesztés, ranghely, elfogadó nyilatkozat és földbérleti szerződés-előkészítés magyar gazdáknak.",
      },
    ],
    links: [{ rel: "canonical", href: "https://drfold.hu/" }],
  }),
  component: Index,
});

const features = [
  {
    icon: "notice" as const,
    kicker: "Kifüggesztés",
    title: "Láttál egy kifüggesztést?",
    text: "Keress településre vagy helyrajzi számra, és nézd meg, van-e benne lehetőség.",
    to: "/kifuggesztesek",
    cta: "Kifüggesztések keresése",
  },
  {
    icon: "rank" as const,
    kicker: "Ranghely",
    title: "Nézd meg, hol állsz a sorban.",
    text: "A ranghely nem érzés kérdése. Válaszolj pár kérdésre, és tisztábban látsz.",
    to: "/ranghely-kalkulator",
    cta: "Ranghely kalkulátor",
  },
  {
    icon: "acceptance" as const,
    kicker: "Nyilatkozat",
    title: "Erősebb a ranghelyed?",
    text: "Készíts elfogadó nyilatkozatot időben, a szükséges igazolások listájával.",
    to: "/elfogado-nyilatkozat",
    cta: "Nyilatkozat készítése",
  },
  {
    icon: "contract" as const,
    kicker: "Szerződés",
    title: "Földbérleti szerződés kell?",
    text: "Készíts rendezett szerződés-előkészítő dokumentumot érthető lépésekben.",
    to: "/foldberleti-szerzodes",
    cta: "Szerződés készítése",
  },
  {
    icon: "deadline" as const,
    kicker: "Határidő",
    title: "A határidő jogvesztő.",
    text: "Ne hagyd az utolsó napra. Figyeld, mikor kell lépned.",
    to: "/kifuggesztesek",
    cta: "Kifüggesztést keresek",
  },
  {
    icon: "lawyer" as const,
    kicker: "Ügyintézés",
    title: "Nagyobb ügy?",
    text: "Indíts ügyvédi ügyintézést, ha vitás, nagy értékű vagy összetett a helyzet.",
    to: "/dokumentum-ellenorzes",
    cta: "Ügyvédi ellenőrzés",
  },
];

function Index() {
  return (
    <PageShell>
      <section className="df-paper border-b-2 border-df-border">
        <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-[1fr_430px] md:items-center md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <BrandBadge>Ravasz a gazda.</BrandBadge>
            <h1 className="mt-5 font-brand text-4xl font-black leading-tight text-df-green md:text-6xl">
              Ha előrébb állsz, ne maradj hátul.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-df-ink md:text-xl">
              Láttál egy kifüggesztést? A Dr Föld megmutatja, hol állsz a ranghelyben, mire
              hivatkozhatsz, és mikor kell lépned.
            </p>
            <p className="mt-3 max-w-2xl text-base font-bold text-df-green">
              Ravasz a gazda. Nem találgat — ranghelyet néz.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <BrandButton asChild>
                <Link to="/ranghely-kalkulator">Megnézem, előrébb állok-e</Link>
              </BrandButton>
              <BrandButton asChild variant="secondary">
                <Link to="/kifuggesztesek">Kifüggesztések keresése</Link>
              </BrandButton>
              <BrandButton asChild variant="secondary">
                <Link to="/elfogado-nyilatkozat">Elfogadó nyilatkozat készítése</Link>
              </BrandButton>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm rounded-2xl border-2 border-df-green bg-df-card p-5 shadow-[8px_8px_0_var(--df-border)]">
            <div className="absolute -right-3 -top-3">
              <StampBadge>NEM TRÜKK. RANGHELY.</StampBadge>
            </div>
            <DrFoldLogo className="w-full justify-center" />
            <div className="mt-6 rounded-lg border-2 border-df-border bg-df-cream p-4">
              <div className="flex items-center justify-between gap-4">
                <NoticeBoardIcon />
                <RankBarsIcon />
              </div>
              <div className="mt-4 rounded-md border-2 border-df-green bg-df-card p-3">
                <div className="flex items-center gap-2 font-brand text-lg font-black text-df-green">
                  <CheckCircle2 className="h-5 w-5 text-df-red" />
                  1-es ranghely kiemelve
                </div>
                <p className="mt-1 text-sm text-df-gray">
                  Kifüggesztést láttál? Nézd meg, van-e benne lehetőség.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <BrandBadge>Dr Föld műhely</BrandBadge>
            <h2 className="mt-3 font-brand text-3xl font-black text-df-green">
              A magyar gazda nem találgat.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-df-gray">
            Ranghelyet néz, nem szerencsét. Ha van jogalapod, lépj időben.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="border-y-2 border-df-border bg-df-green text-df-card">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-[1fr_300px] md:items-center">
          <div>
            <StampBadge className="border-df-yellow text-df-yellow">
              Nem trükk. Ranghely.
            </StampBadge>
            <h2 className="mt-4 font-brand text-3xl font-black md:text-4xl">
              A ranghely nem találgatás.
            </h2>
            <p className="mt-3 max-w-2xl text-df-cream">
              Válaszolj pár kérdésre, és megmutatjuk, előrébb állhatsz-e a sorban.
            </p>
            <BrandButton asChild variant="secondary" className="mt-6">
              <Link to="/ranghely-kalkulator">Megnézem a ranghelyem</Link>
            </BrandButton>
          </div>
          <div className="rounded-xl border-2 border-df-yellow bg-df-card p-5 text-df-ink shadow-[5px_5px_0_rgba(0,0,0,0.25)]">
            <RankBarsIcon className="mx-auto" />
            <p className="mt-4 text-center font-brand text-xl font-black text-df-green">
              Ranghelyet néz, nem szerencsét.
            </p>
          </div>
        </div>
      </section>

      <LandingBand
        badge="Kifüggesztésből lehetőség"
        headline="Kifüggesztésből lehetőség."
        copy="Keress helyrajzi számra, településre vagy határidőre, és nézd meg, érdemes-e lépned."
        cta="Kifüggesztések keresése"
        to="/kifuggesztesek"
        icon={<Search className="h-12 w-12 text-df-green" />}
      />

      <LandingBand
        badge="Földbérleti szerződés"
        headline="Földbérleti szerződés, érthetően."
        copy="Add meg a feleket, a föld adatait, a díjat és a feltételeket. A Dr Föld segít összerakni egy rendezett szerződés-előkészítő dokumentumot."
        cta="Földbérleti szerződés készítése"
        to="/foldberleti-szerzodes"
        icon={<FileSignature className="h-12 w-12 text-df-green" />}
      />

      <section id="ugyvedi-ugyintezes" className="container mx-auto px-4 py-12">
        <div className="rounded-xl border-2 border-df-border bg-df-card p-6 shadow-[5px_5px_0_var(--df-border)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <BrandBadge>Ravasz, de szabályos.</BrandBadge>
              <h2 className="mt-3 font-brand text-3xl font-black text-df-green">
                Nagyobb ügy? Ne vaktában indulj.
              </h2>
              <p className="mt-3 max-w-2xl text-df-gray">
                A Dr Föld nem kiskaput keres. A ranghelyedet, a határidőket és a szükséges adatokat
                segít átlátni.
              </p>
              <p className="mt-3 max-w-2xl text-sm text-df-gray">
                A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda.
                Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.
              </p>
            </div>
            <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-df-red text-df-red">
              <Handshake className="h-12 w-12" />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-4">
        <div className="inline-flex items-center gap-2 rounded-md border-2 border-df-red bg-df-card px-4 py-3 text-sm font-bold text-df-red">
          <AlertTriangle className="h-4 w-4" />
          Ha van jogalapod, lépj időben.
        </div>
      </section>
    </PageShell>
  );
}

function LandingBand({
  badge,
  headline,
  copy,
  cta,
  to,
  icon,
}: {
  badge: string;
  headline: string;
  copy: string;
  cta: string;
  to: string;
  icon: ReactNode;
}) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="grid gap-6 rounded-xl border-2 border-df-border bg-df-cream p-6 md:grid-cols-[1fr_180px] md:items-center md:p-8">
        <div>
          <BrandBadge>{badge}</BrandBadge>
          <h2 className="mt-3 font-brand text-3xl font-black text-df-green">{headline}</h2>
          <p className="mt-3 max-w-2xl text-df-gray">{copy}</p>
          <BrandButton asChild className="mt-5">
            <Link to={to}>{cta}</Link>
          </BrandButton>
        </div>
        <div className="grid h-28 w-28 place-items-center rounded-xl border-2 border-df-green bg-df-card shadow-[4px_4px_0_var(--df-border)] md:ml-auto">
          {icon}
        </div>
      </div>
    </section>
  );
}
