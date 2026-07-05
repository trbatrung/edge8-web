"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KanbanBoard, type KanbanColumn } from "@/components/admin/KanbanBoard";
import { DetailDrawer } from "@/components/admin/DetailDrawer";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatCents, formatDate, humanize } from "@/lib/admin/format";
import { decideHandoff, moveDealStage, saveNextStep } from "./actions";

export const HANDOFF_COLUMN_ID = "handoff";

export type DealCard = {
  id: string;
  columnId: string;
  stageId: string | null;
  title: string | null;
  personId: string | null;
  personName: string | null;
  companyName: string | null;
  amountCents: number | null;
  currency: string | null;
  probability: number | null;
  status: string | null;
  expectedClose: string | null;
  source: string | null;
  nextStep: string | null;
  nextStepDate: string | null;
  handoffStatus: string;
  lostReason: string | null;
  updatedAt: string | null;
};

const LOST_REASONS = [
  ["price", "Price"],
  ["competitor", "Chose competitor"],
  ["no_decision", "No decision"],
  ["bad_fit", "Bad fit"],
  ["bad_timing", "Bad timing"],
  ["ghosted", "Ghosted"],
  ["other", "Other"],
] as const;

const REJECT_REASONS = [
  ["not_qualified", "Not qualified"],
  ["bad_fit", "Bad fit"],
  ["duplicate", "Duplicate"],
  ["bad_timing", "Bad timing"],
  ["other", "Other"],
] as const;

