import * as React from "react";
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Item {
  shortName: string;
  status: "changed" | "never_fetched" | "unreachable" | "unchanged";
  storedHash: string | null;
  currentHash: string | null;
  sourceUrl: string;
  message?: string;
}

interface Props {
  checkedAt?: string;
  items?: Item[];
}

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "680px" };

const COLOR: Record<Item["status"], string> = {
  changed: "#b45309",
  never_fetched: "#0f766e",
  unreachable: "#991b1b",
  unchanged: "#0f766e",
};
const LABEL: Record<Item["status"], string> = {
  changed: "MEGVÁLTOZOTT",
  never_fetched: "ÚJ",
  unreachable: "NEM ELÉRHETŐ",
  unchanged: "RENDBEN",
};

const Email = ({ checkedAt = "", items = [] }: Props) => {
  const sections: Array<[Item["status"], Item[], string]> = [
    ["changed", items.filter((i) => i.status === "changed"), "Megváltozott — ügyvédi review kell"],
    ["never_fetched", items.filter((i) => i.status === "never_fetched"), "Új, még nem lektorált"],
    ["unreachable", items.filter((i) => i.status === "unreachable"), "Nem elérhető"],
  ];
  return (
    <Html lang="hu">
      <Head />
      <Preview>Jogforrás-frissesség heti riport</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h2" style={{ margin: 0, color: "#0f3d2e" }}>
            Jogforrás-frissesség heti riport
          </Heading>
          <Text style={{ color: "#555", margin: "0 0 16px" }}>Időpont: {checkedAt}</Text>
          {sections.every(([, arr]) => arr.length === 0) ? (
            <Text style={{ color: "#0f766e" }}>
              Minden jogforrás változatlan — nincs teendő.
            </Text>
          ) : (
            sections
              .filter(([, arr]) => arr.length > 0)
              .map(([status, arr, title]) => (
                <Section key={status} style={{ marginTop: "16px" }}>
                  <Heading as="h3" style={{ color: COLOR[status], margin: "0 0 8px" }}>
                    {title} ({arr.length})
                  </Heading>
                  {arr.map((r, i) => (
                    <div
                      key={i}
                      style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: "13px" }}
                    >
                      <Text style={{ margin: 0, fontWeight: 600 }}>
                        {r.shortName}{" "}
                        <span style={{ color: COLOR[status], fontWeight: 700 }}>
                          [{LABEL[status]}]
                        </span>
                      </Text>
                      <Text style={{ margin: "2px 0", color: "#555", fontFamily: "monospace" }}>
                        {r.storedHash ?? "—"} → {r.currentHash ?? "—"}
                      </Text>
                      {r.message ? (
                        <Text style={{ margin: "2px 0", color: "#991b1b" }}>{r.message}</Text>
                      ) : null}
                      <Link href={r.sourceUrl} style={{ color: "#0a6" }}>
                        forrás
                      </Link>
                    </div>
                  ))}
                </Section>
              ))
          )}
          <Hr style={{ margin: "24px 0", borderColor: "#eee" }} />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            Részletek és lektorálás:{" "}
            <Link href="https://drfold.hu/klauzula-jovahagyasok">drfold.hu/klauzula-jovahagyasok</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const items: Item[] = d.items ?? [];
    const changed = items.filter((i) => i.status === "changed").length;
    const unreachable = items.filter((i) => i.status === "unreachable").length;
    if (changed) return `[ACTION] ${changed} jogforrás megváltozott — Dr Föld`;
    if (unreachable) return `[FIGYELEM] ${unreachable} forrás nem elérhető — Dr Föld`;
    return "[OK] Heti jogforrás-riport — Dr Föld";
  },
  displayName: "Jogforrás-frissesség riport",
  previewData: {
    checkedAt: "2026.06.13. 06:00",
    items: [
      {
        shortName: "Földforgalmi tv.",
        status: "changed",
        storedHash: "abc123",
        currentHash: "def456",
        sourceUrl: "https://njt.hu/...",
      },
    ],
  },
} satisfies TemplateEntry;