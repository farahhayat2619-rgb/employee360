import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounces visitors with no session cookie before any page renders.
// The real check (valid, unexpired session and the right role) runs on the server in src/lib/auth.ts.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("e360_session")) {
    const url = new URL("/", request.url);
    url.searchParams.set("signin", "required");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/employee/:path*", "/management/:path*", "/admin/:path*"],
};
