## Cél

A meglévő `composeContract` + `computeRiskReport` + `finalizeContract` láncot NEM cseréljük. Föléje húzunk öt új réteget, és a meglévő logika ezeket hívja meg.

Hard stop: új generátor NEM készül. A `src/lib/contracts/compose.server.ts`, `logic.ts`, `finalize.functions.ts`, `pdf.server.ts` változatlanul marad, csak a kimeneteit terjesztjük ki / kapuzzuk.

## Új modulok (mind `lawyer_review_required` alapstátusszal)

```text
src/lib/legal/
  sources.ts          → legalSources katalógus (NJT linkek)
  rules.ts            → legalRules objektumok (16 szabály)
  clauses.ts          → clauseLibrary (22 klauzulamodul, csak ezekből épülhet)
  placeholders.ts     → placeholder-detektor regexek + ellenőrző fn
  status.ts           → státusz-enum + export-kapu
  engine.ts           → szabálymotor: draft → { status, blockers, warnings, requiredClauses, checklist }
  audit.ts            → smoke teszt-készlet (11 forgatókönyv)
```

### 1. `sources.ts` — jogforrás-katalógus
10 forrás: 2013/CXXII (Földforgalmi tv.), 2013/CCXII (Fétv.), 474/2013. Korm. r., 356/2007. Korm. r., 2013/V (Ptk.), 2016/CXXX (Pp.), 2007/CXXIX (termőföld védelme), 2009/XXXVII (erdőtörvény), 1996/LIII (természetvédelmi), 275/2004. Korm. r. (Natura 2000).
Mező-séma: `id`, `title`, `actNumber`, `shortName`, `sourceUrl` (NJT), `retrievedAt`, `versionHash`, `verificationStatus: 'lawyer_review_required' | 'source_added_pending_fetch' | 'verified'`.
Automatikus letöltés nem garantált → minden forrás induláskor `source_added_pending_fetch`.

### 2. `rules.ts` — szabálymotor szabályai
16 szabály a kérés szerint (alap haszonbérlet, két tanús magánokirat, haszonbérlő jogosultság, földműves/termelőszervezet, időtartam 1–20 év, díj, természetbeni mennyiség, előhaszonbérleti ranghely, jegyzői közzététel, hatósági jóváhagyás, földhasználati nyilvántartás, közös tulajdon, több hrsz, erdő stop, Natura/védett, talajvédelem, alhaszonbérlet, placeholder-validáció).
Séma: `id`, `title`, `sourceRefs[]`, `appliesWhen(draft)`, `requiredFacts[]`, `requiredClauses[]`, `riskLevel`, `blocksFinalizationWhen(draft)`, `auditQuestions[]`, `reviewStatus`.
AI nem dönt: a motor csak ezeket alkalmazza.

### 3. `clauses.ts` — klauzulakönyvtár
22 előre definiált modul (felek, földterület, közös tulajdon, időtartam, pénzbeli/természetbeni díj, fizetési határidő, jogosultsági nyilatkozat, földműves/termelőszervezet nyilatkozat, ranghely nyilatkozat, jegyzői/hatósági/földhasználati workflow, művelési-talajvédelmi kötelezettség, alhaszonbérlet tiltás, birtokbaadás, megszűnés, két tanús aláírási blokk, mellékletek).
Séma: `id`, `title`, `bodyTemplate`, `sourceRefs[]`, `requiredFacts[]`, `appliesWhen(draft)`, `riskLevel`, `reviewStatus`.
`composeContract` mostantól ezekből választ — a meglévő DB-klauzulák a könyvtárhoz mappelve maradnak fallbackként.

### 4. `placeholders.ts` — placeholder-detektor
Regex-lista: `[\.\.\.]`, `…`, `TODO`, `FIXME`, üres dátum/összeg/hrsz/AK/tanú, "megegyezés szerint", "később pontosítandó". Függvény: `detectPlaceholders(text|draft) → PlaceholderHit[]`.

