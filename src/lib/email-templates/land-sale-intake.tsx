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
import { company } from "@/lib/company";

interface Props {
  fullName?: string;
  email?: string;
  phone?: string;
  roleLabel?: string;
  settlement?: string;
  parcelNumbers?: string;
  areaHa?: string;
  cultivationBranch?: string;
  priceHuf?: string;
  counterpartyName?: string;
  counterpartyContact?: string;
  preferredContact?: string;
  notes?: string;
  intakeId?: string;
  submittedAt?: string;
}

const main = { backgroundColor: "#F6F1E7", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "640px" };
const card = {
  background: "#ffffff",
  border: "1px solid #E6E1D6",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "12px",
};
const h2 = { fontFamily: "Georgia, serif", color: "#0f3d2e", margin: "0 0 4px" };
const label = {
  color: "#5b6b62",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
  margin: "12px 0 2px",
};
const value = { color: "#1a1a1a", fontSize: "14px", margin: 0 };

const Row = ({ k, v }: { k: string; v?: string }) =>
  v ? (
    <>
      <Text style={label}>{k}</Text>
      <Text style={value}>{v}</Text>
    </>
  ) : null;

const Email = (p: Props) => (
  <Html lang="hu">
    <Head />
    <Preview>{`Új földadásvételi megkeresés – ${p.fullName ?? ""}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading as="h2" style={h2}>
          Új földadásvételi megkeresés
        </Heading>
        <Text style={{ color: "#5b6b62", fontSize: "13px", margin: 0 }}>
          A {company.brandName} weboldalon új adásvételi adatfelvételi űrlap érkezett.
        </Text>

        <Section style={card}>
          <Heading as="h3" style={{ ...h2, fontSize: "16px" }}>
            Megbízó
          </Heading>
          <Row k="Név" v={p.fullName} />
          <Row k="E-mail" v={p.email} />
          <Row k="Telefon" v={p.phone} />
          <Row k="Szerepkör az ügyletben" v={p.roleLabel} />
          <Row k="Preferált elérhetőség" v={p.preferredContact} />
        </Section>

        <Section style={card}>
          <Heading as="h3" style={{ ...h2, fontSize: "16px" }}>
            Ingatlan
          </Heading>
          <Row k="Település" v={p.settlement} />
          <Row k="Helyrajzi szám(ok)" v={p.parcelNumbers} />
          <Row k="Terület (ha)" v={p.areaHa} />
          <Row k="Művelési ág" v={p.cultivationBranch} />
          <Row k="Vételár (Ft)" v={p.priceHuf} />
        </Section>

        <Section style={card}>
          <Heading as="h3" style={{ ...h2, fontSize: "16px" }}>
            Másik fél
          </Heading>
          <Row k="Név" v={p.counterpartyName} />
          <Row k="Elérhetőség" v={p.counterpartyContact} />
        </Section>

        {p.notes ? (
          <Section style={card}>
            <Heading as="h3" style={{ ...h2, fontSize: "16px" }}>
              Megjegyzés
            </Heading>
            <Text style={{ ...value, whiteSpace: "pre-wrap" as const }}>{p.notes}</Text>
          </Section>
        ) : null}

        <Hr style={{ borderColor: "#E6E1D6", margin: "20px 0" }} />
        <Text style={{ color: "#5b6b62", fontSize: "12px" }}>
          Megkeresés azonosító: {p.intakeId ?? "—"}
          <br />
          Beérkezett: {p.submittedAt ?? "—"}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template: TemplateEntry = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Új földadásvételi megkeresés – ${d?.fullName ?? "ismeretlen"}${
      d?.settlement ? ` (${d.settlement})` : ""
    }`,
  displayName: "Földadásvétel — ügyvédi értesítő",
  to: company.lawyerEmail,
  previewData: {
    fullName: "Kovács János",
    email: "kovacs@example.hu",
    phone: "+36 30 123 4567",
    roleLabel: "Eladó",
    settlement: "Kerekegyháza",
    parcelNumbers: "0123/4, 0123/5",
    areaHa: "4.5",
    cultivationBranch: "szántó",
    priceHuf: "12 500 000",
    counterpartyName: "Nagy Béla",
    counterpartyContact: "+36 20 987 6543",
    preferredContact: "Telefon, délelőtt",
    notes: "Sürgős, kifüggesztés várhatóan jövő héten.",
    intakeId: "demo-uuid",
    submittedAt: new Date().toISOString(),
  },
};