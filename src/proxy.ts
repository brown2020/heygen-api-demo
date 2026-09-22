import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
  if (!isClerkConfigured) {
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
