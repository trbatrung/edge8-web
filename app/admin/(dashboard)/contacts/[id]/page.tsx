import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerson360 } from "@/lib/admin/contacts";
import { PageHead } from "@/components/admin/PageHead";
import { Badge, statusTone } from "@/components/admin/Badge";
import { Tabs, type TabDef } from "@/components/admin/Tabs";
import { PersonEditForm } from "./PersonEditForm";
import { formatCents, formatDate, humanize, timeAgo } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

function Empty({ text }: { text: string }) {
  return <div className="admin-empty">{text}</div>;
}

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const data = await getPerson360(params.id);
  if (!data) notFound();

  const { person, inquiries, deals, orders, bookings, candidate, applications, documents, surveyResponses } = data;
  const name = person.full_name || person.preferred_name || person.email;
  const location = [person.city, person.state_province, person.country].filter(Boolean).join(", ");

  const tabs: TabDef[] = [
    {
      key: "inquiries",
      label: "Inquiries",
      count: inquiries.length,
      content: inquiries.length === 0 ? (
        <Empty text="No inquiries." />
      ) : (
        <div className="admin-list">
          {inquiries.map((iq) => (
            <div className="admin-list-row" key={iq.id}>
              <div className="admin-list-main">
                <div className="admin-list-title">{iq.subject || humanize(iq.type)}</div>
                <div className="admin-list-sub">
                  {humanize(iq.type)} · {iq.source || "—"} · {timeAgo(iq.created_at)}
                </div>
              </div>
              <div className="admin-list-aside">
                <Badge tone={statusTone(iq.status)}>{humanize(iq.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "deals",
      label: "Deals",
      count: deals.length,
      content: deals.length === 0 ? (
        <Empty text="No deals." />
      ) : (
        <div className="admin-list">
          {deals.map((d) => (
            <div className="admin-list-row" key={d.id}>
              <div className="admin-list-main">
                <div className="admin-list-title">{d.title || "Untitled deal"}</div>
                <div className="admin-list-sub">{timeAgo(d.created_at)}</div>
              </div>
              <div className="admin-list-aside">
                <strong className="admin-cell-mono">{formatCents(d.amount_cents, d.currency ?? "usd")}</strong>
                <Badge tone={statusTone(d.status)}>{humanize(d.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "orders",
      label: "Orders",
      count: orders.length,
      content: orders.length === 0 ? (
        <Empty text="No orders." />
      ) : (
        <div className="admin-list">
          {orders.map((o) => (
            <div className="admin-list-row" key={o.id}>
              <div className="admin-list-main">
                <div className="admin-list-title">{formatCents(o.amount_cents, o.currency ?? "usd")}</div>
                <div className="admin-list-sub">
                  {humanize(o.payment_method)} · {formatDate(o.created_at)}
                </div>
              </div>
              <div className="admin-list-aside">
                <Badge tone={statusTone(o.status)}>{humanize(o.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "bookings",
      label: "Bookings",
      count: bookings.length,
      content: bookings.length === 0 ? (
        <Empty text="No bookings." />
      ) : (
        <div className="admin-list">
          {bookings.map((b) => (
            <div className="admin-list-row" key={b.id}>
              <div className="admin-list-main">
                <div className="admin-list-title">{humanize(b.kind)}</div>
                <div className="admin-list-sub">
                  {formatDate(b.start_date)} → {formatDate(b.end_date)}
                  {b.party_size ? ` · party of ${b.party_size}` : ""}
                </div>
              </div>
              <div className="admin-list-aside">
                <strong className="admin-cell-mono">{formatCents(b.amount_cents, b.currency ?? "usd")}</strong>
                <Badge tone={statusTone(b.status)}>{humanize(b.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "recruiting",
      label: "Recruiting",
      count: applications.length,
      content: !candidate ? (
        <Empty text="Not a candidate." />
      ) : (
        <div>
          <div className="admin-list-row">
            <div className="admin-list-main">
              <div className="admin-list-title">{candidate.headline || "Candidate"}</div>
              <div className="admin-list-sub">
                {candidate.linkedin_url ? (
                  <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="admin-list-aside">
              <Badge tone={statusTone(candidate.pool_status)}>{humanize(candidate.pool_status)}</Badge>
            </div>
          </div>
          {applications.length === 0 ? (
            <Empty text="No applications." />
          ) : (
            <div className="admin-list" style={{ marginTop: 8 }}>
              {applications.map((a) => (
                <div className="admin-list-row" key={a.id}>
                  <div className="admin-list-main">
                    <div className="admin-list-title">Application</div>
                    <div className="admin-list-sub">
                      Applied {formatDate(a.applied_at ?? a.created_at)}
                      {a.rating ? ` · ★ ${a.rating}` : ""}
                    </div>
                  </div>
                  <div className="admin-list-aside">
                    <Badge tone={statusTone(a.status)}>{humanize(a.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "documents",
      label: "Documents",
      count: documents.length,
      content: documents.length === 0 ? (
        <Empty text="No documents." />
      ) : (
        <div className="admin-list">
          {documents.map((doc) => (
            <div className="admin-list-row" key={doc.id}>
              <div className="admin-list-main">
                <div className="admin-list-title">{doc.title || "Document"}</div>
                <div className="admin-list-sub">
                  {doc.mime_type || "—"} · {formatDate(doc.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "surveys",
      label: "Surveys",
      count: surveyResponses.length,
      content: surveyResponses.length === 0 ? (
        <Empty text="No survey responses." />
      ) : (
        <div className="admin-list">
          {surveyResponses.map((s) => (
            <div className="admin-list-row" key={s.id}>
              <div className="admin-list-main">
                <div className="admin-list-title">Survey response</div>
                <div className="admin-list-sub">{formatDate(s.submitted_at ?? s.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHead
        eyebrow={<Link href="/admin/contacts">← Contacts</Link>}
        title={name}
        sub={person.email}
        action={
          <span style={{ display: "inline-flex", gap: 6 }}>
            {person.do_not_contact && <Badge tone="err">Do not contact</Badge>}
            {person.is_team_member && <Badge tone="info">Team</Badge>}
            {person.persona && <Badge>{humanize(person.persona)}</Badge>}
          </span>
        }
      />

      <div className="admin-360">
        <div>
          <div className="admin-card admin-section-card">
            <PersonEditForm person={person} />
          </div>
          <div className="admin-card admin-section-card">
            <dl className="admin-kv">
              <dt>Email</dt>
              <dd>{person.email}</dd>
              <dt>Location</dt>
              <dd>{location || "—"}</dd>
              <dt>Timezone</dt>
              <dd>{person.timezone || "—"}</dd>
              <dt>Source</dt>
              <dd>{person.source || "—"}</dd>
              <dt>Added</dt>
              <dd>{formatDate(person.created_at)}</dd>
            </dl>
          </div>
        </div>

        <div className="admin-card admin-section-card">
          <Tabs tabs={tabs} />
        </div>
      </div>
    </>
  );
}
