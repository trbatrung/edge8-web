"use client";

import { useState, type ReactNode } from "react";

export type TabDef = { key: string; label: string; count?: number; content: ReactNode };

// Server-rendered tab content is passed in as ReactNode (RSC payload) — all
// panels are rendered upfront from already-fetched data; this only toggles which
// is visible.
export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div>
      <div className="admin-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === active}
            className={`admin-tab${t.key === active ? " is-active" : ""}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
            {typeof t.count === "number" ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>
      <div className="admin-tab-panel">{current?.content}</div>
    </div>
  );
}
