"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DetailDrawer } from "@/components/admin/DetailDrawer";
import { CompanyEditForm, type EditableCompany } from "./CompanyEditForm";

// The list's inline "Edit" affordance: a drawer for the basics, with a link out
// to the full company detail page.
export function CompanyEditDrawer({ company }: { company: EditableCompany }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button type="button" className="admin-btn admin-btn--sm" onClick={() => setOpen(true)}>
        Edit
      </button>
      <DetailDrawer open={open} onClose={() => setOpen(false)} eyebrow="Company" title={company.name || "Company"}>
        <CompanyEditForm company={company} onSaved={() => router.refresh()} />
        <div style={{ marginTop: 16 }}>
          <Link href={`/admin/revenue/companies/${company.id}`} className="admin-btn admin-btn--sm">
            Open full page →
          </Link>
        </div>
      </DetailDrawer>
    </>
  );
}
