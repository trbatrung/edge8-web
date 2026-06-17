import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PrivateSessionReserve } from "@/components/PrivateSessionReserve";
import { VideoCarousel } from "@/components/VideoCarousel";
import {
  FAQS,
  FILTER_BULLETS,
  INCLUDED,
  NOT_INCLUDED,
  OUTCOMES,
  PROGRAMS,
  PROOF,
  VALUE_STACK,
  VALUE_TOTAL,
} from "@/lib/private-session";
import { faqPageSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Private AI Build Retreats in Saigon · Infinite Leverage",
  description:
    "A private 3, 4 or 5 day build retreat in Saigon. Walk in with an idea, fly home with 2 to 3 working applications on a Mac Mini, plus 8 working agents and 30 days of polish. From $7,000 USD.",
  keywords: [
    "private AI build retreat",
    "private AI sprint Saigon",
    "AI build sprint Vietnam",
    "founder team build retreat",
    "Infinite Leverage private",
  ],
  alternates: { canonical: "/saigon-private" },
  openGraph: {
    title: "Private AI Build Retreats in Saigon · Infinite Leverage",
    description:
      "Fly to Saigon. Fly home with the software your business runs on. 3, 4 or 5 days, private, from $7,000.",
    url: "/saigon-private",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Private AI Build Retreats in Saigon",
    description:
      "Fly to Saigon. Fly home with the software your business runs on.",
  },
};

