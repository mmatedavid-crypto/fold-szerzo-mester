import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CheckCircle2, FileSignature, MapPinned, PenLine, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { BrandButton } from "@/components/brand/brand-buttons";
import { BrandBadge, StampBadge } from "@/components/brand/brand-elements";
import { DrFoldLogo } from "@/components/brand/dr-fold-logo";

export const Route = createFileRoute("/foldberleti-szerzodes")({
  head: () => ({
    meta: [
      { title: "Földbérleti szerződés készítése | Dr Föld" },
      {
        name: "description",
        content:
          "Készíts rendezett földbérleti szerződés-előkészítő dokumentumot Dr Földdel. Add meg a föld, a felek és a bérlet adatait, és haladj végig érthetően a folyamaton.",
      },
      { property: "og:title", content: "Földbérleti szerződés készítése | Dr Föld" },
      {
        property: "og:description",
        content:
          "Add meg a föld, a felek és a bérlet adatait. A Dr Föld segít rendezett szerződés-előkészítő dokumentumot készíteni.",
      },
    ],
    links: [{ rel: "canonical", href: "https://drfold.hu/foldberleti-szerzodes" }],
  }),
  component: FoldberletiSzerzodesLanding,
});

function FoldberletiSzerzodesLanding() {
  return (
    <PageShell>
      <section className="df-paper border-b-2 border-df-border">
        <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-[1fr_360px] md:items-center md:py-16">
          <div>
            <BrandBadge>Földbérleti szerződés</BrandBadge>
            <h1 className="mt-5 font-brand text-4xl font-black leading-tight text-df-green md:text-5xl">
              Földbérleti szerződés készítése
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-df-ink">
              Add meg a feleket, a föld adatait, a bérleti díjat és a feltételeket. A Dr Föld segít
              rendezett szerződés-előkészítő dokumentumot készíteni.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <BrandButton asChild>
                <Link to="/szerzodes/uj">Földbérleti szerződés indítása</Link>
              </BrandButton>
              <BrandButton asChild variant="secondary">
                <Link to="/">Megnézem a Dr Föld többi szolgáltatását</Link>
              </BrandButton>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-df-green bg-df-card p-5 shadow-[7px_7px_0_var(--df-border)]">
            <DrFoldLogo className="w-full justify-center" />
            <div className="mt-6 rounded-lg border-2 border-df-border bg-df-cream p-4">
              <FileSignature className="h-12 w-12 text-df-green" />
              <p className="mt-3 font-brand text-xl font-black text-df-green">
                Földbérleti szerződés kell? Rakjuk rendbe.
              </p>
              <StampBadge className="mt-4">Szerződés-előkészítés</StampBadge>
            </div>
          </div>
        </div>
      </section>

      <SeoBlock
        icon={<MapPinned className="h-8 w-8 text-df-green" />}
        title="Mikor kell földbérleti szerződés?"
      >
        Ha termőföld használatát adod bérbe vagy veszed bérbe, a feleknek, a területnek, a díjnak,
        az időtartamnak és a feltételeknek rendezett módon kell szerepelniük. A Dr Föld ebben vezet
        végig érthető lépésekben.
      </SeoBlock>

      <SeoBlock
        icon={<PenLine className="h-8 w-8 text-df-green" />}
        title="Milyen adatokra lesz szükség?"
      >
        A szerződés-előkészítéshez szükség lehet a felek adataira, a helyrajzi számra, a művelési
        ágra, a bérleti díjra, a fizetési feltételekre, az időtartamra és a kapcsolódó
        nyilatkozatokra.
      </SeoBlock>

      <SeoBlock
        icon={<CheckCircle2 className="h-8 w-8 text-df-green" />}
        title="Miért fontos, hogy a szerződés rendezett legyen?"
      >
        A magyar gazda nem találgat. Egy rendezett szerződés-előkészítő dokumentum segít átlátni, mi
        került bele a megállapodásba, mire kell figyelni, és hol lehet szükség további ellenőrzésre.
      </SeoBlock>

      <SeoBlock
        icon={<ShieldCheck className="h-8 w-8 text-df-green" />}
        title="Dr Föld: földbérlet, ranghely, kifüggesztés egy helyen"
      >
        A földbérleti szerződés csak az egyik lépés. A Dr Föld segít kifüggesztést keresni,
        ranghelyet nézni, elfogadó nyilatkozatot előkészíteni és időben lépni, ha van jogalapod.
      </SeoBlock>

      <section className="container mx-auto px-4 py-10">
        <div className="rounded-xl border-2 border-df-red bg-df-card p-6 text-sm leading-relaxed text-df-gray">
          <p className="font-bold text-df-red">
            A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda.
          </p>
          <p className="mt-2">Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.</p>
        </div>
      </section>
    </PageShell>
  );
}

function SeoBlock({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid gap-5 rounded-xl border-2 border-df-border bg-df-card p-6 md:grid-cols-[72px_1fr] md:p-8">
        <div className="grid h-16 w-16 place-items-center rounded-lg border-2 border-df-green bg-df-cream">
          {icon}
        </div>
        <div>
          <h2 className="font-brand text-2xl font-black text-df-green">{title}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-df-gray">{children}</p>
        </div>
      </div>
    </section>
  );
}
