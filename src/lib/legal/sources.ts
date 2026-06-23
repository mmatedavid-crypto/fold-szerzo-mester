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

type SnippetEntry = {
  shortName: string;
  versionHash: string;
  retrievedAt: string;
  byteLength: number;
  textLength: number;
  sectionCount: number;
  snippetCount: number;
  snippets: Array<{ section: string | null; text: string }>;
};

const SNIPPETS = snippets as Record<string, SnippetEntry>;

function meta(id: string) {
  const s = SNIPPETS[id];
  return {
    retrievedAt: s ? s.retrievedAt : null,
    versionHash: s ? s.versionHash : null,
    verificationStatus: (s ? "verified" : "source_added_pending_fetch") as SourceVerificationStatus,
  };
}

export const LEGAL_SOURCES_V2: LegalSource[] = [
  {
    id: "fftv",
    title: "A mező- és erdőgazdasági földek forgalmáról szóló törvény",
    actNumber: "2013. évi CXXII. törvény",
    shortName: "Földforgalmi tv.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-122-00-00",
    ...meta("fftv"),
    checkedAt: ADDED_AT,
  },
  {
    id: "fetv",
    title:
      "A mező- és erdőgazdasági földek forgalmáról szóló törvénnyel összefüggő egyes rendelkezésekről és átmeneti szabályokról",
    actNumber: "2013. évi CCXII. törvény",
    shortName: "Fétv.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-212-00-00",
    ...meta("fetv"),
    checkedAt: ADDED_AT,
  },
  {
    id: "inytv",
    title: "Az ingatlan-nyilvántartásról",
    actNumber: "2021. évi C. törvény",
    shortName: "Inytv.",
    sourceUrl: "https://net.jogtar.hu/jogszabaly?docid=A2100100.TV",
    ...meta("inytv"),
    checkedAt: ADDED_AT,
  },
  {
    id: "korm-179-2023",
    title:
      "Az ingatlan-nyilvántartásról szóló 2021. évi C. törvény végrehajtásáról",
    actNumber: "179/2023. (V. 15.) Korm. rendelet",
    shortName: "179/2023. Korm. r.",
    sourceUrl: "https://net.jogtar.hu/jogszabaly?docid=A2300179.KOR",
    ...meta("korm-179-2023"),
    checkedAt: ADDED_AT,
  },
  {
    id: "korm-474-2013",
    title:
      "Az elővásárlási és előhaszonbérleti jog gyakorlása érdekében hirdetményi úton történő közlés eljárási szabályairól",
    actNumber: "474/2013. (XII. 12.) Korm. rendelet",
    shortName: "474/2013. Korm. r.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-474-20-22",
    ...meta("korm-474-2013"),
    checkedAt: ADDED_AT,
  },
  {
    id: "korm-356-2007",
    title: "A földhasználati nyilvántartás részletes szabályairól",
    actNumber: "356/2007. (XII. 23.) Korm. rendelet",
    shortName: "356/2007. Korm. r.",
    sourceUrl: "https://njt.hu/jogszabaly/2007-356-20-22",
    ...meta("korm-356-2007"),
    checkedAt: ADDED_AT,
  },
  {
    id: "ptk",
    title: "A Polgári Törvénykönyvről",
    actNumber: "2013. évi V. törvény",
    shortName: "Ptk.",
    sourceUrl: "https://njt.hu/jogszabaly/2013-5-00-00",
    ...meta("ptk"),
    checkedAt: ADDED_AT,
  },
  {
    id: "pp",
    title: "A polgári perrendtartásról",
    actNumber: "2016. évi CXXX. törvény",
    shortName: "Pp.",
    sourceUrl: "https://njt.hu/jogszabaly/2016-130-00-00",
    ...meta("pp"),
    checkedAt: ADDED_AT,
  },
  {
    id: "tfvt",
    title: "A termőföld védelméről",
    actNumber: "2007. évi CXXIX. törvény",
    shortName: "Termőföldvédelmi tv.",
    sourceUrl: "https://njt.hu/jogszabaly/2007-129-00-00",
    ...meta("tfvt"),
    checkedAt: ADDED_AT,
  },
  {
    id: "evt",
    title: "Az erdőről, az erdő védelméről és az erdőgazdálkodásról",
    actNumber: "2009. évi XXXVII. törvény",
    shortName: "Erdőtörvény",
    sourceUrl: "https://njt.hu/jogszabaly/2009-37-00-00",
    ...meta("evt"),
    checkedAt: ADDED_AT,
  },
  {
    id: "tvtv",
    title: "A természet védelméről",
    actNumber: "1996. évi LIII. törvény",
    shortName: "Tvtv.",
    sourceUrl: "https://njt.hu/jogszabaly/1996-53-00-00",
    ...meta("tvtv"),
    checkedAt: ADDED_AT,
  },
  {
    id: "korm-275-2004",
    title: "Az európai közösségi jelentőségű természetvédelmi rendeltetésű területekről (Natura 2000)",
    actNumber: "275/2004. (X. 8.) Korm. rendelet",
    shortName: "Natura 2000 Korm. r.",
    sourceUrl: "https://njt.hu/jogszabaly/2004-275-20-22",
    ...meta("korm-275-2004"),
    checkedAt: ADDED_AT,
  },
  {
    id: "fvm-109-1999",
    title:
      "A földhasználati nyilvántartás részletes szabályairól szóló kormányrendelet végrehajtásához kapcsolódó FVM formanyomtatványokról (földhasználati bejelentés)",
    actNumber: "109/1999. (XII. 29.) FVM rendelet",
    shortName: "109/1999. FVM r.",
    sourceUrl: "https://njt.hu/jogszabaly/1999-109-22-22",
    ...meta("fvm-109-1999"),
    checkedAt: ADDED_AT,
  },
  {
    id: "fm-47-2014",
    title:
      "A közös tulajdonban álló mezőgazdasági földek használati megosztásáról szóló megállapodás formai és tartalmi követelményeiről",
    actNumber: "47/2014. (XI. 7.) FM rendelet",
    shortName: "47/2014. FM r.",
    sourceUrl: "https://njt.hu/jogszabaly/2014-47-22-22",
    ...meta("fm-47-2014"),
    checkedAt: ADDED_AT,
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

/**
 * Visszaadja a letöltött jogszabály §-szakasz részleteit, amelyeket a
 * szabálymotor és a klauzula-katalógus hivatkozási bizonyítékként használ.
 * A `versionHash` rögzíti, melyik szövegváltozatból származnak.
 */
export function getSourceExcerpts(sourceId: string) {
  const s = SNIPPETS[sourceId];
  if (!s) return null;
  return {
    versionHash: s.versionHash,
    retrievedAt: s.retrievedAt,
    snippets: s.snippets,
  };
}

export function findSourceExcerpt(sourceId: string, section: string) {
  const data = getSourceExcerpts(sourceId);
  if (!data) return null;
  return data.snippets.find((s) => s.section === section) ?? null;
}