import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decideProxyAccess } from "@/libs/auth-constants";
import { isClerkConfigured } from "@/libs/clerk-config";

const isProtectedRoute = createRouteMatcher([
  "/avatars(.*)",
  "/generate(.*)",
  "/payment-attempt(.*)",
  "/payment-success(.*)",
  "/profile(.*)",
]);

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export default function proxy(req: NextRequest, event: unknown) {
  const decision = decideProxyAccess({
    clerkConfigured: isClerkConfigured,
    isProduction: process.env.NODE_ENV === "production",
    pathname: req.nextUrl.pathname,
  });
  if (decision === "deny") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (decision === "allow") {
    return NextResponse.next();
  }
  return (clerkProxy as (req: NextRequest, event: unknown) => unknown)(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