export default function SaigonPrivatePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqPageSchema(FAQS.map((f) => ({ q: f.q, a: f.a }))))}
      />
      <Nav />

      {/* 1. Hero */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-meta">
            <span><span className="dot" />Private Retreat</span>
            <span>Saigon, Vietnam</span>
            <span>3, 4 or 5 days · on-demand</span>
          </div>

          <h1 className="h-display">
            Fly to Saigon<br />
            Fly home with the software<br />
            <em>your business runs on</em>
          </h1>

          <p className="lead" style={{ marginTop: 40 }}>
            Most founders spend $20,000 and six months hiring developers to build one app. In 3 to
            5 days, with engineers beside you, you walk out with two or three working applications
            on your real data, a Mac Mini running 8 AI agents, and the system to keep building
            forever. The flights aside, everything is handled. You just build.
          </p>

          <div className="hero-cta">
            <a href="#reserve" className="btn btn-primary">
              Reserve a retreat <span className="arrow">→</span>
            </a>
            <a href="#value" className="btn btn-ghost">See what you get</a>
          </div>

          <div className="hero-foot">
            <div className="stat"><span className="num">From <em>$7K</em></span><span className="lbl">USD · 3-day, first person</span></div>
            <div className="stat"><span className="num">2 to 3</span><span className="lbl">Apps you ship</span></div>
            <div className="stat"><span className="num">8</span><span className="lbl">Agents on a Mac Mini you keep</span></div>
            <div className="stat"><span className="num">3 to 5</span><span className="lbl">Days, fully private</span></div>
          </div>
        </div>
      </section>

      {/* 1b. Hero reel */}
      <section style={{ paddingTop: 0, paddingBottom: 80 }}>
        <div className="wrap" style={{ maxWidth: 920 }}>
          <div className="video-frame">
            <iframe
              src="https://www.youtube.com/embed/Iw6MySwudEo?autoplay=0&rel=0"
              title="What a private retreat produces"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </div>
      </section>

      {/* 2. The reframe */}
      <section className="section-paper" style={{ padding: "100px 0" }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Read this first</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                You&rsquo;re not buying a course<br /><em>you&rsquo;re buying an asset</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                A dev shop charges $20,000 to $50,000 to build one CRM. You leave with two or three
                working apps. An AI bootcamp is $5,000 and you go home with a notebook. A fractional
                AI lead is six figures and six months. This is days and thousands, and the software
                is already live before your flight home.
              </p>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              marginTop: 8,
            }}
            className="forecast-grid"
          >
            <CompareCard label="Hire a dev shop" cost="$20K – $50K" detail="Per app. Months of waiting. You own a contract, not the skill." />
            <CompareCard label="Take an AI bootcamp" cost="Up to $5K" detail="You leave with notes and prompts. Nothing shipped." />
            <CompareCard label="The Saigon retreat" cost="From $7K" detail="2 to 3 apps live, a Mac Mini with 8 agents, and you can do it again." highlight />
          </div>
        </div>
      </section>

      {/* 3. What you walk out with */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">What you walk out with</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                Real software<br /><em>running on your data</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                Past teams have walked out with {PROOF.apps.join(", ")}, and more. {PROOF.line}
              </p>
            </div>
          </div>
          <div className="grid grid-4">
            {OUTCOMES.map((o) => (
              <div className="pillar pillar-dark" key={o.label}>
                <span className="num">{o.label}</span>
                <h3 className="h-card">{o.heading}</h3>
                <p className="desc">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. The value stack */}
      <section id="value" className="section-paper" style={{ scrollMarginTop: 80 }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">The math</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                Here&rsquo;s everything<br /><em>you get</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                Priced at what each piece costs on its own. Add it up, then look at what you pay.
                That gap is the whole point.
              </p>
            </div>
          </div>

          <div style={{ maxWidth: 920 }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {VALUE_STACK.map((row) => (
                <li
                  key={row.item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 24,
                    alignItems: "baseline",
                    padding: "18px 0",
                    borderTop: "1px solid var(--rule-on-paper)",
                  }}
                >
                  <span style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.5, color: "var(--ink)" }}>
                    <span style={{ color: "var(--accent-deep)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>{row.item}</span>
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 18,
                      fontWeight: 400,
                      color: "var(--ink)",
                      whiteSpace: "nowrap",
                      fontVariationSettings: '"opsz" 24, "SOFT" 40',
                    }}
                  >
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>

            <div
              style={{
                marginTop: 28,
                background: "var(--ink)",
                color: "var(--paper)",
                borderRadius: 10,
                padding: "32px 36px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 20,
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                  Total real value
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "clamp(30px, 4vw, 46px)",
                    fontWeight: 300,
                    letterSpacing: "-0.025em",
                    color: "rgba(255,255,255,0.55)",
                    textDecoration: "line-through",
                    textDecorationColor: "rgba(255,255,255,0.3)",
                    marginTop: 4,
                    fontVariationSettings: '"opsz" 72, "SOFT" 50',
                  }}
                >
                  {VALUE_TOTAL}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>
                  Your investment
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "clamp(40px, 6vw, 64px)",
                    fontWeight: 300,
                    letterSpacing: "-0.03em",
                    color: "var(--paper)",
                    lineHeight: 1,
                    marginTop: 4,
                    fontVariationSettings: '"opsz" 96, "SOFT" 60',
                  }}
                >
                  From $7,000
                </div>
              </div>
            </div>
            <p style={{ marginTop: 16, fontSize: 14, color: "var(--muted-on-paper)", lineHeight: 1.6 }}>
              $7,000 for a 3-day retreat, first person. Each extra day is $1,000. Each additional
              person is $1,000 per day, everything included. Build a $50,000 software stack for the
              price most people pay to learn about AI, then keep building after you land.
            </p>
            <div style={{ marginTop: 24 }}>
              <a href="#reserve" className="btn btn-primary">
                Reserve a retreat <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Is this you */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Is this you</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                Built for founders<br /><em>done waiting</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                A private retreat is for an operator ready to build the thing they have been saying
                they would build for two years, solo or with their team.
              </p>
            </div>
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 16,
              maxWidth: 920,
            }}
          >
            {FILTER_BULLETS.map((line) => (
              <li
                key={line}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  fontFamily: "var(--serif)",
                  fontSize: 22,
                  lineHeight: 1.4,
                  color: "var(--paper)",
                  fontVariationSettings: '"opsz" 36, "SOFT" 50',
                }}
              >
                <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 24 }}>✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Reserve */}
      <section id="reserve" style={{ scrollMarginTop: 80, background: "var(--ink-2)" }} className="section-paper">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="eyebrow">Reserve a private retreat</span>
            <h2 className="h-section" style={{ marginTop: 24 }}>
              Pick your days and team<br /><em>then reserve</em>
            </h2>
            <p className="lead" style={{ marginTop: 24, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              The total updates live as you adjust. Pay by card via Stripe and your dates lock in immediately.
            </p>
          </div>
          <PrivateSessionReserve />
        </div>
      </section>

      {/* 7. Day-by-day program */}
      <section id="programme">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Programme</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                What every day<br /><em>looks like</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                Every retreat starts with a private CAIO roadmap session and ends with a live
                production deployment. The 3-day ships a focused build; 4 and 5 days add more build
                time and a dedicated launch day.
              </p>
            </div>
          </div>

          <ProgramBlock label="The 3-day arc" days={PROGRAMS["3day"]} />
          <div style={{ height: 64 }} />
          <ProgramBlock label="The 5-day arc" days={PROGRAMS["5day"]} />
        </div>
      </section>

      {/* 8. What's included */}
      <section className="section-paper">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">What&apos;s in the price</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                Included<br /><em>and not included</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                Everything the retreat needs to put working software in your hands is included.
                Things that scale with your business after, ads, ongoing API costs, domain renewals,
                are not.
              </p>
            </div>
          </div>
          <div className="grid grid-2">
            <ListCard label="Included" lines={INCLUDED} positive />
            <ListCard label="Not included" lines={NOT_INCLUDED} positive={false} />
          </div>
        </div>
      </section>

      {/* 9. Where you stay (AIO-pad) */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Where you stay</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                AIO-pad<br /><em>Lumiere Riverside</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                Your team stays at the AIO-pad in Lumiere Riverside, in the leafy Thao Dien
                neighborhood of Saigon. Riverside views, a private car and driver, and the Travel
                Buddy app for everything else. 20 minutes to District 1.
              </p>
              <p style={{ marginTop: 16 }}>
                <a
                  href="https://www.aio-pad.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ textDecoration: "none" }}
                >
                  See the apartments at aio-pad.com <span className="arrow">→</span>
                </a>
              </p>
            </div>
          </div>
          <div className="grid grid-2" style={{ gap: 20 }}>
            <div className="plate" style={{ aspectRatio: "4 / 3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/saigon-private/apartment.jpg"
                alt="Two-bedroom apartment at the AIO-pad in Lumiere Riverside"
              />
            </div>
            <div className="plate" style={{ aspectRatio: "4 / 3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/saigon-private/pool.avif"
                alt="The 50-metre rooftop pool at Lumiere Riverside"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 10. The Polish (human tokens) */}
      <section className="section-paper">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">After you fly home</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                The Polish<br /><em>we don&rsquo;t ship and ghost</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                Working is not the same as production. Every retreat includes 40 human tokens, about
                40 hours of expert time, for the 30 days after you leave. Our team uses them to take
                your builds to production quality, fix the edge cases, and, if there is room, build
                the next thing with you.
              </p>
            </div>
          </div>
          <div
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              borderRadius: 8,
              padding: "32px 36px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 32,
            }}
            className="token-strip"
          >
            <TokenStat
              num="40"
              label="Human tokens included"
              sub="~40 hours of expert polish, free for 30 days"
            />
            <TokenStat
              num="$2K"
              label="Per month to keep going"
              sub="40 more tokens every month, cancel anytime"
            />
            <TokenStat
              num="2"
              label="Meters on one dashboard"
              sub="Claude tokens and human tokens, side by side"
            />
          </div>
          <p
            style={{
              marginTop: 24,
              maxWidth: 720,
              fontSize: 15,
              color: "var(--muted-on-paper)",
              lineHeight: 1.65,
            }}
          >
            Want to keep building after the first month? The{" "}
            <a href="/human-tokens" style={{ color: "var(--accent-deep)" }}>
              Human Tokens subscription
            </a>{" "}
            is $2,000 a month for 40 tokens, cancel anytime. Top-up packs (40, 80, 120) coming soon.
          </p>
        </div>
      </section>

      {/* 11. Who you're working with */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Who you&apos;re working with</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                Your CAIO<br /><em>and a dedicated engineer</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                A private retreat means private people. Dave runs the CAIO roadmap session at the
                start. A dedicated engineer is paired with your team for the full duration. The same
                Saigon-based team handles your post-retreat polish.
              </p>
            </div>
          </div>
          <div className="founder">
            <div className="plate" style={{ aspectRatio: "4 / 5" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/dave-headshot.webp" alt="Dave Hajdu, founder of AI Officer Institute" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
              <span className="eyebrow">Faculty · CAIO</span>
              <p className="quote" style={{ marginTop: 24, color: "var(--paper)" }}>
                &ldquo;The private retreats are for the founder who has a real idea and just needs{" "}
                <em>a few days, a Mac, and an engineer</em> to make it real.&rdquo;
              </p>
              <div className="sig" style={{ color: "var(--muted)" }}>
                <span className="name" style={{ color: "var(--paper)" }}>Dave Hajdu</span>
                <span>Founder, AI Officer Institute</span>
              </div>
              <div className="tag-list" style={{ marginTop: 36 }}>
                <span className="tag" style={{ color: "var(--muted)", borderColor: "var(--rule)" }}>
                  AI Officer Institute
                </span>
                <span className="tag" style={{ color: "var(--muted)", borderColor: "var(--rule)" }}>
                  Engineer-first
                </span>
                <span className="tag" style={{ color: "var(--muted)", borderColor: "var(--rule)" }}>
                  Builder, not consultant
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FAQ */}
      <section className="section-paper">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">FAQ</span>
              <h2 className="h-section" style={{ marginTop: 24 }}>
                Common<br /><em>questions</em>
              </h2>
            </div>
            <div className="col-r">
              <p className="lead">
                Not answered here? Email{" "}
                <a href="mailto:quan@edge8.ai" style={{ color: "var(--accent-deep)" }}>
                  quan@edge8.ai
                </a>{" "}
                and we will reply within a business day.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 40, maxWidth: 920 }}>
            {FAQS.map((it, i) => (
              <details className="faq-item" key={i}>
                <summary>
                  <span>{it.q}</span>
                  <span className="toggle">+</span>
                </summary>
                <div className="body">{it.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 12b. Testimonials */}
      <section className="video-section">
        <div className="wrap">
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: 16 }}>In their own words</p>
          <h2 className="h-section" style={{ textAlign: "center", marginBottom: 48 }}>
            See what founders<br /><em>have to say</em>
          </h2>
          <VideoCarousel videos={[
            { id: "jRwrSYlaO4Q", title: "Infinite Leverage proof of concept" },
            { id: "fXCe3vSkzVo", title: "Infinite Leverage founder story" },
            { id: "YSP6Xt0UEyk", title: "Infinite Leverage testimonial" },
            { id: "9g6bhTIJeKA", title: "Melbourne founder testimonial" },
          ]} />
        </div>
      </section>

      <Footer />
    </>
  );
}

function CompareCard({
  label,
  cost,
  detail,
  highlight,
}: {
  label: string;
  cost: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "var(--ink)" : "var(--cream)",
        color: highlight ? "var(--paper)" : "var(--ink)",
        border: `1px solid ${highlight ? "var(--ink)" : "var(--rule-on-paper)"}`,
        borderRadius: 8,
        padding: "28px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: highlight ? "var(--accent)" : "var(--muted-on-paper)",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--serif)",
          fontSize: 34,
          fontWeight: 300,
          letterSpacing: "-0.025em",
          color: highlight ? "var(--paper)" : "var(--ink)",
          fontVariationSettings: '"opsz" 60, "SOFT" 50',
        }}
      >
        {cost}
      </span>
      <span
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: highlight ? "var(--muted)" : "var(--muted-on-paper)",
        }}
      >
        {detail}
      </span>
    </div>
  );
}

