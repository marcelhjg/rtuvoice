import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Pages anyone can open without logging in. Everything else requires a login.
// Replace these with your real URLs (route groups like (student) are NOT part of the URL).
// Nested pages count too: "/register" also covers "/register/verify",
// and "/forgot-password" covers "/forgot-password/verify" and ".../new-password".
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  // `let` + created in THIS function, so when setAll replaces it,
  // the version we return at the end is the updated one.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validates the session and refreshes the token if it expired.
  // Keep nothing between createServerClient and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`))
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";

    const redirectResponse = NextResponse.redirect(url);
    // keep any cookie changes Supabase made (e.g. clearing an invalid session)
    supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip static files, image optimization and common image types
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};