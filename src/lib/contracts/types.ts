export type Lessor = {
  type?: "magan" | "tobbi_tulajdonos" | "ceg" | "haszonelvezo" | "egyeb";
  name?: string;
  address?: string;
  birth_name?: string;
  mother_name?: string;
  birth_place?: string;
  birth_date?: string;
  tax_id?: string;
  ownership_share?: string;
  representative?: string;
  company_reg_number?: string;
  company_tax_number?: string;
  /**
   * Társtulajdonosok (co-owners). When the parcel has multiple lessors, the
   * primary lessor is the parent record; additional co-owners go here with
   * their own ownership_share. The compose step renders all of them.
   */
  co_lessors?: Lessor[];
};

export type Lessee = {
  type?: "foldmuves" | "ostermelo" | "csaladi_gazdasag_tag" | "termeloszervezet" | "ceg" | "egyeb";
  name?: string;
  address?: string;
  tax_id?: string;
  farmer_registry_number?: string;
  ostermelo_number?: string;
  company_reg_number?: string;
  representative?: string;
  is_registered_farmer?: boolean;
  is_producer_org?: boolean;
  is_transparent?: boolean;
  no_land_use_debt?: boolean;
  is_young_farmer?: boolean;
  is_csmt_member?: boolean;
};

export type Parcel = {
  settlement?: string;
  county?: string;
  parcel_number?: string;
  location_type?: "belterulet" | "kulterulet" | "zartkert";
  cultivation_branch?: string;
  area_ha?: number;
  area_m2?: number;
  aranykorona?: number;
  ownership_share?: string;
  leased_share?: string;
  full_parcel?: boolean;
  common_ownership?: boolean;
  existing_use_order?: boolean;
  usufruct_right?: boolean;
  encumbrances?: string;
  special_status?: string;
  irrigation?: string;
  notes?: string;
};

export type Rent = {
  model?: "ft_ha_ev" | "ft_ev" | "ft_ak_ev" | "termeny" | "vegyes" | "egyedi";
  amount?: number;
  unit?: string;
  crop_type?: string;
  kg_per_ak?: number;
  min_cash?: number;
  deadline?: string;
  method?: "atutalas" | "keszpenz" | "vegyes";
  bank_account?: string;
  payer?: string;
  /**
   * Készpénzes fizetés csak akkor engedélyezett, ha valamely törvényi
   * kivétel fennáll (Fftv. 50. § (4)). Egyébként 2022.01.01. óta banki
   * átutalás vagy belföldi postautalvány kötelező (Fftv. 50. § (3)).
   */
  cash_exemption?:
    | "under_1_ha"
    | "close_relatives"
    | "tanya"
    | "producer_org_25pct"
    | "family_farm_member";
  cash_exemption_note?: string;
  indexation?: "none" | "ksh" | "fixed" | "custom";
  fixed_pct?: number;
  first_year_special?: string;
  tax_clause?: string;
  vat_note?: string;
};

export type Term = {
  start_date?: string;
  end_date?: string;
  first_economic_year?: string;
  possession_date?: string;
  is_forest_or_special?: boolean;
  renewal?: string;
  termination_notice?: string;
};

export type PreLease = {
  no_prelease_exception?: boolean;
  is_former_lessee?: boolean;
  used_3_years?: boolean;
  is_local_neighbor?: boolean;
  is_local_resident?: boolean;
  within_20km?: boolean;
  is_local_producer_org?: boolean;
  is_animal_holder?: boolean;
  is_organic?: boolean;
  is_geo_indication?: boolean;
  is_horticulture?: boolean;
  is_seed?: boolean;
  is_irrigation?: boolean;
  is_rice?: boolean;
  is_csmt_member?: boolean;
  is_young_farmer?: boolean;
};

export type ClausesSelection = {
  general_arable?: boolean;
  pasture?: boolean;
  organic?: boolean;
  irrigation?: boolean;
  natura2000?: boolean;
  subsidy?: boolean;
  hunting?: boolean;
  soil_protection?: boolean;
  no_sublease?: boolean;
  no_branch_change?: boolean;
  farming_diary?: boolean;
  last_year_sowing?: boolean;
  return_land?: boolean;
  liability?: boolean;
  vis_maior?: boolean;
  termination?: boolean;
  succession?: boolean;
  dispute?: boolean;
  data_protection?: boolean;
};

export type Draft = {
  id: string;
  user_id: string;
  status: string;
  title: string | null;
  lessor_data: Lessor;
  lessee_data: Lessee;
  parcels: Parcel[];
  rent: Rent;
  term: Term;
  prelease: PreLease;
  clauses: ClausesSelection;
  risk_report: RiskReport | null;
  core_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type RiskLevel = "rendben" | "figyelmeztetes" | "jogi_ellenorzes" | "hianyzo_kotelezo";
export type RiskItem = { id: string; category: string; level: RiskLevel; message: string };
export type RiskReport = { items: RiskItem[]; can_finalize: boolean };