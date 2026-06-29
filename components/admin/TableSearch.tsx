"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mergeQuery, firstParam, type SearchParamsObj } from "@/lib/admin/url";

// The only interactive island in DataTable: pushes ?q=… (resetting page) on
// submit, preserving all other params. DataTable itself stays a server
// component so column cell renderers never cross the client boundary.
export function TableSearch({
  basePath,
  searchParams,
  placeholder = "Search…",
  paramName = "q",
}: {
  basePath: string;
  searchParams: SearchParamsObj;
  placeholder?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(firstParam(searchParams[paramName]) ?? "");

  function go(next: string | null) {
    router.push(basePath + mergeQuery(searchParams, { [paramName]: next, page: 1 }));
  }

  return (
    <form
      className="admin-search"
      onSubmit={(e) => {
        e.preventDefault();
        go(value.trim() || null);
      }}
    >
      <span aria-hidden>⌕</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            go(null);
          }}
          style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--admin-muted)" }}
        >
          ✕
        </button>
      )}
    </form>
  );
}
