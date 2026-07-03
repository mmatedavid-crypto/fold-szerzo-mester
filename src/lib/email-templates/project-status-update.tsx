import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  recipientName?: string;
  generatedAt?: string;
}

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "720px" };
const h2 = { margin: 0, color: "#21543a" } as const;
const h3 = { color: "#21543a", marginTop: "20px", marginBottom: "6px" } as const;
const p = { color: "#333", fontSize: "14px", lineHeight: "1.55" } as const;
const li = { color: "#333", fontSize: "14px", lineHeight: "1.55", margin: "4px 0" } as const;
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "14px 16px",
  marginTop: "10px",
  background: "#f8faf8",
} as const;

const Email = ({ recipientName = "", generatedAt = "" }: Props) => (
  <Html lang="hu">
    <Head />
    <Preview>Dr Föld — pillanatnyi állás a szerződésgenerátorban</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading as="h2" style={h2}>
          Dr Föld — hol tartunk most, és mire várunk visszajelzést
        </Heading>
        <Text style={p}>
          {recipientName ? `Kedves ${recipientName}!` : "Kedves Címzett!"} Röviden összefoglaljuk,
          hol tart most a földbérleti szerződésgenerátor, és milyen pontokon várjuk a szakmai
          meglátásokat, hogy a következő iteráció már azokra épüljön.
        </Text>
        <Text style={{ ...p, color: "#666", fontSize: "12px" }}>
          Generálva: {generatedAt} · Környezet: éles (drfold.hu)
        </Text>

        <Heading as="h3" style={h3}>Jelenlegi állapot</Heading>
        <Section style={card}>
          <Text style={li}>
            • <b>Klauzulakészlet v2026.1</b> aktív — Fftv., Fétv., Ptk. és NAV-hivatkozásokkal,
            klauzula-szerkesztőben módosítható szövegekkel.
          </Text>
          <Text style={li}>
            • <b>Fftv. 50. § (3)–(4)</b> beépítve: 2022.01.01 utáni szerződéseknél a készpénzes
            teljesítés blokkolva, csak a törvényi kivételek (1 ha alatti terület, közeli
            hozzátartozó, tanya, 25%-os tulajdoni kapcsolat, családi mg. társaság tag) mellett
            engedélyezett, indokolással együtt.
          </Text>
          <Text style={li}>
            • <b>Jogforrás-frissesség monitor</b> heti riporttal — ha megváltozik egy jogszabály,
            e-mailben jelez és a klauzula lektorálásra kerül.
          </Text>
          <Text style={li}>
            • <b>Előhaszonbérleti sorrend</b> Fftv. 46. § szerint, kifüggesztéshez szükséges
            iratmintákkal és határidőkkel.
          </Text>
          <Text style={li}>
            • <b>PDF renderer</b>: hivatalos formátum, dokumentumszám, hash, sablon- és
            klauzulaverzió lábjegyzet, tanús aláírási blokk vagy ügyvédi ellenjegyzés.
          </Text>
        </Section>

        <Heading as="h3" style={h3}>Piaci minta — 30 kifüggesztett szerződés elemzése</Heading>
        <Section style={card}>
          <Text style={li}>
            • Díjazás: ~46% Ft/AK/év (jellemzően 3.000 Ft/AK), ~40% Ft/ha/év (60–180 e Ft/ha).
          </Text>
          <Text style={li}>
            • Fizetés: 66% banki utalás, 0% készpénz — összhangban az Fftv. 50. § (3) bek.-el.
          </Text>
          <Text style={li}>
            • Forma: ~90% két tanús magánokirat, ~13% ügyvédi ellenjegyzés.
          </Text>
          <Text style={li}>
            • Előhaszonbérleti kikötés a szerződések 96%-ában megjelenik.
          </Text>
        </Section>

        <Heading as="h3" style={h3}>Legyártott minták áttekintésre</Heading>
        <Section style={card}>
          <Text style={li}>
            1. <b>Magán bérbeadó · 1 hrsz · Ft/ha/év</b> — Hejőkürt, 5 év, 95.000 Ft/ha/év,
            KSH-indexálás.
          </Text>
          <Text style={li}>
            2. <b>Társtulajdonosok · 2 hrsz · Ft/AK/év</b> — Kerekegyháza, 10 év, 1.350 Ft/AK/év,
            3% éves emelés.
          </Text>
          <Text style={li}>
            3. <b>Őstermelő bérlő · terményben · 7 év</b> — Bátaszék, 8 kg búza/AK/év +
            készpénz-minimum utalással.
          </Text>
          <Text style={{ ...li, color: "#666", fontSize: "12px" }}>
            A minták a klauzula-szerkesztő aktuális szövegével készültek. Külön kérésre a rendszer
            újragenerálja őket letölthető PDF-ként az admin felületen.
          </Text>
        </Section>

        <Heading as="h3" style={h3}>Miben várjuk a meglátásokat</Heading>
        <Section style={card}>
          <Text style={li}>
            • Vannak-e olyan klauzulák (pl. felmondás, kármegosztás, indexálás, tulajdonosváltás),
            amelyek szövegezését jobban a piaci gyakorlathoz kellene igazítani?
          </Text>
          <Text style={li}>
            • Előhaszonbérleti nyilatkozat sorrend és a kifüggesztéshez tartozó iratminták
            elegendő részletességűek-e?
          </Text>
          <Text style={li}>
            • A készpénz-kivétel dropdown öt kategóriája (1 ha alatt, közeli hozzátartozó, tanya,
            25% tulajdoni kapcsolat, családi mg. társaság) lefedi-e a gyakorlatot?
          </Text>
          <Text style={li}>
            • Kell-e külön változat ügyvédi ellenjegyzéshez képest a két tanús formához (eltérő
            záradék, aláírás-blokk)?
          </Text>
          <Text style={li}>
            • Hiányzik-e olyan kötelező tájékoztatás vagy jogforrás-hivatkozás, amit a hatóság
            vagy a földhivatal jellemzően elvár?
          </Text>
        </Section>

        <Hr style={{ marginTop: "24px" }} />
        <Text style={{ color: "#666", fontSize: "12px" }}>
          Visszajelzést a hello@drfold.hu címre várunk, vagy közvetlenül a klauzula-szerkesztő
          felületen (drfold.hu/klauzula-szerkesztes) — minden módosítás verzionálva kerül a
          generátorba.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Dr Föld — jelenlegi állás és kérdések visszajelzésre",
  displayName: "Projekt státusz + kérdések",
  previewData: {
    recipientName: "Dr. Szarka Ádám",
    generatedAt: "2026.07.03. 10:00",
  },
} satisfies TemplateEntry;