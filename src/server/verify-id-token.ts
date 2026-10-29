import { cookies } from "next/headers";
import { getAdminServices } from "@/firebase/firebaseAdmin";

/** httpOnly cookie holding the Firebase ID token for server actions. */
export const FIREBASE_ID_TOKEN_COOKIE = "firebase-id-token";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedFirebaseUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  if (!idToken) throw new UnauthorizedError();
  const { auth } = getAdminServices();
  let decoded: { uid?: string; email?: string; email_verified?: boolean };
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch {
    throw new UnauthorizedError();
  }
  if (!decoded.uid) throw new UnauthorizedError();
  return {
    uid: decoded.uid,
    email: typeof decoded.email === "string" ? decoded.email : null,
    emailVerified: decoded.email_verified === true,
  };
}

export async function requireUser(): Promise<VerifiedFirebaseUser> {
  const jar = await cookies();
  const token = jar.get(FIREBASE_ID_TOKEN_COOKIE)?.value;
  if (!token) throw new UnauthorizedError();
  return verifyFirebaseIdToken(token);
}
