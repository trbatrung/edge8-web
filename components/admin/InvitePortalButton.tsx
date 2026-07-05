"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteToPortal } from "@/app/admin/(dashboard)/talent/team/actions";

// Talent > Team row control: invite a team member to the /team portal. Confirms
// first because it emails a real sign-in link.
export function InvitePortalButton({
  teamMemberId,
  provisioned,
}: {
  teamMemberId: string;
  provisioned: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (provisioned) return <span className="admin-badge admin-badge--ok">Portal ✓</span>;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        className="admin-btn admin-btn--sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Send this person a portal sign-in invite by email?")) return;
          setMsg(null);
          start(async () => {
            const res = await inviteToPortal(teamMemberId);
            setMsg(res.ok ? res.message : res.error);
            if (res.ok) router.refresh();
          });
        }}
      >
        {pending ? "Sending…" : "Invite"}
      </button>
      {msg && <span className="admin-cell-muted">{msg}</span>}
    </span>
  );
}
