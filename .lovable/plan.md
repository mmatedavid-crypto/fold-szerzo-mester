# Gyomaendrőd 2026 adásvételi kifüggesztések – csak olvasás

## Jelenlegi állapot (ellenőrizve)
- Lovable Cloud backend állapota: **szüneteltetve (paused)**.
- Belső lekérdező eszköz hibája: "database connection pooler is unavailable".
- psql: `FATAL: (ENOTFOUND) tenant/user ... not found`.
- Ezért egyetlen adatsort sem lehetett kiolvasni. Ez megmagyarázza a külső 499/502-es hibákat is.

## Teendő jóváhagyás után
1. Backend folytatása (resume). Ez az adatokat nem módosítja, csak elindítja az adatbázist. Kódot, sémát és adatot nem változtat, importot vagy szinkront nem futtat, e-mailt nem küld.
2. Csak SELECT lekérdezések:
   - Lefedettség: összes `notices` rekord, legkorábbi és legutóbbi `publication_date`, Gyomaendrőd 2026 darabszám, ugyanez árral rendelkező adásvételre; a `notice_sale_price_observations` rekordszáma.
   - Minden 2026-os gyomaendrődi adásvétel, `source_notice_id` szerint összevonva; `raw_json` és a mellékletszöveg átnézése a tulajdoni hányad (`tulhanyad`), AK és hrsz miatt.
3. Eredmény táblázatban: azonosító, dátum, hrsz, művelési ág, teljes és eladott ha, hányad, AK, vételár, Ft/eladott ha, Ft/eladott AK, hivatalos URL.
   - A már arányosított területet nem osztom újra.
   - Az erdőt és a kivett területet külön jelölöm.
   - A több hrsz-re szóló együttes vételárat nem bontom szét.
   - Hiányzó adatot nem találok ki.
