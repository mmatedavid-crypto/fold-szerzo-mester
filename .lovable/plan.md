## Regisztráció és belépés bővítése Apple bejelentkezéssel

Jelenleg csak e-mail + jelszó regisztráció működik. A cél: maradjon az e-mail/jelszó (név, e-mail, jelszó mezőkkel), és emellé jöjjön be az **Apple bejelentkezés** Lovable Cloud managed OAuth-on keresztül, mind a regisztráció, mind a belépés oldalon.

### Mit csinálok

1. **Apple provider bekapcsolása** Lovable Cloudon (managed mód, nem kell saját Apple Developer fiók a felhasználónak).
2. **Lovable auth modul** beillesztése (`src/integrations/lovable/`) — ezt a tool generálja, nem nyúlok hozzá kézzel.
3. **`/regisztracio` oldal**:
   - Megmarad: Név, E-mail, Jelszó mezők + „Regisztrálok" gomb.
   - Új: vízszintes elválasztó („vagy"), alatta **„Folytatás Apple-lel"** gomb.
   - Apple gomb `lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin + "/dashboard" })`-t hív.
4. **`/belepes` oldal**: ugyanaz — e-mail/jelszó űrlap megmarad, alá kerül az Apple gomb.
5. **Új komponens** `src/components/auth/apple-button.tsx` — újrahasznosítható gomb az Apple ikonnal, hogy ne duplikáljam a logikát.
6. Hibakezelés: ha az Apple flow `error`-t ad, magyar nyelvű toast (`sonner`). Ha `redirected`, hagyjuk a böngészőt átirányítani.

### Mihez NEM nyúlok

- A `users_profile` triggert (`handle_new_user`) nem módosítom — Apple-lel érkező user is automatikusan kap profilt és `user` szerepkört, mert a trigger `auth.users` insert-re fut.
- Google-t most nem kapcsolom be (csak Apple-t kérted az e-mail mellé).
- Adatbázis-séma, üzleti logika, szerződés-varázsló érintetlen marad.

### Megerősítést kérek

- **Managed Apple** (alapértelmezett, semmi setup nem kell) megfelel, vagy saját Apple Developer credentials-zel akarod (BYOC, ehhez Team ID, Key ID, .p8 kulcs, Services ID kellene tőled)?
