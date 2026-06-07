import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateDraft } from "@/lib/contracts/drafts.functions";
import type { Draft, Parcel, Lessor, Lessee, Rent, Term, PreLease, ClausesSelection } from "@/lib/contracts/types";
import { WizardStepper } from "./wizard-stepper";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const STEPS = [
  "Felek", "Földterület", "Időtartam", "Díj", "Előhaszonbérlet", "Klauzulák",
];

type State = {
  title: string;
  lessor: Lessor;
  lessee: Lessee;
  parcels: Parcel[];
  rent: Rent;
  term: Term;
  prelease: PreLease;
  clauses: ClausesSelection;
};

export function ContractEditor({ draft }: { draft: Draft }) {
  const navigate = useNavigate();
  const save = useServerFn(updateDraft);
  const [state, setState] = useState<State>(() => ({
    title: draft.title ?? "Új szerződés",
    lessor: draft.lessor_data ?? {},
    lessee: draft.lessee_data ?? {},
    parcels: draft.parcels?.length ? draft.parcels : [{}],
    rent: draft.rent ?? {},
    term: draft.term ?? {},
    prelease: draft.prelease ?? {},
    clauses: draft.clauses ?? {},
  }));
  const [saving, setSaving] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Autosave with debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        await save({
          data: {
            id: draft.id,
            patch: {
              title: state.title,
              lessor_data: state.lessor as Record<string, unknown>,
              lessee_data: state.lessee as Record<string, unknown>,
              parcels: state.parcels as unknown as Record<string, unknown>[],
              rent: state.rent as Record<string, unknown>,
              term: state.term as Record<string, unknown>,
              prelease: state.prelease as Record<string, unknown>,
              clauses: state.clauses as Record<string, unknown>,
            },
          },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [state, draft.id, save]);

  function set<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function updParcel(i: number, p: Partial<Parcel>) {
    set("parcels", state.parcels.map((row, idx) => (idx === i ? { ...row, ...p } : row)));
  }

  async function onCheck() {
    // Save first, then navigate
    try {
      await save({
        data: {
          id: draft.id,
          patch: {
            title: state.title,
            lessor_data: state.lessor as Record<string, unknown>,
            lessee_data: state.lessee as Record<string, unknown>,
            parcels: state.parcels as unknown as Record<string, unknown>[],
            rent: state.rent as Record<string, unknown>,
            term: state.term as Record<string, unknown>,
            prelease: state.prelease as Record<string, unknown>,
            clauses: state.clauses as Record<string, unknown>,
          },
        },
      });
      navigate({ to: "/szerzodes/$id/ellenorzes", params: { id: draft.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mentés hiba");
    }
  }

  const cultivationOptions = ["szántó", "rét", "legelő", "gyep", "kert", "szőlő", "gyümölcsös", "erdő", "fásított terület", "nádas", "halastó", "tanya", "vegyes"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <WizardStepper steps={STEPS} current={0} />
        <div className="text-xs text-muted-foreground">{saving ? "Mentés…" : "Automatikus mentés bekapcsolva"}</div>
      </div>

      <div>
        <Label htmlFor="title">Szerződés címe (belső)</Label>
        <Input id="title" value={state.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      {/* Step 1: Felek */}
      <Card className="p-6">
        <h2 className="font-serif text-xl">1. Felek adatai</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-3">
            <h3 className="font-medium">Haszonbérbeadó</h3>
            <div>
              <Label>Típus</Label>
              <Select value={state.lessor.type ?? ""} onValueChange={(v) => set("lessor", { ...state.lessor, type: v as Lessor["type"] })}>
                <SelectTrigger><SelectValue placeholder="Válassz típust" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="magan">Magánszemély</SelectItem>
                  <SelectItem value="tobbi_tulajdonos">Több tulajdonos</SelectItem>
                  <SelectItem value="ceg">Cég</SelectItem>
                  <SelectItem value="haszonelvezo">Haszonélvező</SelectItem>
                  <SelectItem value="egyeb">Egyéb</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Név / cégnév</Label><Input value={state.lessor.name ?? ""} onChange={(e) => set("lessor", { ...state.lessor, name: e.target.value })} /></div>
            <div><Label>Cím / székhely</Label><Input value={state.lessor.address ?? ""} onChange={(e) => set("lessor", { ...state.lessor, address: e.target.value })} /></div>
            <div><Label>Adóazonosító / adószám</Label><Input value={state.lessor.tax_id ?? ""} onChange={(e) => set("lessor", { ...state.lessor, tax_id: e.target.value })} /></div>
            <div><Label>Tulajdoni hányad</Label><Input value={state.lessor.ownership_share ?? ""} onChange={(e) => set("lessor", { ...state.lessor, ownership_share: e.target.value })} placeholder="pl. 1/1" /></div>
            {state.lessor.type === "ceg" && (
              <>
                <div><Label>Cégjegyzékszám</Label><Input value={state.lessor.company_reg_number ?? ""} onChange={(e) => set("lessor", { ...state.lessor, company_reg_number: e.target.value })} /></div>
                <div><Label>Képviselő</Label><Input value={state.lessor.representative ?? ""} onChange={(e) => set("lessor", { ...state.lessor, representative: e.target.value })} /></div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Haszonbérlő</h3>
            <div>
              <Label>Típus</Label>
              <Select value={state.lessee.type ?? ""} onValueChange={(v) => set("lessee", { ...state.lessee, type: v as Lessee["type"] })}>
                <SelectTrigger><SelectValue placeholder="Válassz típust" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="foldmuves">Földműves természetes személy</SelectItem>
                  <SelectItem value="ostermelo">Őstermelő</SelectItem>
                  <SelectItem value="csaladi_gazdasag_tag">Családi gazdaság tagja</SelectItem>
                  <SelectItem value="termeloszervezet">Mezőgazdasági termelőszervezet</SelectItem>
                  <SelectItem value="ceg">Cég</SelectItem>
                  <SelectItem value="egyeb">Egyéb</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Név / cégnév</Label><Input value={state.lessee.name ?? ""} onChange={(e) => set("lessee", { ...state.lessee, name: e.target.value })} /></div>
            <div><Label>Cím / székhely</Label><Input value={state.lessee.address ?? ""} onChange={(e) => set("lessee", { ...state.lessee, address: e.target.value })} /></div>
            <div><Label>Adóazonosító / adószám</Label><Input value={state.lessee.tax_id ?? ""} onChange={(e) => set("lessee", { ...state.lessee, tax_id: e.target.value })} /></div>
            <div><Label>Földműves nyilv. szám</Label><Input value={state.lessee.farmer_registry_number ?? ""} onChange={(e) => set("lessee", { ...state.lessee, farmer_registry_number: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <CheckRow label="Földműves nyilv." checked={!!state.lessee.is_registered_farmer} onChange={(v) => set("lessee", { ...state.lessee, is_registered_farmer: v })} />
              <CheckRow label="Termelőszervezet" checked={!!state.lessee.is_producer_org} onChange={(v) => set("lessee", { ...state.lessee, is_producer_org: v })} />
              <CheckRow label="Átlátható szervezet" checked={!!state.lessee.is_transparent} onChange={(v) => set("lessee", { ...state.lessee, is_transparent: v })} />
              <CheckRow label="Nincs földhasználati tartozás" checked={!!state.lessee.no_land_use_debt} onChange={(v) => set("lessee", { ...state.lessee, no_land_use_debt: v })} />
              <CheckRow label="Fiatal gazdálkodó" checked={!!state.lessee.is_young_farmer} onChange={(v) => set("lessee", { ...state.lessee, is_young_farmer: v })} />
              <CheckRow label="CSMT/ŐCSG tag" checked={!!state.lessee.is_csmt_member} onChange={(v) => set("lessee", { ...state.lessee, is_csmt_member: v })} />
            </div>
          </div>
        </div>
      </Card>

      {/* Step 2: Földterület */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">2. Földterület adatai</h2>
          <Button variant="outline" size="sm" onClick={() => set("parcels", [...state.parcels, {}])}>
            <Plus className="h-4 w-4 mr-1" />Új parcella
          </Button>
        </div>
        <div className="mt-4 space-y-6">
          {state.parcels.map((p, i) => (
            <div key={i} className="border border-border rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">{i + 1}. parcella</div>
                {state.parcels.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => set("parcels", state.parcels.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><Label>Település</Label><Input value={p.settlement ?? ""} onChange={(e) => updParcel(i, { settlement: e.target.value })} /></div>
                <div><Label>Vármegye</Label><Input value={p.county ?? ""} onChange={(e) => updParcel(i, { county: e.target.value })} /></div>
                <div><Label>Helyrajzi szám</Label><Input value={p.parcel_number ?? ""} onChange={(e) => updParcel(i, { parcel_number: e.target.value })} /></div>
                <div>
                  <Label>Fekvés</Label>
                  <Select value={p.location_type ?? ""} onValueChange={(v) => updParcel(i, { location_type: v as Parcel["location_type"] })}>
                    <SelectTrigger><SelectValue placeholder="Válassz" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="belterulet">Belterület</SelectItem>
                      <SelectItem value="kulterulet">Külterület</SelectItem>
                      <SelectItem value="zartkert">Zártkert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Művelési ág</Label>
                  <Select value={p.cultivation_branch ?? ""} onValueChange={(v) => updParcel(i, { cultivation_branch: v })}>
                    <SelectTrigger><SelectValue placeholder="Válassz" /></SelectTrigger>
                    <SelectContent>
                      {cultivationOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Terület (ha)</Label><Input type="number" step="0.01" value={p.area_ha ?? ""} onChange={(e) => updParcel(i, { area_ha: parseFloat(e.target.value) || undefined })} /></div>
                <div><Label>Terület (m²)</Label><Input type="number" value={p.area_m2 ?? ""} onChange={(e) => updParcel(i, { area_m2: parseFloat(e.target.value) || undefined })} /></div>
                <div><Label>Aranykorona</Label><Input type="number" step="0.01" value={p.aranykorona ?? ""} onChange={(e) => updParcel(i, { aranykorona: parseFloat(e.target.value) || undefined })} /></div>
                <div><Label>Tulajdoni hányad</Label><Input value={p.ownership_share ?? ""} onChange={(e) => updParcel(i, { ownership_share: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Terhek, megjegyzés</Label><Input value={p.encumbrances ?? ""} onChange={(e) => updParcel(i, { encumbrances: e.target.value })} /></div>
                <div><Label>Speciális státusz</Label><Input value={p.special_status ?? ""} onChange={(e) => updParcel(i, { special_status: e.target.value })} placeholder="Natura 2000, AKG…" /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <CheckRow label="Teljes parcella" checked={!!p.full_parcel} onChange={(v) => updParcel(i, { full_parcel: v })} />
                <CheckRow label="Közös tulajdon" checked={!!p.common_ownership} onChange={(v) => updParcel(i, { common_ownership: v })} />
                <CheckRow label="Használati megosztás" checked={!!p.existing_use_order} onChange={(v) => updParcel(i, { existing_use_order: v })} />
                <CheckRow label="Haszonélvezeti jog" checked={!!p.usufruct_right} onChange={(v) => updParcel(i, { usufruct_right: v })} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Step 3: Időtartam */}
      <Card className="p-6">
        <h2 className="font-serif text-xl">3. Haszonbérleti időtartam</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <div><Label>Kezdő dátum</Label><Input type="date" value={state.term.start_date ?? ""} onChange={(e) => set("term", { ...state.term, start_date: e.target.value })} /></div>
          <div><Label>Befejező dátum</Label><Input type="date" value={state.term.end_date ?? ""} onChange={(e) => set("term", { ...state.term, end_date: e.target.value })} /></div>
          <div><Label>Első gazdasági év</Label><Input value={state.term.first_economic_year ?? ""} onChange={(e) => set("term", { ...state.term, first_economic_year: e.target.value })} placeholder="pl. 2026" /></div>
          <div><Label>Birtokbaadás napja</Label><Input type="date" value={state.term.possession_date ?? ""} onChange={(e) => set("term", { ...state.term, possession_date: e.target.value })} /></div>
          <CheckRow label="Erdő vagy speciális hosszú távú eset" checked={!!state.term.is_forest_or_special} onChange={(v) => set("term", { ...state.term, is_forest_or_special: v })} />
          <div><Label>Megújítás</Label><Input value={state.term.renewal ?? ""} onChange={(e) => set("term", { ...state.term, renewal: e.target.value })} /></div>
        </div>
      </Card>

      {/* Step 4: Díj */}
      <Card className="p-6">
        <h2 className="font-serif text-xl">4. Haszonbérleti díj</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <div>
            <Label>Díjmodell</Label>
            <Select value={state.rent.model ?? ""} onValueChange={(v) => set("rent", { ...state.rent, model: v as Rent["model"] })}>
              <SelectTrigger><SelectValue placeholder="Válassz" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ft_ha_ev">Ft / ha / év</SelectItem>
                <SelectItem value="ft_ev">Ft / év</SelectItem>
                <SelectItem value="ft_ak_ev">Ft / AK / év</SelectItem>
                <SelectItem value="termeny">Terményegyenérték</SelectItem>
                <SelectItem value="vegyes">Vegyes</SelectItem>
                <SelectItem value="egyedi">Egyedi díjlépcső</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Összeg</Label><Input type="number" value={state.rent.amount ?? ""} onChange={(e) => set("rent", { ...state.rent, amount: parseFloat(e.target.value) || undefined })} /></div>
          {state.rent.model === "termeny" && (
            <>
              <div><Label>Termény</Label><Input value={state.rent.crop_type ?? ""} onChange={(e) => set("rent", { ...state.rent, crop_type: e.target.value })} /></div>
              <div><Label>kg / AK / év</Label><Input type="number" value={state.rent.kg_per_ak ?? ""} onChange={(e) => set("rent", { ...state.rent, kg_per_ak: parseFloat(e.target.value) || undefined })} /></div>
              <div><Label>Minimum készpénz (Ft)</Label><Input type="number" value={state.rent.min_cash ?? ""} onChange={(e) => set("rent", { ...state.rent, min_cash: parseFloat(e.target.value) || undefined })} /></div>
            </>
          )}
          <div><Label>Fizetési határidő</Label><Input value={state.rent.deadline ?? ""} onChange={(e) => set("rent", { ...state.rent, deadline: e.target.value })} placeholder="pl. minden év november 30." /></div>
          <div>
            <Label>Fizetés módja</Label>
            <Select value={state.rent.method ?? ""} onValueChange={(v) => set("rent", { ...state.rent, method: v as Rent["method"] })}>
              <SelectTrigger><SelectValue placeholder="Válassz" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="atutalas">Átutalás</SelectItem>
                <SelectItem value="keszpenz">Készpénz</SelectItem>
                <SelectItem value="vegyes">Vegyes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Bankszámlaszám</Label><Input value={state.rent.bank_account ?? ""} onChange={(e) => set("rent", { ...state.rent, bank_account: e.target.value })} /></div>
          <div>
            <Label>Indexálás</Label>
            <Select value={state.rent.indexation ?? "none"} onValueChange={(v) => set("rent", { ...state.rent, indexation: v as Rent["indexation"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nincs</SelectItem>
                <SelectItem value="ksh">KSH inflációkövető</SelectItem>
                <SelectItem value="fixed">Fix éves %</SelectItem>
                <SelectItem value="custom">Egyedi klauzula</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state.rent.indexation === "fixed" && (
            <div><Label>Fix éves %</Label><Input type="number" step="0.1" value={state.rent.fixed_pct ?? ""} onChange={(e) => set("rent", { ...state.rent, fixed_pct: parseFloat(e.target.value) || undefined })} /></div>
          )}
        </div>
      </Card>

      {/* Step 5: Előhaszonbérleti jog */}
      <Card className="p-6">
        <h2 className="font-serif text-xl">5. Előhaszonbérleti jog</h2>
        <p className="text-sm text-muted-foreground mt-1">Vezetett kérdéssor: minden tényhez, amely fennáll, jelöld be a négyzetet.</p>
        <div className="grid md:grid-cols-2 gap-2 mt-3">
          <CheckRow label="Jogszabályi kivétel áll fenn (nincs előhaszonbérleti jog)" checked={!!state.prelease.no_prelease_exception} onChange={(v) => set("prelease", { ...state.prelease, no_prelease_exception: v })} />
          <CheckRow label="Korábbi haszonbérlő" checked={!!state.prelease.is_former_lessee} onChange={(v) => set("prelease", { ...state.prelease, is_former_lessee: v })} />
          <CheckRow label="Legalább 3 éve használja a földet" checked={!!state.prelease.used_3_years} onChange={(v) => set("prelease", { ...state.prelease, used_3_years: v })} />
          <CheckRow label="Helyi szomszéd" checked={!!state.prelease.is_local_neighbor} onChange={(v) => set("prelease", { ...state.prelease, is_local_neighbor: v })} />
          <CheckRow label="Helyi lakos" checked={!!state.prelease.is_local_resident} onChange={(v) => set("prelease", { ...state.prelease, is_local_resident: v })} />
          <CheckRow label="20 km-es körzetben él/működik" checked={!!state.prelease.within_20km} onChange={(v) => set("prelease", { ...state.prelease, within_20km: v })} />
          <CheckRow label="Helyi mezőgazdasági termelőszervezet" checked={!!state.prelease.is_local_producer_org} onChange={(v) => set("prelease", { ...state.prelease, is_local_producer_org: v })} />
          <CheckRow label="Állattartó (takarmány)" checked={!!state.prelease.is_animal_holder} onChange={(v) => set("prelease", { ...state.prelease, is_animal_holder: v })} />
          <CheckRow label="Ökológiai gazdálkodó" checked={!!state.prelease.is_organic} onChange={(v) => set("prelease", { ...state.prelease, is_organic: v })} />
          <CheckRow label="Földrajzi árujelzős termék" checked={!!state.prelease.is_geo_indication} onChange={(v) => set("prelease", { ...state.prelease, is_geo_indication: v })} />
          <CheckRow label="Kertészet" checked={!!state.prelease.is_horticulture} onChange={(v) => set("prelease", { ...state.prelease, is_horticulture: v })} />
          <CheckRow label="Vetőmag-szaporítás" checked={!!state.prelease.is_seed} onChange={(v) => set("prelease", { ...state.prelease, is_seed: v })} />
          <CheckRow label="Öntözés-fejlesztéshez kapcsolódó" checked={!!state.prelease.is_irrigation} onChange={(v) => set("prelease", { ...state.prelease, is_irrigation: v })} />
          <CheckRow label="Rizsföld" checked={!!state.prelease.is_rice} onChange={(v) => set("prelease", { ...state.prelease, is_rice: v })} />
          <CheckRow label="CSMT / ŐCSG tag" checked={!!state.prelease.is_csmt_member} onChange={(v) => set("prelease", { ...state.prelease, is_csmt_member: v })} />
          <CheckRow label="Fiatal gazdálkodó" checked={!!state.prelease.is_young_farmer} onChange={(v) => set("prelease", { ...state.prelease, is_young_farmer: v })} />
        </div>
      </Card>

      {/* Step 6: Klauzulák */}
      <Card className="p-6">
        <h2 className="font-serif text-xl">6. Speciális klauzula-csomagok</h2>
        <div className="grid md:grid-cols-2 gap-2 mt-3">
          {([
            ["general_arable", "Általános szántóföldi csomag"],
            ["pasture", "Legelő / kaszáló csomag"],
            ["organic", "Ökológiai gazdálkodás"],
            ["irrigation", "Öntözés"],
            ["natura2000", "Környezetvédelem / Natura 2000"],
            ["subsidy", "Támogatási klauzula"],
            ["hunting", "Vadászati jog"],
            ["soil_protection", "Talajvédelem"],
            ["no_sublease", "Albérlet / használat-átengedés tilalma"],
            ["no_branch_change", "Művelési ág-változtatás csak írásban"],
            ["farming_diary", "Gazdálkodási napló / talajvizsgálat"],
            ["last_year_sowing", "Utolsó évi vetés-korlátozás"],
            ["return_land", "Föld visszaadása"],
            ["liability", "Felelősség és kártérítés"],
            ["vis_maior", "Vis maior"],
            ["termination", "Megszűnés / felmondás"],
            ["succession", "Halál / örökösödés / cégátalakulás"],
            ["dispute", "Vitarendezés"],
            ["data_protection", "Adatvédelem és közzététel"],
          ] as const).map(([k, label]) => (
            <CheckRow key={k} label={label}
              checked={!!state.clauses[k as keyof ClausesSelection]}
              onChange={(v) => set("clauses", { ...state.clauses, [k]: v })} />
          ))}
        </div>
      </Card>

      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground max-w-md">
          A végleges dokumentum csak fizetés után érhető el. A szerződés a megadott felekhez és helyrajzi számokhoz kötött.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/dashboard">Mentés és bezárás</Link></Button>
          <Button onClick={onCheck}>Tovább a jogi kockázati ellenőrzéshez</Button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span>{label}</span>
    </label>
  );
}
