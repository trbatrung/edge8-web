import { supabase } from "./supabase";
import { SOURCE_SITE } from "./utils";

// Upserts a person by email and creates a retreat inquiry against the shared
// ai-officer database. The eventId tags `source` so the shared CRM can
// attribute leads per cohort. Optional form answers go into the inquiry's
// `message` body so the admin sees them in the dashboard.

export type RetreatSignupInput = {
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  role?: string | null;
  message?: string | null;
  eventId?: string | null;
  tierId?: string | null;
  aiFluency?: string | null;
  goal?: string | null;
  referralSource?: string | null;
  affiliateId?: string | null;
  /** Aio-website product cohort_slug. Stored in inquiries.metadata.cohort
   * so the retreat dashboard can filter by it. */
  cohortSlug?: string | null;
  /** Aio-website product tier ('base' / 'mac_mini' / 'white_glove'). */
  productTier?: string | null;
};

export type RetreatSignupResult =
  | { ok: true; personId: string; inquiryId: string }
  | { ok: false; error: string };

export async function recordRetreatSignup(
  input: RetreatSignupInput,
): Promise<RetreatSignupResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "A valid email is required." };
  }

  const { data: person, error: personError } = await supabase
    .from("people")
    .upsert(
      {
        email,
        name: input.name ?? null,
        phone: input.phone ?? null,
        company: input.company ?? null,
        role: input.role ?? null,
        source_site: SOURCE_SITE,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();

  if (personError || !person) {
    console.error("[signups] failed to upsert person:", personError?.message);
    return { ok: false, error: "Could not save your details. Please try again." };
  }

  const source = input.eventId
    ? `edge8:${input.eventId}${input.tierId ? `:${input.tierId}` : ""}`
    : "edge8";

  // Compose a richer message body from the structured answers so the admin
  // dashboard (which reads inquiries.message) sees the full context.
  const messageParts: string[] = [];
  if (input.tierId) messageParts.push(`Tier: ${input.tierId}`);
  if (input.aiFluency) messageParts.push(`AI fluency: ${input.aiFluency}`);
  if (input.goal) messageParts.push(`Goal: ${input.goal}`);
  if (input.referralSource) messageParts.push(`Heard about us via: ${input.referralSource}`);
  if (input.message) messageParts.push(input.message);
  const composedMessage = messageParts.length > 0 ? messageParts.join("\n") : null;

  // Mirror the form data into inquiries.metadata so the retreat dashboard
  // (which filters / charts off metadata, not message) sees this signup
  // exactly the same way it sees signups that came in via aio-website.
  const metadata: Record<string, string> = {};
  if (input.cohortSlug) metadata.cohort = input.cohortSlug;
  if (input.productTier) metadata.tier = input.productTier;
  if (input.aiFluency) metadata.ai_fluency = input.aiFluency;
  if (input.goal) metadata.goal = input.goal;
  if (input.referralSource) metadata.referral_source = input.referralSource;

  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .insert({
      person_id: person.id,
      type: "retreat",
      message: composedMessage,
      source,
      source_site: SOURCE_SITE,
      status: "new_lead",
      affiliate_id: input.affiliateId ?? null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .select("id")
    .single();

  if (inquiryError || !inquiry) {
    console.error("[signups] failed to insert inquiry:", inquiryError?.message);
    return { ok: false, error: "Could not save your inquiry. Please try again." };
  }

  return { ok: true, personId: person.id, inquiryId: inquiry.id };
}
