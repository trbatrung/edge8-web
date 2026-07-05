"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/admin/(dashboard)/actions";

// Nav is data-driven. `enabled: false` items render muted with a "soon" tag and
// are not navigable — flip them to `true` (and build the route) as each phase
// ships, so the shell always looks complete without dead 404 links.
type NavItem = { label: string; href: string; ico: string; enabled?: boolean };
type NavSubsection = { subheading: string; items: NavItem[] };
type NavEntry = NavItem | NavSubsection;
type NavGroup = { label: string | null; items: NavEntry[]; collapsible?: boolean };

const isSubsection = (e: NavEntry): e is NavSubsection => "subheading" in e;

// Organized by the Four Offices of the Future (Revenue, Talent, Operations,
// Innovation) + a Dashboard home and a Settings/config area. The Revenue office
// leads with a nested CRM subsection (contact spine + pipeline lenses) above its
// commerce items. Rows open the one shared Contact 360.
// See docs/product/four-offices-of-the-future.md.
const NAV: NavGroup[] = [
  { label: null, items: [{ label: "Dashboard", href: "/admin", ico: "◈", enabled: true }] },
  {
    label: "Revenue",
    collapsible: true,
    items: [
      {
        subheading: "CRM",
        items: [
          { label: "Contacts", href: "/admin/contacts", ico: "⚇", enabled: true },
          { label: "Leads", href: "/admin/revenue/leads", ico: "◉", enabled: true },
          { label: "Companies", href: "/admin/revenue/companies", ico: "▣", enabled: true },
          { label: "Inquiries", href: "/admin/revenue/inquiries", ico: "☰", enabled: true },
          { label: "Deals", href: "/admin/revenue/deals", ico: "$", enabled: true },
          { label: "Funnel", href: "/admin/revenue/funnel", ico: "▽", enabled: true },
        ],
      },
      { label: "Products", href: "/admin/revenue/products", ico: "▦", enabled: true },
      { label: "Orders", href: "/admin/revenue/orders", ico: "⛁", enabled: true },
      { label: "Bookings", href: "/admin/revenue/bookings", ico: "⌂", enabled: true },
      { label: "Registrations", href: "/admin/revenue/registrations", ico: "✓", enabled: true },
      { label: "Affiliates", href: "/admin/revenue/affiliates", ico: "%", enabled: true },
    ],
  },
  {
    label: "Talent",
    collapsible: true,
    items: [
      { label: "Candidates", href: "/admin/talent/candidates", ico: "☺", enabled: true },
      { label: "Applications", href: "/admin/talent/applications", ico: "⇉", enabled: true },
      { label: "Job Reqs", href: "/admin/talent/jobs", ico: "▤", enabled: true },
      { label: "Team", href: "/admin/talent/team", ico: "☷", enabled: true },
    ],
  },
  {
    label: "Operations",
    collapsible: true,
    items: [
      { label: "Time Off", href: "/admin/operations/time-off", ico: "☼", enabled: true },
      { label: "Vendors", href: "/admin/operations/vendors", ico: "▥" },
      { label: "Documents", href: "/admin/operations/documents", ico: "⎙" },
      { label: "Surveys", href: "/admin/operations/surveys", ico: "✎" },
    ],
  },
  {
    label: "Innovation",
    collapsible: true,
    items: [{ label: "Idea backlog", href: "/admin/innovation/ideas", ico: "✦" }],
  },
  {
    label: "Settings",
    collapsible: true,
    items: [
      { label: "Brands", href: "/admin/settings/brands", ico: "✺" },
      { label: "Legal entities", href: "/admin/settings/legal-entities", ico: "§" },
      { label: "Pipelines", href: "/admin/settings/pipelines", ico: "⇶" },
    ],
  },
];

