"use client";

import { useMemo, useState } from "react";
import {
  BASE_TEAM_SIZE,
  BASE_PRICE,
  DAY_OPTIONS,
  type DayCount,
  calculateTotal,
} from "@/lib/private-session";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

const LEAD_TIME_DAYS = 14;
const BOOKING_WINDOW_DAYS = 365;

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "10.5px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--muted-on-paper)",
  fontWeight: 600,
};

const sectionLabel: React.CSSProperties = {
  ...labelStyle,
  display: "block",
  marginBottom: 8,
};

function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function PrivateSessionReserve() {
  const [days, setDays] = useState<DayCount>(3);
  const [teamSize, setTeamSize] = useState<number>(BASE_TEAM_SIZE);
  const [state, setState] = useState<FormState>({ status: "idle" });

  const total = calculateTotal(days, teamSize);
  const additional = Math.max(0, teamSize - BASE_TEAM_SIZE);

  const { minDate, maxDate } = useMemo(() => {
    const now = new Date();
    const min = new Date(now);
    min.setDate(min.getDate() + LEAD_TIME_DAYS);
    const max = new Date(now);
    max.setDate(max.getDate() + BOOKING_WINDOW_DAYS);
    return { minDate: isoDate(min), maxDate: isoDate(max) };
  }, []);

  function decTeam() {
    setTeamSize((n) => Math.max(BASE_TEAM_SIZE, n - 1));
  }
  function incTeam() {
    setTeamSize((n) => n + 1);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });

    const formData = new FormData(e.currentTarget);
    const payload = {
      days,
      team_size: teamSize,
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      start_date: String(formData.get("start_date") || ""),
      idea: String(formData.get("idea") || ""),
    };

    try {
      const res = await fetch("/api/checkout/saigon-private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setState({ status: "error", message: data.error || "Could not start checkout." });
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--rule-on-paper)",
        background: "var(--cream)",
        padding: "32px",
        boxShadow: "0 1px 6px rgba(2,8,28,0.07)",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Length */}
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={sectionLabel}>How many days</legend>
          <div style={{ display: "flex", gap: 8 }}>
            {DAY_OPTIONS.map((d) => {
              const selected = days === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  aria-pressed={selected}
                  style={{
                    flex: 1,
                    padding: "14px 0",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: selected ? "var(--accent-deep)" : "var(--rule-on-paper)",
                    background: selected ? "rgba(40,123,232,0.06)" : "var(--paper)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 24,
                      fontWeight: 400,
                      fontVariationSettings: '"opsz" 36, "SOFT" 30',
                    }}
                  >
                    {d}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--muted-on-paper)",
                      marginTop: 2,
                    }}
                  >
                    days
                  </span>
                </button>
              );
            })}
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--muted-on-paper)" }}>
            {formatUsd(BASE_PRICE)} for a 3-day retreat, first person. Each extra day is $1,000.
          </p>
        </fieldset>

        {/* Team size */}
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={sectionLabel}>How many people</legend>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 20px",
              border: "1px solid var(--rule-on-paper)",
              borderRadius: 8,
              background: "var(--paper)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={decTeam}
                disabled={teamSize <= BASE_TEAM_SIZE}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  border: "1px solid var(--rule-on-paper)",
                  background: "var(--cream)",
                  fontSize: 18,
                  cursor: teamSize <= BASE_TEAM_SIZE ? "not-allowed" : "pointer",
                  opacity: teamSize <= BASE_TEAM_SIZE ? 0.4 : 1,
                  color: "var(--ink)",
                }}
                aria-label="Decrease team size"
              >
                −
              </button>
              <span
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 28,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                  minWidth: 36,
                  textAlign: "center",
                  fontVariationSettings: '"opsz" 36, "SOFT" 30',
                }}
              >
                {teamSize}
              </span>
              <button
                type="button"
                onClick={incTeam}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  border: "1px solid var(--rule-on-paper)",
                  background: "var(--cream)",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "var(--ink)",
                }}
                aria-label="Increase team size"
              >
                +
              </button>
            </div>
            <div style={{ textAlign: "right", fontSize: 13, color: "var(--muted-on-paper)" }}>
              {additional === 0 ? (
                <>Just you for now</>
              ) : (
                <>
                  +{additional} {additional === 1 ? "person" : "people"} · $1,000 each per day
                </>
              )}
            </div>
          </div>
        </fieldset>

        {/* Live total */}
        <div
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            borderRadius: 8,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Total
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 36,
                fontWeight: 300,
                letterSpacing: "-0.025em",
                color: "var(--paper)",
                fontVariationSettings: '"opsz" 60, "SOFT" 50',
                marginTop: 2,
              }}
            >
              {formatUsd(total)}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            <div>
              {days} days · {teamSize} {teamSize === 1 ? "person" : "people"}
            </div>
            <div style={{ marginTop: 2 }}>Mac Mini, 8 agents and The Polish included</div>
          </div>
        </div>

        {/* Personal details */}
        <div>
          <span style={sectionLabel}>Your details</span>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Jordan Pham"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jordan@yourcompany.com"
              />
            </div>
            <div className="field full">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                type="text"
                required
                autoComplete="organization"
                placeholder="Your company"
              />
            </div>
            <div className="field full">
              <label htmlFor="start_date">Start date</label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                required
                min={minDate}
                max={maxDate}
              />
              <p
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "var(--muted-on-paper)",
                }}
              >
                Pick the day you arrive. Earliest start is {LEAD_TIME_DAYS} days from today.
                Your dates lock in as soon as payment completes.
              </p>
            </div>
            <div className="field full">
              <label htmlFor="idea">In one sentence, what do you want to build?</label>
              <textarea id="idea" name="idea" placeholder="One sentence is fine." rows={3} required />
            </div>
          </div>
        </div>

        {state.status === "error" && <p className="form-error">{state.message}</p>}

        <div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={state.status === "submitting"}
            style={{ width: "100%", opacity: state.status === "submitting" ? 0.5 : 1 }}
          >
            {state.status === "submitting" ? "Processing…" : `Reserve · ${formatUsd(total)}`}
            {state.status !== "submitting" && <span className="arrow"> →</span>}
          </button>
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--muted-on-paper)",
              textAlign: "center",
            }}
          >
            Secure checkout via Stripe. Full refund up to 30 days before your start date.
          </p>
          <p
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "var(--muted-on-paper)",
              textAlign: "center",
            }}
          >
            Not ready to commit?{" "}
            <a href="mailto:quan@edge8.ai" style={{ color: "var(--accent-deep)" }}>
              Email quan@edge8.ai
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
