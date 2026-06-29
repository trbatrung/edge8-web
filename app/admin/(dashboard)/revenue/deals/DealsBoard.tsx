"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanColumn } from "@/components/admin/KanbanBoard";
import { DetailDrawer } from "@/components/admin/DetailDrawer";
import { Badge, statusTone } from "@/components/admin/Badge";
import { formatCents, formatDate, humanize } from "@/lib/admin/format";
import { moveDealStage } from "./actions";

export type DealCard = {
  id: string;
  columnId: string;
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
};

export function DealsBoard({
  columns,
  initialCards,
}: {
  columns: KanbanColumn[];
  initialCards: DealCard[];
}) {
  const [cards, setCards] = useState<DealCard[]>(initialCards);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const selected = cards.find((c) => c.id === selectedId) ?? null;

  function move(cardId: string, toColumnId: string) {
    const prev = cards;
    setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, columnId: toColumnId } : c)));
    setBanner(null);
    moveDealStage(cardId, toColumnId).then((r) => {
      if (!r.ok) {
        setCards(prev);
        setBanner(`Couldn't move deal: ${r.error}`);
      }
    });
  }

  return (
    <>
      {banner && (
        <div className="admin-alert admin-alert--err" style={{ marginBottom: 12 }}>
          {banner}
        </div>
      )}

      <KanbanBoard<DealCard>
        columns={columns}
        cards={cards}
        onMove={move}
        onCardClick={(c) => setSelectedId(c.id)}
        renderCard={(c) => (
          <>
            <div className="sap-card-title">{c.title || c.personName || c.companyName || "(untitled deal)"}</div>
            <div className="sap-card-sub">{c.companyName || c.personName || "—"}</div>
            <div className="sap-card-meta">
              <Badge tone="info">{formatCents(c.amountCents, c.currency ?? undefined)}</Badge>
              {c.probability != null && <span className="sap-card-sub">{c.probability}%</span>}
            </div>
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

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        eyebrow={selected ? humanize(selected.status) : ""}
        title={selected?.title || selected?.personName || "Deal"}
      >
        {selected && (
          <dl className="admin-kv">
            <dt>Stage</dt>
            <dd>
              <Badge tone={statusTone(selected.columnId)}>
                {columns.find((col) => col.id === selected.columnId)?.label ?? "—"}
              </Badge>
            </dd>
            <dt>Status</dt>
            <dd>
              <Badge tone={statusTone(selected.status ?? "")}>{humanize(selected.status)}</Badge>
            </dd>
            <dt>Amount</dt>
            <dd>{formatCents(selected.amountCents, selected.currency ?? undefined)}</dd>
            <dt>Probability</dt>
            <dd>{selected.probability != null ? `${selected.probability}%` : "—"}</dd>
            <dt>Company</dt>
            <dd>{selected.companyName || "—"}</dd>
            <dt>Contact</dt>
            <dd>
              {selected.personId ? (
                <Link href={`/admin/contacts/${selected.personId}`} className="admin-cell-strong">
                  {selected.personName || "View contact"}
                </Link>
              ) : (
                selected.personName || "—"
              )}
            </dd>
            <dt>Expected close</dt>
            <dd>{selected.expectedClose ? formatDate(selected.expectedClose) : "—"}</dd>
            <dt>Source</dt>
            <dd>{selected.source || "—"}</dd>
          </dl>
        )}
      </DetailDrawer>
    </>
  );
}
