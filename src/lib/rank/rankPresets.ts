/**
 * Preset-listák a "Kiválasztom gyorsan" dropdownhoz és a chip-csoportokhoz.
 * Külön szótár első és harmadik személyű címkékhez.
 */

import { EMPTY_PARTY, type PartyStatus } from "./leaseTypes";

export type Voice = "third" | "first";

export interface Preset {
  value: string;
  label: Record<Voice, string>;
  apply: (p: PartyStatus) => PartyStatus;
}

const merge = (p: PartyStatus, patch: Partial<PartyStatus>): PartyStatus => ({ ...p, ...patch });

export const PRESETS: Preset[] = [
  { value: "unknown", label: { third: "Nem tudom", first: "Nem tudom" }, apply: (p) => merge(p, { unknown_status: true }) },
  { value: "former_lessee", label: { third: "Volt haszonbérlő", first: "Volt haszonbérlő vagyok" }, apply: (p) => merge(p, { farmer_natural: true, former_lessee: true, used_3_years: true, local_resident: true }) },
  { value: "local_neighbor", label: { third: "Helyben lakó szomszéd földműves", first: "Helyben lakó szomszéd vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true, local_neighbor: true }) },
  { value: "local_resident", label: { third: "Helyben lakó földműves", first: "Helyben lakó földműves vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true }) },
  { value: "within_20km", label: { third: "20 km-en belüli földműves", first: "20 km-en belüli vagyok" }, apply: (p) => merge(p, { farmer_natural: true, within_20km: true }) },
  { value: "co_owner", label: { third: "Földműves tulajdonostárs", first: "Földműves tulajdonostárs vagyok" }, apply: (p) => merge(p, { farmer_natural: true, co_owner_farmer: true }) },
  { value: "org_producer", label: { third: "Mezőgazdasági termelőszervezet", first: "Mezőgazdasági termelőszervezet vagyok" }, apply: (p) => merge(p, { org_producer: true }) },
  { value: "org_local", label: { third: "Helybeli mezőgazdasági termelőszervezet", first: "Helybeli mezőgazdasági termelőszervezet vagyok" }, apply: (p) => merge(p, { org_producer: true, org_local: true }) },
  { value: "org_local_neighbor", label: { third: "Helybeli szervezet szomszéd", first: "Helybeli szervezet szomszéd vagyok" }, apply: (p) => merge(p, { org_producer: true, org_local: true, org_local_neighbor: true }) },
  { value: "org_within_20km", label: { third: "20 km-en belüli szervezet", first: "20 km-en belüli szervezet vagyok" }, apply: (p) => merge(p, { org_producer: true, org_within_20km: true }) },
  { value: "animal_holder", label: { third: "Állattartó", first: "Állattartó vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true, animal_holder: true, feed_purpose: true, animal_density_ok: true }) },
  { value: "organic", label: { third: "Bio / ökológiai gazdálkodó", first: "Bio / ökológiai gazdálkodó vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true, organic_purpose: true }) },
  { value: "geo_indication", label: { third: "Földrajzi árujelzős termelő", first: "Földrajzi árujelzős termelő vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true, geo_indication_purpose: true }) },
  { value: "horticulture", label: { third: "Kertészeti termelő", first: "Kertészeti termelő vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true, horticulture_purpose: true }) },
  { value: "seed", label: { third: "Szaporítóanyag-előállító", first: "Szaporítóanyag-előállító vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true, seed_purpose: true }) },
  { value: "irrigation", label: { third: "Öntözésfejlesztő", first: "Öntözésfejlesztő vagyok" }, apply: (p) => merge(p, { farmer_natural: true, local_resident: true, irrigation_invested: true, irrigation_half_land: true, irrigation_half_term: true }) },
  { value: "rice", label: { third: "Rizstelep volt haszonbérlője", first: "Rizstelep volt haszonbérlője vagyok" }, apply: (p) => merge(p, { farmer_natural: true, rice_former_lessee: true }) },
  { value: "young_farmer", label: { third: "Fiatal földműves", first: "Fiatal földműves vagyok" }, apply: (p) => merge(p, { farmer_natural: true, young_farmer: true, local_resident: true }) },
  { value: "csmt", label: { third: "CSMT / ŐCSG tag", first: "CSMT / ŐCSG tag vagyok" }, apply: (p) => merge(p, { farmer_natural: true, csmt_member: true, local_resident: true }) },
  { value: "multi", label: { third: "Több jogcíme is lehet", first: "Több is igaz rám" }, apply: (p) => p },
];

export type ChipKey = Exclude<keyof PartyStatus, "current_user" | "close_relative">;

export interface ChipDef {
  key: ChipKey;
  label: Record<Voice, string>;
}

export interface ChipGroup {
  label: string;
  chips: ChipDef[];
}

export const CHIP_GROUPS: ChipGroup[] = [
  {
    label: "Alap",
    chips: [
      { key: "farmer_natural", label: { third: "Földműves természetes személy", first: "Földműves vagyok" } },
      { key: "org_producer", label: { third: "Mezőgazdasági termelőszervezet", first: "Mg. termelőszervezet vagyok" } },
      { key: "unknown_base", label: { third: "Nem tudom (alap)", first: "Nem tudom (alap)" } },
    ],
  },
  {
    label: "Hely és kapcsolat",
    chips: [
      { key: "local_resident", label: { third: "Helyben lakó", first: "Helyben lakó vagyok" } },
      { key: "local_neighbor", label: { third: "Helyben lakó szomszéd", first: "Szomszédos földem van" } },
      { key: "within_20km", label: { third: "20 km-en belüli", first: "20 km-en belül lakom / vagyok" } },
      { key: "org_local", label: { third: "Helybeli szervezet", first: "Helybeli szervezet vagyok" } },
      { key: "org_local_neighbor", label: { third: "Helybeli szervezet szomszéd", first: "Helybeli szervezet szomszéd vagyok" } },
      { key: "org_within_20km", label: { third: "20 km-en belüli szervezet", first: "20 km-en belüli szervezet vagyok" } },
    ],
  },
  {
    label: "Korábbi használat",
    chips: [
      { key: "former_lessee", label: { third: "Volt haszonbérlő", first: "Volt haszonbérlő vagyok" } },
      { key: "used_3_years", label: { third: "Legalább 3 éve közvetlenül megelőzően használta", first: "Legalább 3 éve közvetlenül megelőzően használtam" } },
      { key: "metayer_lessee", label: { third: "Volt részesművelő / feles bérlő", first: "Volt részesművelő / feles bérlő vagyok" } },
      { key: "forest_former_manager", label: { third: "Volt erdőgazdálkodó (erdő)", first: "Volt erdőgazdálkodó vagyok (erdő)" } },
    ],
  },
  {
    label: "Tulajdon",
    chips: [
      { key: "co_owner_farmer", label: { third: "Földműves tulajdonostárs", first: "Földműves tulajdonostárs vagyok" } },
    ],
  },
  {
    label: "Erős speciális jogcímek",
    chips: [
      { key: "animal_holder", label: { third: "Állattartó", first: "Állattartó vagyok" } },
      { key: "feed_purpose", label: { third: "Takarmányszükséglet a cél", first: "Takarmány-szükségletre kell" } },
      { key: "animal_density_ok", label: { third: "Megfelelő állatsűrűség igazolható", first: "Állatsűrűségem igazolható" } },
      { key: "organic_purpose", label: { third: "Bio / ökológiai gazdálkodás a cél", first: "Bio / ökológiai gazdálkodás a célom" } },
      { key: "geo_indication_purpose", label: { third: "OFJ termék előállítása a cél", first: "OFJ terméket állítok elő" } },
      { key: "horticulture_purpose", label: { third: "Kertészeti tevékenység a cél", first: "Kertészeti tevékenységet végzek" } },
      { key: "seed_purpose", label: { third: "Szaporítóanyag-előállítás a cél", first: "Szaporítóanyagot állítok elő" } },
      { key: "irrigation_invested", label: { third: "Öntözésfejlesztési beruházás", first: "Öntözésfejlesztési beruházásom van" } },
      { key: "irrigation_half_land", label: { third: "A föld legalább fele öntözhető", first: "A föld legalább felét öntözöm" } },
      { key: "irrigation_half_term", label: { third: "A beruházás a futamidő legalább feléig értékkel bír", first: "A beruházás a futamidő legalább feléig értékkel bír" } },
      { key: "rice_former_lessee", label: { third: "Rizstelep volt haszonbérlője", first: "Rizstelep volt haszonbérlője vagyok" } },
    ],
  },
  {
    label: "Csoporton belüli előny",
    chips: [
      { key: "csmt_member", label: { third: "CSMT tag", first: "CSMT tag vagyok" } },
      { key: "ocsg_member", label: { third: "ŐCSG tag", first: "ŐCSG tag vagyok" } },
      { key: "young_farmer", label: { third: "Fiatal földműves", first: "Fiatal földműves vagyok" } },
    ],
  },
  {
    label: "Akadályok",
    chips: [
      { key: "has_use_debt", label: { third: "Földhasználati díjtartozás", first: "Földhasználati díjtartozásom van" } },
      { key: "recent_penalty", label: { third: "Releváns földvédelmi / földhasználati bírság", first: "Releváns bírságom van" } },
      { key: "bankruptcy", label: { third: "Csőd / felszámolás / végelszámolás", first: "Csőd / felszámolás / végelszámolás" } },
      { key: "unknown_status", label: { third: "Nem tudom", first: "Nem tudom" } },
    ],
  },
];

export const TRANSACTION_EXCEPTIONS: { value: string; label: string }[] = [
  { value: "kin_chain", label: "Hozzátartozói láncolat" },
  { value: "farm_transfer", label: "Gazdaságátadási szerződés" },
  { value: "org_member", label: "Mg. termelőszervezet és tag / alkalmazott speciális esete" },
  { value: "forest_society_member", label: "Erdőbirtokossági társulat és tagja" },
  { value: "homestead", label: "Tanya haszonbérlete" },
  { value: "csmt_member_party", label: "CSMT és tagja közötti ügylet" },
  { value: "irrigation_act", label: "Öntözéses gazdálkodási törvény szerinti ügylet" },
  { value: "unknown", label: "Nem tudom" },
];

export function applyPresetByValue(value: string, current: PartyStatus): PartyStatus {
  const p = PRESETS.find((x) => x.value === value);
  if (!p) return current;
  return p.apply({ ...EMPTY_PARTY });
}

export function isPartyEmpty(p: PartyStatus): boolean {
  return Object.values(p).every((v) => v === false);
}