/**
 * Az új haszonbérleti ranghely-kalkulátor típusai.
 * Független a meglévő `types.ts`-től (admin / Notice-alapú).
 */

export type Transaction = "lease" | "sale";
export type Branch = "forest" | "non_forest";

export type Cultivation =
  | "szanto"
  | "ret"
  | "legelo"
  | "kert"
  | "szolo"
  | "gyumolcsos"
  | "rizstelep"
  | "erdo"
  | "vegyes";

export type YesNoUnknown = "yes" | "no" | "unknown";

export interface LandContext {
  transaction: Transaction;
  branch: Branch;
  cultivationBranch?: Cultivation;
  commonOwnership?: boolean;
  coOwnerLeaseToThirdParty?: boolean;
  wineGeoIndication?: boolean;
  /** UI-only nyers Y/N/U → boolean konvertálva van. */
}

/** Egyetlen párt (kifüggesztett bérlő VAGY user) deklarált státusza. */
export interface PartyStatus {
  // Alap
  farmer_natural: boolean;
  org_producer: boolean;
  unknown_base: boolean;

  // Hely / reláció
  local_resident: boolean;
  local_neighbor: boolean;
  within_20km: boolean;
  org_local: boolean;
  org_local_neighbor: boolean;
  org_within_20km: boolean;

  // Használat
  former_lessee: boolean;
  used_3_years: boolean;
  metayer_lessee: boolean;
  current_user: boolean;

  // Tulajdon
  co_owner_farmer: boolean;

  // Speciális csúcsjogcímek
  animal_holder: boolean;
  feed_purpose: boolean;
  animal_density_ok: boolean;
  organic_purpose: boolean;
  geo_indication_purpose: boolean;
  horticulture_purpose: boolean;
  seed_purpose: boolean;
  irrigation_invested: boolean;
  irrigation_half_land: boolean;
  irrigation_half_term: boolean;
  rice_former_lessee: boolean;

  // Csoporton belüli prioritás
  csmt_member: boolean;
  ocsg_member: boolean;
  young_farmer: boolean;

  // Kockázati / kizárási flag-ek
  has_use_debt: boolean;
  recent_penalty: boolean;
  bankruptcy: boolean;
  close_relative: boolean;

  unknown_status: boolean;
}

export const EMPTY_PARTY: PartyStatus = {
  farmer_natural: false,
  org_producer: false,
  unknown_base: false,
  local_resident: false,
  local_neighbor: false,
  within_20km: false,
  org_local: false,
  org_local_neighbor: false,
  org_within_20km: false,
  former_lessee: false,
  used_3_years: false,
  metayer_lessee: false,
  current_user: false,
  co_owner_farmer: false,
  animal_holder: false,
  feed_purpose: false,
  animal_density_ok: false,
  organic_purpose: false,
  geo_indication_purpose: false,
  horticulture_purpose: false,
  seed_purpose: false,
  irrigation_invested: false,
  irrigation_half_land: false,
  irrigation_half_term: false,
  rice_former_lessee: false,
  csmt_member: false,
  ocsg_member: false,
  young_farmer: false,
  has_use_debt: false,
  recent_penalty: false,
  bankruptcy: false,
  close_relative: false,
  unknown_status: false,
};