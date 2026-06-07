# Ranghely kalkulátor — újratervezés

Önálló, kalkulátor-szerű modul a `/ranghely-kalkulator` útvonalon, ami a jelenlegi 5 lépéses, kifüggesztéshez kötött varázslót helyettesíti. A meglévő `src/lib/rank/engine.ts` és admin-verziózás marad, mellé új, részletesebb haszonbérleti motor készül.

## Új útvonal és layout

- Új fájl: `src/routes/ranghely-kalkulator.tsx`
- Cím: „Ranghely kalkulátor", alcím a specifikációból, kampány-sor.
- Desktop: 3 oszlop — `Föld és ügylet` (bal), `Kifüggesztett bérlő` + `Én` (közép, 2 kártya egymás mellett), `Eredmény` (jobb, sticky).
- Mobil: accordion 4 szekcióval, sticky alsó CTA ha a user erősebb.
- Élő frissítés inputváltozásra (controlled state, nincs „következő" gomb).
- Kompakt jogi disclaimer minden nézet alján.
- Kifüggesztés-integráció: query params olvasása, kis elbocsátható chip „Kifüggesztésből indítva". Nem mutat nagy notice headert.

A `/kifuggesztesek` tetején lévő CTA és a `/kifuggesztesek/$noticeId` „Ranghely ellenőrzés" gomb erre az URL-re irányítanak át (query paramekkel előtöltve).

## Rank engine refaktor

Új fájlok, a meglévő `src/lib/rank/engine.ts` és `types.ts` érintetlen marad (admin-verzió és Notice-alapú futtatás miatt).

- `src/lib/rank/leaseRankDefinitions.ts` — minden ranghely-csoport (F10, F20, 10–80) deklaratív definíciója: `id`, `group`, `subPriority`, `branch` (forest/non_forest), `requiredConditions[]`, `legalRef`, `humanName`, `proofs[]`.
- `src/lib/rank/proofRequirements.ts` — `BASE_PROOFS`, `CONDITIONAL_PROOFS`, kategória: `kotelezo | jogcim_fuggo | jogi_ellenorzes`. `getProofsFor(rankId, status)`.
- `src/lib/rank/leaseRankEngine.ts` — `evaluateLeaseRanks({ landContext, partyStatus }) -> { possibleRanks, strongestRank, incompleteRanks, warnings, requiredProofs }`. Külön ág forest / non-forest. „Intra-group" prioritás: CSMT/ŐCSG > fiatal > sima — csak ugyanazon fő ranghelyen belül a `subPriority` tördelésével, soha nem ugrik át főcsoportot.
- `src/lib/rank/leaseRankComparison.ts` — `compareLeaseRanks(lessee, user) -> { comparison, explanation, userStrongestRank, lesseeStrongestRank, requiredProofs, missingConditions, warnings }`. Comparison értékek: `user_stronger | same_rank | user_weaker | cannot_determine | no_valid_user_rank | no_prelease_right`. Adásvétel ág azonnal `no_prelease_right` placeholder. Kivételszabályok (közeli hozzátartozó stb.) → `no_prelease_right`.
- `src/lib/rank/leaseRankEngine.test.ts` — a specifikáció 9 tesztesete.

`PartyStatus` típus tartalmazza az összes alap-, hely-, használat-, tulajdon-, speciális, csoport-belüli és kockázati flag-et a specifikáció szerint. `LandContext`: `transaction`, `branch`, `cultivationBranch`, `commonOwnership`, `coOwnerLeaseToThirdParty`, `wineGeoIndication`.

## Új UI komponensek

- `src/components/rank/LandContextCard.tsx` — szekció 1. RadioGroup-ok, művelési ág Select.
- `src/components/rank/PartyStatusCard.tsx` — szekciók 2 és 3 közös komponense, `title`, `subtitle`, preset Select, csoportosított checkbox-listák (Alap, Hely, Használat, Tulajdon, Speciális, Csoport, Kockázat). Minden checkbox: cím + egy soros magyarázat + opcionális `Mit jelent?` `Collapsible`. Touch-friendly méret.
- `src/components/rank/ResultPanel.tsx` — 6 állapot badge-ek, kifüggesztett bérlő vs te legerősebb ranghelye, jogalap, proof checklist kategóriánként, CTA-k.
- `src/components/rank/ExceptionsCollapsible.tsx` — alapból zárt, „Speciális kivételek".

## Acceptance statement CTA

`user_stronger` és `same_rank` esetén CTA. Kattintásra:
- ha bejelentkezve: szerver fn `createAcceptanceFromCalculation(snapshot)` létrehoz drafthez tartozó record-ot, navigál `/elfogado-nyilatkozat/uj?fromRankCalculation={id}`-re.
- ha anonim: `/belepes?redirect=...` + snapshot sessionStorage-ban tárolva.

Új `src/lib/rank/snapshot.functions.ts` `saveCalculationSnapshot` server fn-nel (auth védett), új tábla migrációval: `rank_calculations(id, user_id, land_context jsonb, lessee_status jsonb, user_status jsonb, user_strongest_rank, lessee_strongest_rank, comparison, created_at)`. RLS: user csak a sajátját lát/ír.

A meglévő acceptance-flow most már a két forrást fogadja: kifüggesztésből vagy kalkulátorból. Ha a tartós acceptance-modul külön rendszer, csak a redirect linket frissítjük; integrációt nem bontunk.

## Régi varázsló sorsa

- `src/routes/kifuggesztesek.$noticeId.tsx` jelenleg a 5-step wizard hostja. A wizard belső lépéseit megőrizzük, de a notice detail page jövőképében a „Ranghely kalkulátor megnyitása" gomb az új útvonalra visz át. A teljes 5-step UI lecserélése egy külön kör, most:
  - a notice oldal tetejére kerül egy felhívás: „Próbáld ki az új Ranghely kalkulátort", ami `/ranghely-kalkulator?settlement=...&branch=...` linket nyit.
  - a wizard maradhat fallback-ként, de a `/kifuggesztesek` CTA sáv az új URL-re mutat.
- `/kifuggesztesek` tetején a meglévő CTA sáv (előfizetés) érintetlen, mellé kis link: „Ranghely kalkulátor".

Ha a user határozott „távolítsd el a régi wizardot" igényt kifejez, külön körben töröljük; most a célt (önálló, egyszerű kalkulátor) az új útvonal teljesíti.

## Technikai részletek

- Forms: controlled React state, nincs react-hook-form (egyszerű, élő frissítés).
- Validáció a motorban, UI csak input.
- Snapshot mentés csak CTA-ra.
- Adásvétel branch: a `transaction === "sale"` ügyletre a komparáció `no_prelease_right` és egy magyarázó szöveg, nem fut a motor.
- A meglévő `engine.ts` és Notice-alapú admin-verziózás változatlanul használható egyéb helyeken.
- Tesztek `bunx vitest run src/lib/rank/leaseRankEngine.test.ts`-tel futnak.

## Fájlok

Új:
- `src/routes/ranghely-kalkulator.tsx`
- `src/lib/rank/leaseRankDefinitions.ts`
- `src/lib/rank/leaseRankEngine.ts`
- `src/lib/rank/leaseRankComparison.ts`
- `src/lib/rank/proofRequirements.ts`
- `src/lib/rank/leaseRankEngine.test.ts`
- `src/lib/rank/snapshot.functions.ts`
- `src/components/rank/LandContextCard.tsx`
- `src/components/rank/PartyStatusCard.tsx`
- `src/components/rank/ResultPanel.tsx`
- `src/components/rank/ExceptionsCollapsible.tsx`
- Supabase migration: `rank_calculations` tábla

Módosítva:
- `src/routes/kifuggesztesek.index.tsx` — másodlagos link az új kalkulátorra
- `src/routes/kifuggesztesek.$noticeId.tsx` — felső banner az új kalkulátorra
