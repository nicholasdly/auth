import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Since we can't extend set cookies inside server components due to a
  // limitation with React, we continuously extend the cookie expiration inside
  // middleware. However, we can't detect if a new cookie was set inside a
  // server action or route handler from middleware. As such, we'll only extend
  // the cookie expiration on GET requests.
  if (request.method === "GET") {
    const response = NextResponse.next();
    const token = request.cookies.get("session")?.value ?? null;

    if (token !== null) {
      response.cookies.set("session", token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  }

  // CSRF protection is a must when using cookies. While Next.js provides
  // built-in CSRF protection for server actions, regular route handlers are
  // not protected. As such, we implement CSRF protection globally via
  // middleware as a precaution.

  const originHeader = request.headers.get("Origin");
  const hostHeader = request.headers.get("Host");
  const forwardedHostHeader = request.headers.get("X-Forwarded-Host");

  if (
    originHeader === null ||
    hostHeader === null ||
    forwardedHostHeader === null
  ) {
    return new NextResponse(null, {
      status: 403,
    });
  }

  let origin: URL;

  try {
    origin = new URL(originHeader);
  } catch {
    return new NextResponse(null, { status: 403 });
  }

  return origin.host !== hostHeader && origin.host !== forwardedHostHeader
    ? new NextResponse(null, { status: 403 })
    : NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
