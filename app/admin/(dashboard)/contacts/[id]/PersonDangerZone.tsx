"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { archivePerson, deletePerson, restorePerson } from "../actions";

export function PersonDangerZone({
  personId,
  personName,
  archived,
}: {
  personId: string;
  personName: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [restoring, startRestore] = useTransition();

  return (
    <div className="admin-danger-zone">
      <div className="admin-danger-zone-title">Danger zone</div>

      {archived ? (
        <div className="admin-danger-row">
          <span className="admin-danger-row-text">
            This contact is archived and hidden from the working lists. Restore it to bring it back.
          </span>
          <button
            type="button"
            className="admin-btn"
            disabled={restoring}
            onClick={() => startRestore(async () => {
              const r = await restorePerson(personId);
              if (r.ok) router.refresh();
            })}
          >
            {restoring ? "Restoring…" : "Restore"}
          </button>
        </div>
      ) : (
        <div className="admin-danger-row">
          <span className="admin-danger-row-text">
            Archive hides this contact from Contacts and the lead queue but keeps the full record and
            history. Reversible.
          </span>
          <ConfirmButton
            className="admin-btn"
            label="Archive"
            title="Archive this contact?"
            body={`${personName} will be hidden from the working lists. You can restore them any time.`}
            confirmLabel="Archive"
            onConfirm={() => archivePerson(personId)}
            onDone={() => router.refresh()}
          />
        </div>
      )}

      <div className="admin-danger-row">
        <span className="admin-danger-row-text">
          Permanently erase this person and their qualifications, interactions and relationships (GDPR
          right to erasure). Cannot be undone, and is blocked while they have orders, bookings or deals.
        </span>
        <ConfirmButton
          label="Delete permanently"
          title="Permanently erase this contact?"
          body={
            <>
              This erases <strong>{personName}</strong> and their linked history under GDPR
              right-to-erasure. This cannot be undone.
            </>
          }
          confirmLabel="Erase permanently"
          typeToConfirm={personName}
          onConfirm={() => deletePerson(personId)}
          onDone={() => router.push("/admin/contacts")}
        />
      </div>
    </div>
  );
}
