import { createServerFn } from "@tanstack/react-start";

export type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthly_price_huf: number;
  annual_quota: number;
  price_label: string;
  active: boolean;
  sort_order: number;
};

export const FALLBACK_PLANS: Plan[] = [
  {
    id: "fallback-single",
    slug: "single",
    name: "Egyszeri szerződés",
    description: "Egy földbérleti szerződés előkészítése végleges PDF csomaggal.",
    monthly_price_huf: 9900,
    annual_quota: 1,
    price_label: "Egyszeri díj, egy dokumentumcsomaghoz",
    active: true,
    sort_order: 1,
  },
  {
    id: "fallback-gazda",
    slug: "gazda",
    name: "Gazda csomag",
    description: "Éves keret több szerződéshez, hirdetményfigyelővel és dokumentumkezeléssel.",
    monthly_price_huf: 9900,
    annual_quota: 50,
    price_label: "Havi díj, éves elszámolással",
    active: true,
    sort_order: 2,
  },
  {
    id: "fallback-pro",
    slug: "pro",
    name: "Pro csomag",
    description: "Nagyobb gazdaságoknak és integrátoroknak, magasabb éves dokumentumkerettel.",
    monthly_price_huf: 19900,
    annual_quota: 150,
    price_label: "Havi díj, éves elszámolással",
    active: true,
    sort_order: 3,
  },
];

export const listPlans = createServerFn({ method: "GET" }).handler(async (): Promise<Plan[]> => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data?.length ? ((data as Plan[]) ?? []) : FALLBACK_PLANS;
  } catch (error) {
    console.warn("Using fallback Dr Föld plans.", error);
    return FALLBACK_PLANS;
  }
});
