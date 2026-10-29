import type { CollectionReference, DocumentReference, Firestore } from "firebase-admin/firestore";
import { getAdminServices } from "@/firebase/firebaseAdmin";
import { selectLegacySource, type LegacyCandidate } from "@/libs/legacy-user";
import type { VerifiedFirebaseUser } from "@/server/verify-id-token";

function asEmail(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

async function copyDocument(
  source: DocumentReference,
  destination: DocumentReference,
  rootRewrite?: Record<string, unknown>
): Promise<void> {
  const snap = await source.get();
  const collections = await source.listCollections();
  for (const collection of collections) {
    await copyCollection(collection, destination.collection(collection.id));
  }
  if (snap.exists) {
    const data = snap.data() ?? {};
    await destination.set(rootRewrite ? { ...data, ...rootRewrite } : data);
    return;
  }
  if (rootRewrite) {
    await destination.set(rootRewrite);
  }
}

async function copyCollection(
  source: CollectionReference,
  destination: CollectionReference
): Promise<void> {
  const children = await source.listDocuments();
  for (const child of children) {
    await copyDocument(child, destination.doc(child.id));
  }
}

async function loadCandidates(
  db: Firestore,
  email: string,
  firebaseUid: string
): Promise<LegacyCandidate[]> {
  const byId = new Map<string, LegacyCandidate>();

  const remember = (id: string, patch: Partial<LegacyCandidate>) => {
    if (!id || id === firebaseUid) return;
    const current = byId.get(id) ?? {
      id,
      email: null,
      authEmail: null,
      profileEmail: null,
    };
    byId.set(id, { ...current, ...patch, id });
  };

  const [byAuthEmail, byEmail] = await Promise.all([
    db.collection("users").where("authEmail", "==", email).get(),
    db.collection("users").where("email", "==", email).get(),
  ]);

  for (const doc of byAuthEmail.docs) {
    remember(doc.id, {
      authEmail: asEmail(doc.get("authEmail")),
      email: asEmail(doc.get("email")),
    });
  }
  for (const doc of byEmail.docs) {
    remember(doc.id, {
      authEmail: asEmail(doc.get("authEmail")),
      email: asEmail(doc.get("email")),
    });
  }

  try {
    const profiles = await db.collectionGroup("profile").where("email", "==", email).get();
    for (const doc of profiles.docs) {
      const userRef = doc.ref.parent.parent;
      if (!userRef || userRef.parent.id !== "users") continue;
      const root = await userRef.get();
      remember(userRef.id, {
        authEmail: asEmail(root.get("authEmail")),
        email: asEmail(root.get("email")),
        profileEmail: asEmail(doc.get("email")),
      });
    }
  } catch (error) {
    console.warn(
      "Legacy profile email lookup skipped:",
      error instanceof Error ? error.message : "unknown error"
    );
  }

  return [...byId.values()];
}

/**
 * Copy a Clerk-era `users/{id}` tree onto `users/{firebaseUid}` when the
 * verified email matches exactly one legacy document. Source documents stay.
 */
export async function migrateLegacyUserIfNeeded(
  user: VerifiedFirebaseUser
): Promise<{ copied: boolean; reason: string }> {
  const { db } = getAdminServices();
  const destRef = db.collection("users").doc(user.uid);
  const destSnap = await destRef.get();
  const candidates =
    user.emailVerified && user.email && !destSnap.exists
      ? await loadCandidates(db, user.email, user.uid)
      : [];
  const decision = selectLegacySource({
    firebaseUid: user.uid,
    verifiedEmail: user.email,
    emailVerified: user.emailVerified,
    destinationExists: destSnap.exists,
    candidates,
  });
  if (decision.action !== "copy") {
    return { copied: false, reason: decision.reason };
  }

  const sourceRef = db.collection("users").doc(decision.sourceId);
  await copyDocument(sourceRef, destRef, {
    uid: user.uid,
    firebaseUid: user.uid,
    legacySourceId: decision.sourceId,
  });
  return { copied: true, reason: "copied" };
}
