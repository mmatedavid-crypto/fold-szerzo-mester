export const company = {
  brandName: "Dr Föld",
  domain: "drfold.hu",
  websiteUrl: "https://drfold.hu",
  contactEmail: "hello@drfold.hu",
  legalName: "Precíziós Agrokémia Zrt.",
  fullLegalName: "Precíziós Agrokémia Zártkörűen Működő Részvénytársaság",
  registeredSeat: "2636 Tésa, Ady Endre utca 11.",
  companyRegistrationNumber: "13-10-042640",
  taxNumber: "26558534-2-13",
} as const;

export const companyLegalLine = `${company.legalName} (székhely: ${company.registeredSeat}, cégjegyzékszám: ${company.companyRegistrationNumber}, adószám: ${company.taxNumber})`;

export const companyLegalLineAscii = `${company.legalName
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")} (szekhely: ${company.registeredSeat
  .normalize("NFD")
  .replace(
    /[\u0300-\u036f]/g,
    "",
  )}, cegjegyzekszam: ${company.companyRegistrationNumber}, adoszam: ${company.taxNumber})`;

export const companyLegalDisclaimer =
  "A Dr Föld dokumentumgeneráló és döntéstámogató szolgáltatás, nem ügyvédi iroda. Egyedi, vitás vagy nagy értékű ügyben ügyvédi ellenőrzés javasolt.";

export const companyLegalDisclaimerAscii =
  "A Dr Fold dokumentumgeneralo es dontestamogato szolgaltatas, nem ugyvedi iroda. Egyedi, vitas vagy nagy erteku ugyben ugyvedi ellenorzes javasolt.";
