function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "");
}

export function authErrorMessage(error: unknown): string {
  const message = messageOf(error).toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Nem stimmel az e-mail cím vagy a jelszó. Nézd át még egyszer, és próbáld újra.";
  }

  if (message.includes("email not confirmed")) {
    return "A fiók e-mail címét még meg kell erősíteni. Nézd meg a postaládádat.";
  }

  if (message.includes("user already registered") || message.includes("already registered")) {
    return "Ehhez az e-mail címhez már tartozik Dr Föld fiók. Próbálj belépni.";
  }

  if (message.includes("password") && message.includes("6")) {
    return "A jelszó legyen legalább 6 karakter hosszú.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Túl sok próbálkozás történt rövid idő alatt. Várj egy kicsit, majd próbáld újra.";
  }

  return "Most nem sikerült a fiókművelet. Kérjük, próbáld újra pár perc múlva.";
}

export function paymentErrorMessage(error: unknown): string {
  const message = messageOf(error);

  if (message.includes("Nincs elérhető szerződés-kredited")) {
    return message;
  }

  if (message.includes("online fizetés jelenleg nincs bekapcsolva")) {
    return message;
  }

  return "A fizetési vagy véglegesítési lépés most nem sikerült. Kérjük, próbáld újra később.";
}

export function contractFlowErrorMessage(error: unknown): string {
  const message = messageOf(error);
  const lower = message.toLowerCase();

  if (lower.includes("not found") || lower.includes("nincs")) {
    return "Ezt a szerződésvázlatot vagy dokumentumot most nem találjuk. Lehet, hogy már törölted, vagy nem ehhez a fiókhoz tartozik.";
  }

  if (lower.includes("credit") || lower.includes("kredit") || lower.includes("előfizetési")) {
    return message;
  }

  if (
    lower.includes("permission") ||
    lower.includes("row-level") ||
    lower.includes("unauthorized")
  ) {
    return "Ehhez a dokumentumhoz nincs hozzáférésed ezzel a fiókkal.";
  }

  return "Most nem sikerült betölteni vagy véglegesíteni ezt a szerződéslépést. Kérjük, próbáld újra később.";
}