export type Brand = { id: string; name: string };

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  user,
  brands,
  activeBrandId,
}: {
  user: { email: string };
  brands: Brand[];
  activeBrandId: string | null;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setCollapsed((c) => ({ ...c, [label]: !c[label] }));
  }

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null;

  function selectBrand(id: string | null) {
    if (id) document.cookie = `crm_brand=${id}; path=/; max-age=31536000; samesite=lax`;
    else document.cookie = "crm_brand=; path=/; max-age=0; samesite=lax";
    setBrandMenuOpen(false);
    router.refresh();
  }

  function renderItem(item: NavItem, isSub: boolean) {
    const cls = `admin-nav-link${isActive(pathname, item.href) ? " is-active" : ""}${isSub ? " is-sub" : ""}`;
    if (item.enabled) {
      return (
        <Link key={item.href} href={item.href} className={cls}>
          <span className="admin-nav-ico" aria-hidden>
            {item.ico}
          </span>
          {item.label}
        </Link>
      );
    }
    return (
      <span
        key={item.href}
        className={cls}
        aria-disabled
        style={{ opacity: 0.4, cursor: "not-allowed" }}
        title="Coming in a later phase"
      >
        <span className="admin-nav-ico" aria-hidden>
          {item.ico}
        </span>
        {item.label}
        <span className="admin-nav-badge">soon</span>
      </span>
    );
  }

  return (
    <>
      <div className="admin-mobilebar">
        <button
          className="admin-mobile-toggle"
          aria-label="Open navigation"
          onClick={() => setNavOpen(true)}
        >
          ☰
        </button>
        <span className="admin-brand-mark">E8</span>
        <strong>Edge8 OS</strong>
      </div>

      {navOpen && <div className="admin-scrim" onClick={() => setNavOpen(false)} />}

      <nav className={`admin-sidebar${navOpen ? " is-open" : ""}`} aria-label="Admin">
        <div className="admin-brand">
          <span className="admin-brand-mark">E8</span>
          Edge8 OS
        </div>

        <button
          className="admin-brandbtn"
          onClick={() => setBrandMenuOpen((v) => !v)}
          aria-expanded={brandMenuOpen}
        >
          <span className="admin-brandbtn-label">
            <span className="admin-brandbtn-eyebrow">Brand</span>
            {activeBrand ? activeBrand.name : "All brands"}
          </span>
          <span aria-hidden>▾</span>
        </button>
        {brandMenuOpen && (
          <ul className="admin-brandmenu">
            <li>
              <button aria-current={!activeBrandId} onClick={() => selectBrand(null)}>
                All brands
              </button>
            </li>
            {brands.map((b) => (
              <li key={b.id}>
                <button aria-current={b.id === activeBrandId} onClick={() => selectBrand(b.id)}>
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="admin-nav" onClick={() => setNavOpen(false)}>
          {NAV.map((group, gi) => {
            const label = group.label;
            const isCollapsed = Boolean(label && group.collapsible && collapsed[label]);
            return (
            <div className="admin-nav-group" key={label ?? `g${gi}`}>
              {label && group.collapsible ? (
                <button
                  className="admin-nav-grouplabel admin-nav-grouptoggle"
                  aria-expanded={!isCollapsed}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(label);
                  }}
                >
                  {label}
                  <span className={`admin-nav-caret${isCollapsed ? " is-collapsed" : ""}`} aria-hidden>
                    ▾
                  </span>
                </button>
              ) : (
                label && <div className="admin-nav-grouplabel">{label}</div>
              )}
              {!isCollapsed &&
              group.items.map((entry) =>
                isSubsection(entry) ? (
                  <div key={`sub-${entry.subheading}`}>
                    <div className="admin-nav-subhead">{entry.subheading}</div>
                    {entry.items.map((item) => renderItem(item, true))}
                  </div>
                ) : (
                  renderItem(entry, false)
                ),
              )}
            </div>
            );
          })}
        </div>

        <div className="admin-foot">
          <span className="admin-foot-email">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="admin-signout">
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
