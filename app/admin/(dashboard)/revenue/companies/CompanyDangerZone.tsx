"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { archiveCompany, deleteCompany, restoreCompany } from "./actions";

export function CompanyDangerZone({
  companyId,
  companyName,
  archived,
}: {
  companyId: string;
  companyName: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [restoring, startRestore] = useTransition();

  return (
    <div className="admin-danger-zone">
      <div className="admin-danger-zone-title">Danger zone</div>

      {archived ? (
        <div className="admin-danger-row">
          <span className="admin-danger-row-text">This company is archived and hidden from the list. Restore it to bring it back.</span>
          <button
            type="button"
            className="admin-btn"
            disabled={restoring}
            onClick={() => startRestore(async () => {
              const r = await restoreCompany(companyId);
              if (r.ok) router.refresh();
            })}
          >
            {restoring ? "Restoring…" : "Restore"}
          </button>
        </div>
      ) : (
        <div className="admin-danger-row">
          <span className="admin-danger-row-text">
            Archive hides this company from the list but keeps the record and its links. Reversible.
          </span>
          <ConfirmButton
            className="admin-btn"
            label="Archive"
            title="Archive this company?"
            body={`${companyName} will be hidden from the companies list. You can restore it any time.`}
            confirmLabel="Archive"
            onConfirm={() => archiveCompany(companyId)}
            onDone={() => router.refresh()}
          />
        </div>
      )}

      <div className="admin-danger-row">
        <span className="admin-danger-row-text">
          Permanently delete this company. Cannot be undone, and is blocked while it has linked deals, job
          requisitions or projects.
        </span>
        <ConfirmButton
          label="Delete permanently"
          title="Permanently delete this company?"
          body={
            <>
              This deletes <strong>{companyName}</strong>. This cannot be undone.
            </>
          }
          confirmLabel="Delete permanently"
          typeToConfirm={companyName}
          onConfirm={() => deleteCompany(companyId)}
          onDone={() => router.push("/admin/revenue/companies")}
        />
      </div>
    </div>
  );
}