function ProgramBlock({
  label,
  days,
}: {
  label: string;
  days: Array<{ num: string; title: string; sub: string; items: string[] }>;
}) {
  const cols =
    days.length === 1 ? "cols-1" : days.length === 2 ? "cols-2" : "";
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--accent-deep)",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div className={`how-grid ${cols}`}>
        {days.map((day) => (
          <div key={day.num} className="day-card">
            <div className="day-meta">
              <span className="day-num">{day.num}</span>
              <span className="day-sub">{day.sub}</span>
            </div>
            <h3 className="h-card day-title">{day.title}</h3>
            <ul className="day-list">
              {day.items.map((item) => (
                <li key={item}>
                  <span className="day-dot" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListCard({
  label,
  lines,
  positive,
}: {
  label: string;
  lines: string[];
  positive: boolean;
}) {
  const markColor = positive ? "var(--accent-deep)" : "var(--pink)";
  return (
    <div className="pillar">
      <span className="num" style={{ color: markColor }}>
        {label}
      </span>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {lines.map((line) => (
          <li
            key={line}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              fontSize: 15,
              lineHeight: 1.55,
              color: "var(--muted-on-paper)",
            }}
          >
            <span style={{ color: markColor, fontWeight: 700, flexShrink: 0 }}>
              {positive ? "✓" : "×"}
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TokenStat({ num, label, sub }: { num: string; label: string; sub: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 56,
          fontWeight: 300,
          letterSpacing: "-0.025em",
          color: "var(--paper)",
          lineHeight: 1,
          fontVariationSettings: '"opsz" 96, "SOFT" 50',
        }}
      >
        {num}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--accent)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 14,
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.5,
        }}
      >
        {sub}
      </div>
    </div>
  );
}
