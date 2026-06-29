import { companyOs } from "@/lib/supabase";

// Person 360 aggregator. Everything in company_os joins on person_id, so this
// fans out parallel reads and returns one object the detail page renders.
// Related queries are tolerant: a denied/empty table yields [] rather than
// throwing, so the page degrades gracefully (e.g. deals before grants land).

export type Person = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  phone: string | null;
  persona: string | null;
  source: string | null;
  source_brand_id: string | null;
  linkedin_url: string | null;
  country: string | null;
  city: string | null;
  state_province: string | null;
  timezone: string | null;
  is_team_member: boolean | null;
  do_not_contact: boolean | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
};

export type Person360 = {
  person: Person;
  inquiries: Array<{ id: string; type: string | null; subject: string | null; status: string | null; source: string | null; created_at: string; deal_id: string | null }>;
  deals: Array<{ id: string; title: string | null; amount_cents: number | null; currency: string | null; status: string | null; stage_id: string | null; created_at: string }>;
  orders: Array<{ id: string; amount_cents: number | null; currency: string | null; status: string | null; payment_method: string | null; created_at: string }>;
  bookings: Array<{ id: string; kind: string | null; start_date: string | null; end_date: string | null; party_size: number | null; amount_cents: number | null; currency: string | null; status: string | null; created_at: string }>;
  candidate: { id: string; headline: string | null; pool_status: string | null; linkedin_url: string | null; resume_document_id: string | null } | null;
  applications: Array<{ id: string; job_requisition_id: string | null; status: string | null; rating: number | null; applied_at: string | null; created_at: string }>;
  documents: Array<{ id: string; title: string | null; mime_type: string | null; byte_size: number | null; created_at: string }>;
  surveyResponses: Array<{ id: string; survey_id: string | null; submitted_at: string | null; created_at: string | null }>;
};

async function safe<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const { data } = await p;
  return data ?? [];
}

export async function getPerson360(id: string): Promise<Person360 | null> {
  const personRes = await companyOs.from("people").select("*").eq("id", id).maybeSingle();
  if (personRes.error || !personRes.data) return null;
  const person = personRes.data as Person;

  const [inquiries, deals, orders, bookings, candidateRes, documents, surveyResponses] =
    await Promise.all([
      safe(companyOs.from("inquiries").select("id, type, subject, status, source, created_at, deal_id").eq("person_id", id).order("created_at", { ascending: false })),
      safe(companyOs.from("deals").select("id, title, amount_cents, currency, status, stage_id, created_at").eq("person_id", id).order("created_at", { ascending: false })),
      safe(companyOs.from("orders").select("id, amount_cents, currency, status, payment_method, created_at").eq("person_id", id).order("created_at", { ascending: false })),
      safe(companyOs.from("bookings").select("id, kind, start_date, end_date, party_size, amount_cents, currency, status, created_at").eq("person_id", id).order("created_at", { ascending: false })),
      companyOs.from("candidates").select("id, headline, pool_status, linkedin_url, resume_document_id").eq("person_id", id).maybeSingle(),
      safe(companyOs.from("documents").select("id, title, mime_type, byte_size, created_at").eq("entity_type", "person").eq("entity_id", id).order("created_at", { ascending: false })),
      safe(companyOs.from("survey_responses").select("id, survey_id, submitted_at, created_at").eq("person_id", id).order("created_at", { ascending: false })),
    ]);

  const candidate = candidateRes.data ?? null;
  let applications: Person360["applications"] = [];
  if (candidate?.id) {
    applications = await safe(
      companyOs
        .from("applications")
        .select("id, job_requisition_id, status, rating, applied_at, created_at")
        .eq("candidate_id", candidate.id)
        .order("created_at", { ascending: false }),
    );
  }

  return {
    person,
    inquiries: inquiries as Person360["inquiries"],
    deals: deals as Person360["deals"],
    orders: orders as Person360["orders"],
    bookings: bookings as Person360["bookings"],
    candidate: candidate as Person360["candidate"],
    applications,
    documents: documents as Person360["documents"],
    surveyResponses: surveyResponses as Person360["surveyResponses"],
  };
}
