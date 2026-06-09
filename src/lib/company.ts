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
