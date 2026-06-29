import { companyOs } from "@/lib/supabase";
import { getActiveBrandId } from "@/lib/admin/brand";
import { PageHead } from "@/components/admin/PageHead";
import type { KanbanColumn } from "@/components/admin/KanbanBoard";
import { DealsBoard, type DealCard } from "./DealsBoard";

export const dynamic = "force-dynamic";

const STAGE_ACCENT: Record<number, string> = {
  0: "#287BE8",
  1: "#6b7194",
  2: "#D1458B",
  3: "#f59e0b",
};

type Stage = { id: string; name: string; position: number; is_won: boolean; is_lost: boolean };
type Embedded<T> = T | T[] | null;
type Row = {
  id: string;
  title: string | null;
  stage_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  probability: number | null;
  status: string | null;
  expected_close_date: string | null;
  source: string | null;
  person_id: string | null;
  people: Embedded<{ full_name: string | null; email: string }>;
  companies: Embedded<{ name: string | null }>;
};

const one = <T,>(e: Embedded<T>): T | null => (Array.isArray(e) ? e[0] ?? null : e);

export default async function DealsPage() {
  const brandId = getActiveBrandId();

  const { data: stages } = await companyOs
    .from("pipeline_stages")
    .select("id, name, position, is_won, is_lost")
    .order("position");

  const columns: KanbanColumn[] = ((stages as Stage[] | null) ?? []).map((s) => ({
    id: s.id,
    label: s.name,
    accent: s.is_won ? "#1a9e74" : s.is_lost ? "#9ca3af" : STAGE_ACCENT[s.position] ?? "#6b7194",
  }));
  const firstStageId = columns[0]?.id ?? "";

  let query = companyOs
    .from("deals")
    .select(
      "id, title, stage_id, amount_cents, currency, probability, status, expected_close_date, source, person_id, people!person_id(full_name, email), companies(name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;

  const cards: DealCard[] = ((data as Row[] | null) ?? []).map((r) => {
    const p = one(r.people);
    const co = one(r.companies);
    return {
      id: r.id,
      columnId: r.stage_id ?? firstStageId,
      title: r.title,
      personId: r.person_id,
      personName: p?.full_name ?? p?.email ?? null,
      companyName: co?.name ?? null,
      amountCents: r.amount_cents,
      currency: r.currency,
      probability: r.probability,
      status: r.status,
      expectedClose: r.expected_close_date,
      source: r.source,
    };
  });

  const won = cards.filter((c) => c.status === "won").length;
  const lost = cards.filter((c) => c.status === "lost").length;
  const open = cards.filter((c) => c.status === "open").length;
  const closeRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  return (
    <>
      <PageHead
        eyebrow="Revenue"
        title="Deals"
        sub={
          closeRate != null
            ? `${open} open · ${won} won / ${lost} lost · ${closeRate}% close rate · drag to change stage`
            : `${cards.length} deals · drag a card to change stage`
        }
      />
      {error && (
        <div className="admin-alert admin-alert--err" style={{ marginBottom: 14 }}>
          {error.message}
        </div>
      )}
      <DealsBoard columns={columns} initialCards={cards} />
    </>
  );
}
