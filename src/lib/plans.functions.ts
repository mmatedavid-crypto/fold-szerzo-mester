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

export const listPlans = createServerFn({ method: "GET" }).handler(async (): Promise<Plan[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Plan[]) ?? [];
});