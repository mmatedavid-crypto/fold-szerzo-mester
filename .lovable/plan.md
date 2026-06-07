# Ranghely kalkulátor újraépítés — Dr Föld

Cél: a jelenlegi hosszú, wizard-szerű kalkulátort lecseréljük egy **gyors, mobilbarát, chip-alapú** összehasonlító eszközre. „Bejelölöm, mi ő. Bejelölöm, mi vagyok én. Dr Föld megmondja, ki áll előrébb."

## Felhasználói élmény

**Két mód, ugyanaz a motor:**
1. **Gyors kalkulátor** (alapértelmezett, `/ranghely-kalkulator`) — egy oldal, négy kompakt blokk, sticky eredmény jobbra (desktop) / alulra (mobil).
2. **Kérdezz-felelek** (toggle: „Nem tudom, mit válasszak — kérdezzen a Dr Föld") — max 6 nagy gombos képernyő.

**Oldalcím:** „Ki áll előrébb a haszonbérleti rangsorban?"
**Alcím:** „Válaszd ki, mi igaz a kifüggesztett bérlőre és mi igaz rád. Dr Föld megmutatja, kinek lehet erősebb előhaszonbérleti ranghelye."
**Kampány:** „Ravasz a gazda: nézd meg, hol állsz a sorban."

## Oldalfelépítés (Gyors kalkulátor)

**A. Föld** — kompakt kártya
- Ügylet (Haszonbérlet / Adásvétel disabled)
- Föld típusa: **Termőföld** / **Erdő / fásított terület** (nem „Nem erdő")
- Művelési ág dropdown (szántó, rét/legelő/gyep, kert, szőlő, gyümölcsös, rizstelep, nádas/halastó/egyéb, erdő, nem tudom)
- Közös tulajdon (igen/nem/nem tudom)
- Accordion „Haladó földadatok": vegyes alrészlet + melyik nagyobb, tulajdonostárs harmadiknak ad, egybefoglalt haszonbér, borszőlő/hegyközség

**B. Kifüggesztett bérlő** — nagy „Kiválasztom gyorsan" dropdown preset listával → kiválasztott chipek → „+ Másik jogcím hozzáadása" gomb nyit kompakt csoportos chip-választót (Alap / Hely és kapcsolat / Korábbi használat / Tulajdon / Erős speciális / Csoporton belüli előny / Akadályok). NEM 40-item legal checklist by default.

**C. Te** — ugyanaz mint B, első személyben. „Nem vagyok biztos benne" gomb → Kérdezz-felelek mód.

**D. Eredmény** — sticky badge-stílusú panel
- Empty state: „Pipálj be pár dolgot" (NEM negatív eredmény)
- 6 result type, mindegyik saját badge + szöveg + CTA:
  1. `user_stronger`: „TE ÁLLHATSZ ELŐRÉBB" → „Elfogadó nyilatkozatot készítek" (primary)
  2. `same_rank`: „AZONOS RANGHELY" → „Elfogadó nyilatkozat előkészítése" + warning
  3. `user_weaker`: „A BÉRLŐ ÁLLHAT ELŐRÉBB" → „Mi hiányozhat nálad?" lista, no paid CTA
  4. `lessee_unknown`: „A BÉRLŐ RANGHELYE NEM ISMERT" → user legerősebb + CTA warninggel
  5. `incomplete_special`: „HIÁNYOS ERŐS JOGCÍM" → „Hiányzó feltételek bepipálása"
  6. `no_valid`: „NEM LÁTSZIK BIZTOS JOGCÍM"
  7. `exception`: „KIVÉTEL LEHET" (tranzakciós kivétel esetén, no primary CTA)
- Proof checklist 3 kategóriában (Alap / Jogcímtől függő / Jogi ellenőrzés) + „Igazolási lista másolása" gomb
- Expandable „Jogszabályi háttér" csak releváns hivatkozásokkal

## Logikai motor változások

`src/lib/rank/leaseRankDefinitions.ts`, `leaseRankEngine.ts`, `leaseRankComparison.ts`, `proofRequirements.ts` finomítása + új `rankPresets.ts` (chip-presetek és dropdown opciók).

**Főbb pontosítások:**
- Termőföld (non_forest) main groups: G10 (volt haszonbérlő + 46.§(3) speciálisok) → G20 (földműves tulajdonostárs) → G30 helybeli szomszéd → G40 helybeli → G50 20km → G60 helybeli szervezet szomszéd → G70 helybeli szervezet → G80 20km szervezet
- Erdő (forest): külön ranghelyek, nem-erdő speciálisok itt nem érvényesek
- Vegyes parcella: nagyobb terület határoz; ismeretlen → bizonytalanság
- **Intra-group**: CSMT/ŐCSG > Fiatal > Sima — csak ugyanazon csoporton belül, természetes személy farmer-csoportokra. Nem ugrik főcsoportot. Szervezetekre nem alkalmazandó.
- **Speciális top-rank feltételek** szigorúbb validálással (állattartó: helyben lakó + takarmány cél + állatsűrűség + 3 év; bio/öko csak szántó/kert/szőlő/gyümölcsös + helyben lakó + öko cél; kertészet csak kert/szőlő/gyümölcsös; szaporítóanyag csak szántó; öntözés szántó/szőlő/gyümölcsös/kert + ≥50% öntözhető + számviteli érték a futamidő feléig)
- **„Jelenlegi földhasználó" rank törölve** — csak proof condition
- **„Közeli hozzátartozó" checkbox törölve** a party kártyáról — tranzakciós kivételbe kerül („Ritkább kivételek" blokk a Föld kártya alján vagy külön Exceptions panelben)
- Volt haszonbérlő: 3 éves közvetlen használat feltétel, ha nincs/unknown → incomplete

## Kivételek

Külön „Ritkább kivételek" blokk (collapsed): hozzátartozói láncolat, gazdaságátadás, MgTermSzerv+tag, erdőbirtokossági társulat+tag, tanya, CSMT+tag, öntözéses tv. Ha bármelyik bejelölt → eredmény „KIVÉTEL LEHET", nincs primary CTA.

## CTA flow

`user_stronger` / `same_rank` → snapshot mentés (sessionStorage + opcionálisan szerver), redirect `/elfogado-nyilatkozat/uj?fromRankCalculation={id}` átadva: landContext, statuses, strongest ranks, comparison, references, proofs, warnings.

## Brand / footer

- „Dr Föld" mindenhol a kalkulátorban (nem „Földbérleti Szerződés")
- Footer-ben és dokumentumokban `drfold.hu` referencia a `foldberletiszerzodes.hu` helyett (`src/components/layout/site-footer.tsx`)

