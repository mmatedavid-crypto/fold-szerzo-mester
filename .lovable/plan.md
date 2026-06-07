# Phase 2 — Ranghely kalkulátor és Elfogadó nyilatkozat generátor

Nagy, önálló feature. A Phase 1 (szerződés generálás) és Phase 3 (kifüggesztés szinkron) érintetlenül marad. Több részből álló munka — a terv lebontva sprintekre, hogy követhető legyen.

## Mit építünk

A földforgalmi törvény (2013. évi CXXII. tv.) 46. §-a alapján egy elővásárlási/előhaszonbérleti **ranghely-kalkulátor**, ami megmondja egy felhasználónak (földhasználónak / földművesnek / helyi lakosnak / stb.):
- van-e elővásárlási vagy előhaszonbérleti joga a kifüggesztett ajánlatra,
- ha igen, milyen ranghelyen,
- erősebb-e, mint a szerződő fél ranghelye,
- ha erősebb → felajánljuk az **elfogadó nyilatkozat** generálását (15 napos határidőre figyelmeztetéssel).

A generált elfogadó nyilatkozat fizetés mögötti PDF, QR kóddal, publikus verifikációs URL-lel, audit loggal.

## Sprintek (külön körökben mergelve)

### Sprint 1 — Adatmodell + Rank engine váz
- Új táblák: `rank_rules` (verzionált szabálykészlet), `acceptance_drafts`, `acceptance_documents`, `acceptance_verifications`.
- Rank engine `src/lib/rank/engine.ts` tisztán függvénykönyvtárként:
  - bemenet: `Notice` + `ClaimantProfile` (földműves-e, helyi lakos-e, szomszédos földhasználó-e, állattartó-e, családi gazdaság tag-e, erdő-e a föld, stb.)
  - kimenet: `{ rank: number|null, reason: string, branch: 'forest'|'non_forest', warnings: string[] }`
- Külön ág: `non_forest_46` (1)/(2)/(3)/(4) bekezdés, és `forest_*` (Evt. szerinti) — nem keverjük.
- Nincs jog összeadás — mindig **a legerősebb egy** ranghely.
- Same-rank tiebreaker logika (helyi lakos < földműves, stb. ahol a törvény írja).
- "No-prelease" kivételek (közeli hozzátartozó, állam, önkormányzat, egyházi jogi személy adott esetben) → engine visszaadja `null` ranghelyet + warning.
- 100% unit teszt coverage az engine-re (Vitest), legalább 25 case.

### Sprint 2 — UI: Ranghely kalkulátor a kifüggesztés cardon
- `/kifuggesztesek/$noticeId` route (új): bemutatja a hirdetményt.
- "Van-e elővásárlási jogom?" wizard (4-5 lépés, mobilra optimalizált, magyar nyelv).
- Eredmény panel: rangsor, indoklás, figyelmeztetések (törvényhivatkozással).
- Ha a felhasználó ranghelye erősebb mint a szerződő fél (akit a kifüggesztés említ) → **CTA**: "Készíts elfogadó nyilatkozatot".
- Anonim felhasználó futtathat számítást, de nem mentődik el (csak session state).

### Sprint 3 — Elfogadó nyilatkozat draft + 15 napos határidő
- Bejelentkezés kötelező a draft mentéshez.
- `acceptance_drafts` tábla: user_id, notice_id, claimant_data, computed_rank, deadline_date (kifüggesztés publication_date + 15 nap), status (draft/finalized).
- Deadline UI: countdown timer, lejárt drafton nem lehet finalizálni.
- RLS: `user_id = auth.uid()` szigorúan — senki nem látja más drafját.

### Sprint 4 — Fizetés + PDF generálás + QR + verifikáció
- Új plan SKU: `acceptance_statement_single` (egyszeri vásárlás) — reuse existing `document_credits` infra.
- PDF generálás server functionben (`pdf-lib`, ugyanaz a stack mint a szerződéseknél).
- QR kód a PDF-en → `https://<host>/v/acceptance/<token>` publikus verifikáció.
- `acceptance_verifications` tábla: token, document_hash, issued_at, **semmi PII** — a publikus oldal csak ezt mutatja: "Ez egy eredeti, [dátum]-on kibocsátott elfogadó nyilatkozat. Település: X. Hrsz.: Y."
- Tárolás: `contracts` bucket-be új mappa, signed URL.
- `usage_logs` minden lépéshez (draft.created, draft.finalized, document.downloaded, verification.viewed).

### Sprint 5 — Admin szabálykezelő + audit
- `/admin/rank-rules` — admin szerkesztheti az aktív `rank_rules` verziót (csak `has_role(admin)`).
- Verziózás: új szabálykészlet aktiválása új sor (immutable history).
- Minden kalkuláció elmenti, hogy melyik `rank_rules.version`-nel készült (audit trail).
- Külső jogszabály (Evt., családi gazdaság tv.) → placeholder modul `src/lib/rank/external/` jelöli a TODO pontokat.

## Mit kérek tőled most

Ez 5 sprint, jól láthatóan nem fér egy körbe. Javaslatom:

**Most ebben a körben Sprint 1-et csinálom meg teljesen** (DB migráció + rank engine + 25+ unit teszt). Ez a feature gerince, és önállóan reviewálható.

Utána egy-egy körben jönnek a többi sprintek a sorrendben.

Ha jóváhagyod a tervet, **Sprint 1**-gyel indítok. Ha más sorrendet vagy más bontást szeretnél (pl. előbb a UI mockot lássuk működő engine nélkül), írd meg.
