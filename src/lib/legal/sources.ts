/**
 * Jogforrás-katalógus a haszonbérleti generátor szabálymotorjához.
 * AI nem dönt jogszabályból — minden alkalmazandó szabály ezekre a forrásokra hivatkozik.
 * A források a net.jogtar.hu Hatályos Jogszabályok Gyűjteményéből 2026-06-12-én
 * letöltésre és feldolgozásra kerültek. Minden forráshoz tárolunk
 * `versionHash`-t (a letöltött HTML SHA-256 első 16 karaktere) és kinyert
 * §-szakasz-részleteket (lásd `sources-snippets.json`). A `verified` státusz
 * azt jelenti, hogy az adott forrásszöveg ezzel a hash-sel rögzítve van;
 * a szabálymotor a `getSourceExcerpts()` helperen keresztül tud rá hivatkozni.
 * Ügyvédi review továbbra is szükséges minden új klauzula-szöveghez —
 * a hash csak az alapszöveg azonosíthatóságát garantálja, nem a jogi értelmezést.
 */

import snippets from "./sources-snippets.json";

export type SourceVerificationStatus =
  | "source_added_pending_fetch"
  | "lawyer_review_required"
  | "verified";

export interface LegalSource {
  id: string;
  title: string;
  actNumber: string;
  shortName: string;
  sourceUrl: string;
  retrievedAt: string | null;
  versionHash: string | null;
  checkedAt: string | null;
  verificationStatus: SourceVerificationStatus;
}

const ADDED_AT = "2026-06-12";

export const LEGAL_SOURCES_V2: LegalSource[] = [
  {
    id: "fftv",
    title: "A mező- és erdőgazdasági földek forgalmáról szóló törvény",
    actNumber: "2013. évi CXXII. törvény",
    shortName: "Földforgalmi tv.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-122-00-00",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "fetv",
    title:
      "A mező- és erdőgazdasági földek forgalmáról szóló törvénnyel összefüggő egyes rendelkezésekről és átmeneti szabályokról",
    actNumber: "2013. évi CCXII. törvény",
    shortName: "Fétv.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-212-00-00",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "korm-474-2013",
    title:
      "Az elővásárlási és előhaszonbérleti jog gyakorlása érdekében hirdetményi úton történő közlés eljárási szabályairól",
    actNumber: "474/2013. (XII. 12.) Korm. rendelet",
    shortName: "474/2013. Korm. r.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-474-20-22",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "korm-356-2007",
    title: "A földhasználati nyilvántartás részletes szabályairól",
    actNumber: "356/2007. (XII. 23.) Korm. rendelet",
    shortName: "356/2007. Korm. r.",
    sourceUrl: "https://njt.hu/jogszabaly/2007-356-20-22",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "ptk",
    title: "A Polgári Törvénykönyvről",
    actNumber: "2013. évi V. törvény",
    shortName: "Ptk.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-5-00-00",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "pp",
    title: "A polgári perrendtartásról",
    actNumber: "2016. évi CXXX. törvény",
    shortName: "Pp.",
    sourceUrl: "https://njt.hu/jogszabaly/2016-130-00-00",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "tfvt",
    title: "A termőföld védelméről",
    actNumber: "2007. évi CXXIX. törvény",
    shortName: "Termőföldvédelmi tv.",
    sourceUrl: "https://njt.hu/jogszabaly/2007-129-00-00",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "evt",
    title: "Az erdőről, az erdő védelméről és az erdőgazdálkodásról",
    actNumber: "2009. évi XXXVII. törvény",
    shortName: "Erdőtörvény",
    sourceUrl: "https://njt.hu/jogszabaly/2009-37-00-00",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "tvtv",
    title: "A természet védelméről",
    actNumber: "1996. évi LIII. törvény",
    shortName: "Tvtv.",
    sourceUrl: "https://njt.hu/jogszabaly/1996-53-00-00",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
  {
    id: "korm-275-2004",
    title: "Az európai közösségi jelentőségű természetvédelmi rendeltetésű területekről (Natura 2000)",
    actNumber: "275/2004. (X. 8.) Korm. rendelet",
    shortName: "Natura 2000 Korm. r.",
    sourceUrl: "https://njt.hu/jogszabaly/2004-275-20-22",
    retrievedAt: null,
    versionHash: null,
    checkedAt: ADDED_AT,
    verificationStatus: "source_added_pending_fetch",
  },
];

export function getSource(id: string): LegalSource | undefined {
  return LEGAL_SOURCES_V2.find((s) => s.id === id);
}

export type SourceRef = { sourceId: string; section?: string };

export function formatSourceRef(ref: SourceRef): string {
  const src = getSource(ref.sourceId);
  if (!src) return ref.sourceId;
  return ref.section ? `${src.shortName} ${ref.section}` : src.shortName;
}