"use server";

import { cookies } from "next/headers";
import { migrateLegacyUserIfNeeded } from "@/server/migrate-legacy-user";
import {
  FIREBASE_ID_TOKEN_COOKIE,
  verifyFirebaseIdToken,
} from "@/server/verify-id-token";

const COOKIE_MAX_AGE_SECONDS = 55 * 60;

export async function establishAuthSession(idToken: string): Promise<{ uid: string }> {
  if (typeof idToken !== "string" || idToken.length === 0 || idToken.length > 8192) {
    throw new Error("Unauthorized");
  }
  const user = await verifyFirebaseIdToken(idToken);
  const jar = await cookies();
  jar.set(FIREBASE_ID_TOKEN_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  try {
    await migrateLegacyUserIfNeeded(user);
  } catch (error) {
    console.error(
      "Legacy user copy failed:",
      error instanceof Error ? error.message : "unknown error"
    );
  }
  return { uid: user.uid };
}

export async function clearAuthSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(FIREBASE_ID_TOKEN_COOKIE);
}
