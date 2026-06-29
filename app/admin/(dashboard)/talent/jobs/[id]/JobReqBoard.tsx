"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanColumn } from "@/components/admin/KanbanBoard";
import { DetailDrawer } from "@/components/admin/DetailDrawer";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatDate, humanize } from "@/lib/admin/format";
import { moveApplicationStage } from "./actions";

export type AppCard = {
  id: string;
  columnId: string;
  candidateName: string | null;
  personId: string | null;
  headline: string | null;
  status: string | null;
  rating: number | null;
  appliedAt: string | null;
};

export function JobReqBoard({
  jobReqId,
  columns,
  initialCards,
}: {
  jobReqId: string;
  columns: KanbanColumn[];
  initialCards: AppCard[];
}) {
  const [cards, setCards] = useState<AppCard[]>(initialCards);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const selected = cards.find((c) => c.id === selectedId) ?? null;

  function move(cardId: string, toColumnId: string) {
    const prev = cards;
    setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, columnId: toColumnId } : c)));
    setBanner(null);
    moveApplicationStage(cardId, toColumnId, jobReqId).then((r) => {
      if (!r.ok) {
        setCards(prev);
        setBanner(`Couldn't move applicant: ${r.error}`);
      }
    });
  }

  if (!columns.length) {
    return (
      <div className="admin-card" style={{ padding: "16px 18px" }}>
        <span className="admin-cell-muted">This req has no hiring stages defined yet.</span>
      </div>
    );
  }

  return (
    <>
      {banner && <div className="admin-alert admin-alert--err" style={{ marginBottom: 12 }}>{banner}</div>}
      <KanbanBoard<AppCard>
        columns={columns}
        cards={cards}
        onMove={move}
        onCardClick={(c) => setSelectedId(c.id)}
        renderCard={(c) => (
          <>
            <div className="sap-card-title">{c.candidateName || "(unknown)"}</div>
            <div className="sap-card-sub">{c.headline || "—"}</div>
            <div className="sap-card-meta">
              {c.status && <Badge tone={statusTone(c.status)}>{humanize(c.status)}</Badge>}
              {c.rating != null && (
                <span className="sap-card-sub" style={{ marginLeft: "auto" }}>{c.rating}★</span>
              )}
            </div>
          </>
        )}
      />
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        eyebrow={selected ? humanize(selected.status) : ""}
        title={selected?.candidateName || "Application"}
      >
        {selected && (
          <dl className="admin-kv">
            <dt>Status</dt>
            <dd><Badge tone={statusTone(selected.status ?? "")}>{humanize(selected.status)}</Badge></dd>
            <dt>Rating</dt>
            <dd>{selected.rating != null ? `${selected.rating}★` : "—"}</dd>
            <dt>Headline</dt>
            <dd>{selected.headline || "—"}</dd>
            <dt>Applied</dt>
            <dd>{selected.appliedAt ? formatDate(selected.appliedAt) : "—"}</dd>
            <dt>Contact</dt>
            <dd>
              {selected.personId ? (
                <Link href={`/admin/contacts/${selected.personId}`} className="admin-cell-strong">Open Contact 360</Link>
              ) : (
                "—"
              )}
            </dd>
          </dl>
        )}
      </DetailDrawer>
    </>
  );
}
