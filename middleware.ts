import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Coarse edge gate for /admin/*: refreshes the Supabase session cookie and
// bounces unauthenticated requests to the login page. This is defense-in-depth
// and UX, NOT the security boundary — requireAdmin() in the admin layout and
// every server action does the authoritative session + allowlist check
// (middleware cannot gate server actions or RSC data fetches by itself).
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The login page and auth callback must stay reachable without a session.
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // If auth isn't configured, pass through so marketing/preview builds still work.
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    // Touching getUser() refreshes the session cookie when needed.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = `?redirect=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch {
    // Auth backend unreachable or misconfigured: fail safe to the login page
    // rather than 500-ing all of /admin. requireAdmin() still gates every
    // server action and RSC data fetch, so this never weakens the boundary.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
