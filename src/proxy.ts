import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decideProxyAccess } from "@/libs/route-guard";
import {
  FIREBASE_ID_TOKEN_COOKIE,
  verifyFirebaseIdToken,
} from "@/server/verify-id-token";

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get(FIREBASE_ID_TOKEN_COOKIE)?.value;
  let hasSession = false;
  if (token) {
    try {
      const user = await verifyFirebaseIdToken(token);
      hasSession = Boolean(user.uid);
    } catch {
      hasSession = false;
    }
  }
  const decision = decideProxyAccess({
    hasSession,
    isProduction: process.env.NODE_ENV === "production",
    pathname: req.nextUrl.pathname,
  });
  if (decision === "deny") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
