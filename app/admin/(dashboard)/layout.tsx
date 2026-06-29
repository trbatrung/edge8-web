import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { listBrands, getActiveBrandId } from "@/lib/admin/brand";
import "../admin.css";

export const metadata: Metadata = {
  title: "Edge8 OS",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const brands = await listBrands();
  const activeBrandId = getActiveBrandId();

  return (
    <div className="admin-shell">
      <AdminSidebar user={user} brands={brands} activeBrandId={activeBrandId} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
