"use client";

import { useEffect, type ReactNode } from "react";

export function DetailDrawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="admin-drawer-backdrop" onClick={onClose} />
      <aside className="admin-drawer" role="dialog" aria-modal="true">
        <div className="admin-drawer-head">
          <div>
            {eyebrow && <div className="admin-drawer-eyebrow">{eyebrow}</div>}
            <div className="admin-drawer-title">{title}</div>
          </div>
          <button className="admin-drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="admin-drawer-body">{children}</div>
      </aside>
    </>
  );
}
