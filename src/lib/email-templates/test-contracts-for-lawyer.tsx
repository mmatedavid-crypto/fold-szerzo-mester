import * as React from "react";
import {
  Body,
  Button,
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

interface ContractItem {
  title: string;
  summary: string;
  documentNumber: string;
  downloadUrl: string;
}

interface Props {
  lawyerName?: string;
  generatedAt?: string;
  linkExpiresIn?: string;
  contracts?: ContractItem[];
}

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "680px" };
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "12px",
  background: "#fffbe9",
};
const btn = {
  backgroundColor: "#21543a",
  color: "#ffffff",
  padding: "10px 18px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: 600,
  display: "inline-block",
  marginTop: "10px",
};

const Email = ({
  lawyerName = "Dr. Szarka Ádám",
  generatedAt = "",
  linkExpiresIn = "7 nap",
  contracts = [],
}: Props) => (
  <Html lang="hu">
    <Head />
    <Preview>3 teszt földbérleti szerződés átnézésre — Dr Föld</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading as="h2" style={{ margin: 0, color: "#21543a" }}>
          Teszt földbérleti szerződések ügyvédi átnézésre
        </Heading>
        <Text style={{ color: "#444" }}>
          Kedves {lawyerName}! Az új generáló pipeline kipróbálására készítettünk{" "}
          {contracts.length} fiktív, de valósághű mintát az Ön által jóváhagyott
          klauzulakészlettel és a Jogtárból letöltött jogforrás-hivatkozásokkal.
        </Text>
        <Text style={{ color: "#555", fontSize: "13px" }}>
          Generálva: {generatedAt} · Letöltési linkek érvényessége: {linkExpiresIn}.
          Minden adat kitalált — éles ügyfél/hrsz nincs benne.
        </Text>
        <Hr />
        {contracts.map((c, i) => (
          <Section key={i} style={card}>
            <Text style={{ margin: 0, fontWeight: 700, color: "#21543a" }}>
              {i + 1}. {c.title}
            </Text>
            <Text style={{ margin: "6px 0", color: "#444", fontSize: "13px" }}>
              {c.summary}
            </Text>
            <Text style={{ margin: 0, fontFamily: "monospace", fontSize: "12px", color: "#666" }}>
              Dokumentumszám: {c.documentNumber}
            </Text>
            <Button href={c.downloadUrl} style={btn}>
              PDF megnyitása
            </Button>
          </Section>
        ))}
        <Hr style={{ marginTop: "24px" }} />
        <Text style={{ color: "#666", fontSize: "12px" }}>
          Visszajelzést a hello@drfold.hu címre vagy az alkalmazás Klauzula-szerkesztő
          felületén lehet rögzíteni — ott közvetlenül módosítható minden kifogásolt
          klauzula szövege és jogforrás-hivatkozása.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Teszt földbérleti szerződések ügyvédi átnézésre — Dr Föld",
  displayName: "Teszt szerződések ügyvédnek",
  previewData: {
    lawyerName: "Dr. Szarka Ádám",
    generatedAt: "2025.01.01. 12:00",
    linkExpiresIn: "7 nap",
    contracts: [
      {
        title: "Magán bérbeadó · 1 hrsz · Ft/ha/év",
        summary: "Borsod megyei szántó, 5 éves, fix Ft/ha/év díjjal.",
        documentNumber: "FBSZ-TEST-000001",
        downloadUrl: "https://example.com/a.pdf",
      },
    ],
  },
} satisfies TemplateEntry;