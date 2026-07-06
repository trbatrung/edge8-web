"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/admin/Badge";
import { formatDate } from "@/lib/admin/format";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABEL,
  countWorkingDays,
  formatDays,
  statusTone,
} from "@/lib/admin/time-off";
import { cancelTimeOff, createTimeOff, decideTimeOff } from "./actions";

export type MemberOption = { id: string; name: string };

export type RequestRow = {
  id: string;
  memberName: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  reason: string | null;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export function TimeOffBoard({
  members,
  rows,
}: {
  members: MemberOption[];
  rows: RequestRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [memberId, setMemberId] = useState("");
  const [leaveType, setLeaveType] = useState<string>("vacation");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");

  const previewDays = countWorkingDays(startDate, endDate, isHalfDay);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okText: string) {
    setBanner(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setBanner({ tone: "ok", text: okText });
        router.refresh();
      } else {
        setBanner({ tone: "err", text: res.error });
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(
      () => createTimeOff({ teamMemberId: memberId, leaveType, startDate, endDate, isHalfDay, reason }),
      "Request submitted.",
    );
    setReason("");
  }

  return (
    <div className="admin-timeoff">
      {banner && (
        <div className={`admin-alert admin-alert--${banner.tone === "ok" ? "ok" : "err"}`}>
          {banner.text}
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h2 className="admin-card-title">Request time off</h2>
        <form className="admin-form" onSubmit={submit}>
          <div className="admin-timeoff-grid">
            <div className="admin-field">
              <label className="admin-label" htmlFor="to-member">Team member</label>
              <select
                id="to-member"
                className="admin-select"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="to-type">Leave type</label>
              <select
                id="to-type"
                className="admin-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>{LEAVE_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="to-start">Start date</label>
              <input
                id="to-start"
                className="admin-input"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                required
              />
            </div>

            <div className="admin-field">
              <label className="admin-label" htmlFor="to-end">End date</label>
              <input
                id="to-end"
                className="admin-input"
                type="date"
                value={endDate}
                min={startDate}
                disabled={isHalfDay}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <label className="admin-timeoff-check">
            <input
              type="checkbox"
              checked={isHalfDay}
              onChange={(e) => {
                setIsHalfDay(e.target.checked);
                if (e.target.checked) setEndDate(startDate);
              }}
            />
            Half day
          </label>

          <div className="admin-field">
            <label className="admin-label" htmlFor="to-reason">Reason (optional)</label>
            <textarea
              id="to-reason"
              className="admin-textarea"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
              {pending ? "Saving…" : "Submit request"}
            </button>
            {previewDays > 0 && (
              <span className="admin-timeoff-preview">{formatDays(previewDays)} of leave</span>
            )}
          </div>
        </form>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Team member</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Status</th>
              <th>Reason</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-cell-muted">No time off requests yet.</td>
              </tr>
            ) : (
              rows.map((r) => {
                const days = countWorkingDays(r.startDate, r.endDate, r.isHalfDay);
                const range =
                  r.startDate === r.endDate
                    ? formatDate(r.startDate) + (r.isHalfDay ? " (half)" : "")
                    : `${formatDate(r.startDate)} → ${formatDate(r.endDate)}`;
                return (
                  <tr key={r.id}>
                    <td className="admin-cell-strong">{r.memberName}</td>
                    <td>{LEAVE_TYPE_LABEL[r.leaveType as keyof typeof LEAVE_TYPE_LABEL] ?? r.leaveType}</td>
                    <td>{range}</td>
                    <td>{days > 0 ? formatDays(days) : "—"}</td>
                    <td><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                    <td className="admin-cell-muted">{r.reason || "—"}</td>
                    <td>
                      <div className="admin-timeoff-actions">
                        {r.status === "requested" && (
                          <>
                            <button
                              className="admin-btn admin-btn--sm admin-btn--primary"
                              disabled={pending}
                              onClick={() => run(() => decideTimeOff(r.id, "approved"), "Request approved.")}
                            >
                              Approve
                            </button>
                            <button
                              className="admin-btn admin-btn--sm admin-btn--danger"
                              disabled={pending}
                              onClick={() => run(() => decideTimeOff(r.id, "rejected"), "Request rejected.")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(r.status === "requested" || r.status === "approved") && (
                          <button
                            className="admin-btn admin-btn--sm"
                            disabled={pending}
                            onClick={() => run(() => cancelTimeOff(r.id), "Request cancelled.")}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