function idleDays(updatedAt: string | null): number | null {
  if (!updatedAt) return null;
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

function NextStepLine({ card }: { card: DealCard }) {
  if (card.status !== "open") return null;
  if (!card.nextStepDate) {
    return (
      <div className="sap-card-sub" style={{ color: "var(--admin-err-ink)", fontWeight: 600 }}>
        No next step
      </div>
    );
  }
  return (
    <div className="sap-card-sub">
      → {card.nextStep || "next step"} · {formatDate(card.nextStepDate)}
    </div>
  );
}

export function DealsBoard({
  columns,
  initialCards,
  lostStageIds,
}: {
  columns: KanbanColumn[];
  initialCards: DealCard[];
  lostStageIds: string[];
}) {
  const router = useRouter();
  const [cards, setCards] = useState<DealCard[]>(initialCards);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Board (kanban) is the default; the last-picked view is remembered in
  // localStorage. Init to "board" on both server and first client render to
  // avoid a hydration mismatch, then hydrate the saved choice in an effect.
  const [view, setView] = useState<"board" | "list">("board");
  useEffect(() => {
    const saved = localStorage.getItem("deals-view");
    if (saved === "board" || saved === "list") setView(saved);
  }, []);
  function changeView(next: "board" | "list") {
    setView(next);
    try {
      localStorage.setItem("deals-view", next);
    } catch {
      // private mode / storage disabled — the toggle still works this session.
    }
  }
  const [banner, setBanner] = useState<string | null>(null);
  const [pendingLost, setPendingLost] = useState<{ cardId: string; toColumnId: string } | null>(
    null,
  );
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const selected = cards.find((c) => c.id === selectedId) ?? null;
  const lostSet = new Set(lostStageIds);

  function applyMove(cardId: string, toColumnId: string, lostReason?: string) {
    const prev = cards;
    setCards((cs) =>
      cs.map((c) =>
        c.id === cardId
          ? { ...c, columnId: toColumnId, stageId: toColumnId, handoffStatus: c.handoffStatus === "pending" ? "accepted" : c.handoffStatus }
          : c,
      ),
    );
    setBanner(null);
    const card = prev.find((c) => c.id === cardId);
    const chain =
      card?.handoffStatus === "pending"
        ? decideHandoff(cardId, "accepted").then((r) =>
            r.ok ? moveDealStage(cardId, toColumnId, lostReason) : r,
          )
        : moveDealStage(cardId, toColumnId, lostReason);
    chain.then((r) => {
      if (!r.ok) {
        setCards(prev);
        setBanner(`Couldn't move deal: ${r.error}`);
      } else {
        router.refresh();
      }
    });
  }

  function move(cardId: string, toColumnId: string) {
    if (toColumnId === HANDOFF_COLUMN_ID) return;
    if (lostSet.has(toColumnId)) {
      setPendingLost({ cardId, toColumnId });
      setReason("");
      return;
    }
    applyMove(cardId, toColumnId);
  }

  function decide(cardId: string, decision: "accepted" | "rejected", rejectReason?: string) {
    setBanner(null);
    decideHandoff(cardId, decision, rejectReason).then((r) => {
      if (!r.ok) setBanner(r.error);
      else {
        setRejecting(null);
        setCards((cs) =>
          cs
            .map((c) =>
              c.id === cardId
                ? decision === "accepted"
                  ? { ...c, handoffStatus: "accepted", columnId: c.stageId ?? c.columnId }
                  : { ...c, handoffStatus: "rejected", status: "lost" }
                : c,
            )
            .filter((c) => !(c.id === cardId && decision === "rejected")),
        );
        router.refresh();
      }
    });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div className="admin-viewtoggle" role="group" aria-label="Deal view">
          <button
            type="button"
            className={view === "board" ? "is-active" : ""}
            aria-pressed={view === "board"}
            onClick={() => changeView("board")}
          >
            Board
          </button>
          <button
            type="button"
            className={view === "list" ? "is-active" : ""}
            aria-pressed={view === "list"}
            onClick={() => changeView("list")}
          >
            List
          </button>
        </div>
      </div>

      {banner && (
        <div className="admin-alert admin-alert--err" style={{ marginBottom: 12 }}>
          {banner}
        </div>
      )}

      {pendingLost && (
        <div className="admin-alert" style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span>Why was this deal lost?</span>
          <select className="admin-input" style={{ maxWidth: 200 }} value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Pick a reason…</option>
            {LOST_REASONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            disabled={!reason}
            onClick={() => {
              applyMove(pendingLost.cardId, pendingLost.toColumnId, reason);
              setPendingLost(null);
            }}
          >
            Mark lost
          </button>
          <button type="button" className="admin-btn" onClick={() => setPendingLost(null)}>
            Cancel
          </button>
        </div>
      )}

      {view === "board" ? (
        <KanbanBoard<DealCard>
        columns={columns}
        cards={cards}
        onMove={move}
        onCardClick={(c) => setSelectedId(c.id)}
        renderCard={(c) => (
          <>
            <div className="sap-card-title">{c.title || c.personName || c.companyName || "(untitled deal)"}</div>
            <div className="sap-card-sub">{c.companyName || c.personName || "—"}</div>
            <NextStepLine card={c} />
            <div className="sap-card-meta">
              <Badge tone="info">{formatCents(c.amountCents, c.currency ?? undefined)}</Badge>
              {c.probability != null && <span className="sap-card-sub">{c.probability}%</span>}
              {(() => {
                const d = idleDays(c.updatedAt);
                return c.status === "open" && d != null && d > 14 ? (
                  <Badge tone="warn">idle {d}d</Badge>
                ) : null;
              })()}
            </div>
            {c.columnId === HANDOFF_COLUMN_ID && (
              <div className="sap-card-handoff" style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                {rejecting === c.id ? (
                  <>
                    <select className="admin-input" style={{ maxWidth: 150, fontSize: 12 }} value={reason} onChange={(e) => setReason(e.target.value)}>
                      <option value="">Reason…</option>
                      {REJECT_REASONS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="admin-btn admin-btn--danger" disabled={!reason} onClick={() => decide(c.id, "rejected", reason)}>
                      Confirm
                    </button>
                    <button type="button" className="admin-btn" onClick={() => setRejecting(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="admin-btn admin-btn--primary" onClick={() => decide(c.id, "accepted")}>
                      Accept
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => {
                        setRejecting(c.id);
                        setReason("");
                      }}
                    >
                      Reject…
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        columnFooter={(_col, colCards) => {
          const total = colCards.reduce((s, c) => s + (c.amountCents ?? 0), 0);
          const weighted = colCards.reduce(
            (s, c) => s + (c.amountCents ?? 0) * ((c.probability ?? 0) / 100),
            0,
          );
          return (
            <div className="sap-col-foot">
              <span>{formatCents(total)}</span>
              <span className="sap-card-sub">{formatCents(weighted)} weighted</span>
            </div>
          );
        }}
      />
      ) : (
        <DealsList cards={cards} columns={columns} onRowClick={(c) => setSelectedId(c.id)} />
      )}

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        eyebrow={selected ? humanize(selected.status) : ""}
        title={selected?.title || selected?.personName || "Deal"}
      >
        {selected && (
          <DealDetail
            card={selected}
            stages={columns.filter((c) => c.id !== HANDOFF_COLUMN_ID)}
            lostSet={lostSet}
            onChangeStage={applyMove}
            onDecideHandoff={decide}
            onSaved={() => router.refresh()}
          />
        )}
      </DetailDrawer>
    </>
  );
}

function DealDetail({
  card,
  stages,
  lostSet,
  onChangeStage,
  onDecideHandoff,
  onSaved,
}: {
  card: DealCard;
  stages: KanbanColumn[];
  lostSet: Set<string>;
  onChangeStage: (cardId: string, toStageId: string, lostReason?: string) => void;
  onDecideHandoff: (cardId: string, decision: "accepted" | "rejected", rejectReason?: string) => void;
  onSaved: () => void;
}) {
  const [nextStep, setNextStep] = useState(card.nextStep ?? "");
  const [nextStepDate, setNextStepDate] = useState(card.nextStepDate ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  // Lost stages need a reason before the move commits; mirror the board banner
  // flow but inline in the drawer so it stays visible above the board backdrop.
  const [pendingLostStage, setPendingLostStage] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState("");
  // Handoff decision, so list view (no on-card buttons) can accept/reject too.
  const [rejectingHandoff, setRejectingHandoff] = useState(false);
  const [handoffReason, setHandoffReason] = useState("");
  const pendingHandoff = card.handoffStatus === "pending";

  return (
    <>
      {pendingHandoff && (
        <div style={{ marginBottom: 16 }}>
          <div className="admin-label" style={{ marginBottom: 6 }}>
            SDR handoff
          </div>
          {rejectingHandoff ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <select
                className="admin-input"
                aria-label="Reject reason"
                value={handoffReason}
                onChange={(e) => setHandoffReason(e.target.value)}
              >
                <option value="">Why reject this handoff?</option>
                {REJECT_REASONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  disabled={!handoffReason}
                  onClick={() => onDecideHandoff(card.id, "rejected", handoffReason)}
                >
                  Confirm reject
                </button>
                <button type="button" className="admin-btn" onClick={() => setRejectingHandoff(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => onDecideHandoff(card.id, "accepted")}
              >
                Accept handoff
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  setRejectingHandoff(true);
                  setHandoffReason("");
                }}
              >
                Reject…
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div className="admin-label" style={{ marginBottom: 6 }}>
          Stage
        </div>
        <select
          className="admin-input"
          aria-label="Deal stage"
          value={pendingLostStage ?? (pendingHandoff ? "" : card.stageId ?? "")}
          onChange={(e) => {
            const to = e.target.value;
            if (!to) return;
            if (lostSet.has(to)) {
              setPendingLostStage(to);
              setLostReason("");
            } else {
              setPendingLostStage(null);
              onChangeStage(card.id, to);
            }
          }}
        >
          {pendingHandoff && <option value="">Accept into stage…</option>}
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {pendingHandoff && (
          <div className="admin-hint" style={{ marginTop: 6 }}>
            Choosing a stage accepts the SDR handoff.
          </div>
        )}
        {pendingLostStage && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <select
              className="admin-input"
              aria-label="Lost reason"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            >
              <option value="">Why was this deal lost?</option>
              {LOST_REASONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={!lostReason}
                onClick={() => {
                  onChangeStage(card.id, pendingLostStage, lostReason);
                  setPendingLostStage(null);
                }}
              >
                Mark lost
              </button>
              <button type="button" className="admin-btn" onClick={() => setPendingLostStage(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <dl className="admin-kv">
        <dt>Status</dt>
        <dd>
          <Badge tone={statusTone(card.status ?? "")}>{humanize(card.status)}</Badge>
          {card.handoffStatus === "pending" && (
            <>
              {" "}
              <Badge tone="warn">Handoff pending</Badge>
            </>
          )}
        </dd>
        <dt>Amount</dt>
        <dd>{formatCents(card.amountCents, card.currency ?? undefined)}</dd>
        <dt>Probability</dt>
        <dd>{card.probability != null ? `${card.probability}%` : "—"}</dd>
        <dt>Company</dt>
        <dd>{card.companyName || "—"}</dd>
        <dt>Contact</dt>
        <dd>
          {card.personId ? (
            <Link href={`/admin/contacts/${card.personId}`} className="admin-cell-strong">
              {card.personName || "View contact"}
            </Link>
          ) : (
            card.personName || "—"
          )}
        </dd>
        <dt>Expected close</dt>
        <dd>{card.expectedClose ? formatDate(card.expectedClose) : "—"}</dd>
        <dt>Source</dt>
        <dd>{card.source || "—"}</dd>
        {card.lostReason && (
          <>
            <dt>Lost reason</dt>
            <dd>{humanize(card.lostReason)}</dd>
          </>
        )}
      </dl>

      {card.status === "open" && (
        <div style={{ marginTop: 16 }}>
          <div className="admin-label" style={{ marginBottom: 6 }}>
            Next step
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              className="admin-input"
              placeholder="What happens next?"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
            />
            <input
              className="admin-input"
              type="date"
              value={nextStepDate}
              onChange={(e) => setNextStepDate(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => {
                setMsg(null);
                saveNextStep(card.id, nextStep, nextStepDate).then((r) => {
                  if (!r.ok) setMsg(r.error);
                  else {
                    setMsg("Saved");
                    onSaved();
                  }
                });
              }}
            >
              Save next step
            </button>
            {msg && <span className="admin-cell-muted">{msg}</span>}
          </div>
        </div>
      )}
    </>
  );
}

// Non-drag alternative to the kanban: a flat table driven by the same client
// card state. Row tap opens the shared DealDetail drawer, so every action
// (stage change, handoff decision, next step) works identically to the board.
function DealsList({
  cards,
  columns,
  onRowClick,
}: {
  cards: DealCard[];
  columns: KanbanColumn[];
  onRowClick: (card: DealCard) => void;
}) {
  const stageLabel = new Map(columns.map((c) => [c.id, c.label]));

  if (cards.length === 0) {
    return <div className="admin-empty">No deals yet.</div>;
  }

  return (
    <div className="admin-table-wrap">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Deal</th>
              <th>Stage</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Prob</th>
              <th>Next step</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => {
              const d = idleDays(c.updatedAt);
              const idle = c.status === "open" && d != null && d > 14;
              return (
                <tr key={c.id} className="is-clickable" onClick={() => onRowClick(c)}>
                  <td>
                    <div className="admin-cell-strong">
                      {c.title || c.personName || c.companyName || "(untitled deal)"}
                    </div>
                    <div className="admin-cell-muted">{c.companyName || c.personName || "—"}</div>
                  </td>
                  <td>
                    {c.columnId === HANDOFF_COLUMN_ID ? (
                      <Badge tone="warn">New from SDR</Badge>
                    ) : (
                      stageLabel.get(c.columnId) ?? "—"
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatCents(c.amountCents, c.currency ?? undefined)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {c.probability != null ? `${c.probability}%` : "—"}
                  </td>
                  <td>
                    {c.status !== "open" ? (
                      <span className="admin-cell-muted">—</span>
                    ) : c.nextStepDate ? (
                      <span>
                        {c.nextStep || "next step"} · {formatDate(c.nextStepDate)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--admin-err-ink)", fontWeight: 600 }}>
                        No next step
                      </span>
                    )}
                  </td>
                  <td>
                    <Badge tone={statusTone(c.status ?? "")}>{humanize(c.status)}</Badge>
                    {idle && (
                      <>
                        {" "}
                        <Badge tone="warn">idle {d}d</Badge>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
