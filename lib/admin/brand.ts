import { cookies } from "next/headers";
import { companyOs } from "@/lib/supabase";

// Global brand filter. The active brand id is persisted in the `crm_brand`
// cookie (set client-side by the sidebar switcher) so server components can read
// it. null = "All brands". Brand ids are read live from the table — never
// hardcode them (they differ across the brands: Edge8, AI Officer, CAIO Coach…).

export type Brand = { id: string; name: string };

export function getActiveBrandId(): string | null {
  return cookies().get("crm_brand")?.value || null;
}

export async function listBrands(): Promise<Brand[]> {
  const { data } = await companyOs.from("brands").select("id, name").order("name");
  return (data ?? []) as Brand[];
}