### 5. `status.ts` + `engine.ts` — státuszgép és export-kapu
Státuszok pontosan: `HIANYOS_TERVEZET`, `SPECIALIS_UGY_STOP`, `JEGYZOI_KOZZETETELRE_VAR`, `HATOSAGI_JOVAHAGYASRA_VAR`, `ALAIHATONAK_TUNO_TERVEZET`. Tiltott címkék fixen blokkolva (`JOGILAG_HIBATLAN`, `AI_APPROVED`, stb.) — típusszinten kizárva.

`evaluateDraft(draft)` → `{ status, blockers, warnings, requiredClauses, checklist, missingFacts, placeholders }`.

Kapu szabályok:
- jegyzői közzététel NEM blokkolja a generálást → státusz + checklist + PDF intro szöveg
- hatósági jóváhagyás NEM blokkolja → státusz + checklist + figyelmeztetés
- bármi a 11-es stop-rule listából → `HIANYOS_TERVEZET` vagy `SPECIALIS_UGY_STOP` + vízjeles PDF "HIÁNYOS TERVEZET – NEM ALÁÍRHATÓ"
- minden zöld + teljes két tanú + nincs placeholder → `ALAIHATONAK_TUNO_TERVEZET`

## Beépítés a meglévő láncba (minimális invazív)

1. `src/lib/contracts/logic.ts` `computeRiskReport` végén meghív `evaluateDraft` és belekeveri a blokkereket/figyelmeztetéseket a `RiskReport`-ba (új `category: 'jogszabalyi_motor'`).
2. `src/lib/contracts/compose.server.ts`: a végén checklist-szekció (jegyzői/hatósági workflow), és ha státusz nem `ALAIHATONAK_TUNO_TERVEZET`, watermark-instrukciót küld a PDF-rendernek.
3. `src/lib/contracts/pdf.server.ts`: új paraméter `watermark?: string`. Ha jelen van → minden lapra diagonális szürke "HIÁNYOS TERVEZET – NEM ALÁÍRHATÓ" felirat.
4. `src/lib/contracts/finalize.functions.ts`: a `risk.can_finalize` ellenőrzés helyett `evaluateDraft(draft).status`-t nézi. Ha `HIANYOS_TERVEZET` vagy `SPECIALIS_UGY_STOP` és placeholder van → hibát dob. Ha workflow-státusz vagy aláírhatónak tűnő → engedi, vízjel csak adat-hiánynál.
5. `RiskReport` típus változatlan, csak új mezőkkel bővül (`status`, `checklist`) — UI a meglévő `_authenticated/szerzodes.$id.ellenorzes.tsx` lapon kiegészülve mutatja a státusz-badge-et és a workflow checklist-et.

## Audit / smoke

`src/lib/legal/audit.ts` 11 fixture-t futtat (egyszerű magánszemély, hiányzó tanúk, nem földműves kivétel nélkül, hibás időtartam, természetbeni bér mennyiség nélkül, ranghely bizonyíték nélkül, közös tulajdon, erdő stop, Natura, jegyzői közzététel nem-stop, hatósági jóváhagyás workflow, placeholder smoke). Egyszerű `runAudit()` fn JSON riportot ad. Vitest fájl: `src/lib/legal/audit.test.ts` minden esetre.

## Mit NEM csinálunk most

- Nem töltünk le NJT-tartalmakat (forrás `source_added_pending_fetch` marad — manuális ügyvédi review kell).
- Nem írunk át UI-t a `foldberleti-szerzodes.tsx` űrlapon — csak az ellenőrző oldal kap státusz-badge-et.
- Nem nyúlunk az `acceptance` (elfogadó nyilatkozat) lánchoz.
- Nem érintjük a DB sémát.

## Záró riport (a kód végén `runAudit()` futtatás)

- 10 forrás regisztrálva, mind `source_added_pending_fetch`
- 16 szabály regisztrálva, mind `lawyer_review_required`
- 22 klauzulamodul + sourceRefs-szel összekötve
- 11 stop-rule aktív + placeholder smoke
- Jegyzői közzététel és hatósági jóváhagyás workflow-státusz (NEM blokkoló) — auditban igazolt
- Vízjeles PDF csak hiányos/speciális ügynél

OK?
