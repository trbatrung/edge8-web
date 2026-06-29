"use client";

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import type { ReactNode } from "react";

export type KanbanColumn = { id: string; label: string; accent?: string };
export type KanbanCardBase = { id: string; columnId: string };

// Generic optimistic kanban. The parent owns card state and reconciliation; this
// only reports moves via onMove. Reusable for inquiries (status) and deals (stage).
export function KanbanBoard<T extends KanbanCardBase>({
  columns,
  cards,
  onMove,
  onCardClick,
  renderCard,
  columnFooter,
}: {
  columns: KanbanColumn[];
  cards: T[];
  onMove: (cardId: string, toColumnId: string) => void;
  onCardClick?: (card: T) => void;
  renderCard: (card: T) => ReactNode;
  columnFooter?: (column: KanbanColumn, cards: T[]) => ReactNode;
}) {
  function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    onMove(draggableId, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="sap-kanban">
        {columns.map((col) => {
          const colCards = cards.filter((c) => c.columnId === col.id);
          return (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  className={`sap-col${snapshot.isDraggingOver ? " is-over" : ""}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="sap-col-head">
                    <span
                      className="sap-col-dot"
                      style={col.accent ? { background: col.accent } : undefined}
                    />
                    <span className="sap-col-label">{col.label}</span>
                    <span className="sap-col-count">{colCards.length}</span>
                  </div>
                  <div className="sap-col-body">
                    {colCards.map((card, i) => (
                      <Draggable draggableId={card.id} index={i} key={card.id}>
                        {(dp, ds) => (
                          <div
                            ref={dp.innerRef}
                            {...dp.draggableProps}
                            {...dp.dragHandleProps}
                            className={`sap-card${ds.isDragging ? " is-dragging" : ""}`}
                            onClick={() => onCardClick?.(card)}
                          >
                            {renderCard(card)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                  {columnFooter?.(col, colCards)}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