## Érintett fájlok

**Frissítés:**
- `src/routes/ranghely-kalkulator.tsx` — új layout, két mód toggle
- `src/components/rank/LandContextCard.tsx` — Termőföld label, művelési ág bővítés, haladó accordion
- `src/components/rank/PartyStatusCard.tsx` — chip-alapú UI, preset dropdown, csoportos hozzáadó
- `src/components/rank/ResultPanel.tsx` — empty state, új result type-ok, proof copy, jogszabályi háttér
- `src/components/rank/ExceptionsCollapsible.tsx` — tranzakciós kivételek
- `src/lib/rank/leaseRankDefinitions.ts` — finomítások, „jelenlegi földhasználó" törlése
- `src/lib/rank/leaseRankEngine.ts` — incomplete special detektálás, exception handling
- `src/lib/rank/leaseRankComparison.ts` — új comparison típusok (lessee_unknown, incomplete_special, exception)
- `src/lib/rank/leaseTypes.ts` — close_relative mező eltávolítva, tranzakciós exception mezők
- `src/lib/rank/proofRequirements.ts` — Hely/Korábbi/Tulajdon csoportosítás
- `src/components/layout/site-footer.tsx` — drfold.hu

**Új:**
- `src/lib/rank/rankPresets.ts` — preset dropdown opciók, chip csoportok
- `src/components/rank/GuidedFlow.tsx` — Kérdezz-felelek mód (max 6 lépés)
- `src/components/rank/ResultBadge.tsx` — stamp/badge komponens

**Nem érintünk:**
- elfogadó nyilatkozat generátor, payment, dashboard, admin, PDF, dokumentum-ellenőrzés, notice integráció

## Tesztek

A 10 megadott eset manuális verifikációja a preview-ban a build után.
