import * as React from "react";
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Notice {
  parcels: string;
  type: string;
  pubDate: string;
  deadline: string;
  url: string;
}

interface Props {
  settlement?: string;
  notices?: Notice[];
  expiresAt?: string;
}

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "640px" };
const h2 = { fontFamily: "Georgia, serif", color: "#0f3d2e", margin: "0 0 8px" };
const muted = { color: "#555", fontSize: "14px" };
const row = { padding: "10px 0", borderBottom: "1px solid #eee", fontSize: "13px" };

const Email = ({ settlement = "—", notices = [], expiresAt }: Props) => (
  <Html lang="hu">
    <Head />
    <Preview>{`Heti kifüggesztések – ${settlement} (${notices.length} db)`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading as="h2" style={h2}>
          Heti kifüggesztések – {settlement}
        </Heading>
        <Text style={muted}>
          Az alábbi listában az aktuálisan kifüggesztett termőföld hirdetmények szerepelnek
          ({notices.length} db).
        </Text>

        {notices.length === 0 ? (
          <Section
            style={{
              padding: "12px",
              background: "#f5f5f5",
              borderRadius: "6px",
              marginTop: "12px",
            }}
          >
            <Text style={{ margin: 0 }}>
              Ezen a héten nincs aktuális kifüggesztés ezen a településen.
            </Text>
          </Section>
        ) : (
          <Section style={{ marginTop: "12px" }}>
            {notices.map((n, i) => (
              <div key={i} style={row}>
                <Text style={{ margin: "0 0 4px", fontWeight: 600 }}>
                  {n.type} — hrsz.: {n.parcels}
                </Text>
                <Text style={{ margin: 0, color: "#555" }}>
                  Közzététel: {n.pubDate} · Határidő: {n.deadline}
                </Text>
                {n.url ? (
                  <Link href={n.url} style={{ color: "#0a6", fontSize: "13px" }}>
                    Hirdetmény megnyitása
                  </Link>
                ) : null}
              </div>
            ))}
          </Section>
        )}

        <Hr style={{ margin: "24px 0", borderColor: "#eee" }} />
        {expiresAt ? (
          <Text style={{ color: "#888", fontSize: "12px" }}>
            Előfizetésed lejár: {expiresAt}.
          </Text>
        ) : null}
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Heti kifüggesztések – ${d.settlement ?? ""} (${(d.notices?.length ?? 0)} db)`,
  displayName: "Heti hirdetmény-összesítő",
  previewData: {
    settlement: "Kerekegyháza",
    notices: [
      {
        parcels: "0123/4",
        type: "Haszonbérleti",
        pubDate: "2026.06.10.",
        deadline: "2026.06.24.",
        url: "https://example.com/hirdetmeny",
      },
    ],
    expiresAt: "2027.01.01.",
  },
} satisfies TemplateEntry;