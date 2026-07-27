import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/auth/callback"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Refreshes the session cookie if it's expired — must be called before
  // any route logic runs, and the result must not be discarded (per
  // @supabase/ssr's Next.js middleware guidance).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (user && request.nextUrl.pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/applications", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all page request paths except API routes (each API route checks
     * auth itself and returns 401 JSON — a redirect response would break
     * fetch() callers expecting JSON), static assets, and Next.js internals.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
