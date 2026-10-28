import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import type { Bucket } from "@google-cloud/storage";

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const adminCredentials = {
  type: process.env.FIREBASE_TYPE,
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: privateKey ? privateKey.replace(/\\n/g, "\n") : undefined,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: process.env.FIREBASE_AUTH_URI,
  tokenUri: process.env.FIREBASE_TOKEN_URI,
  authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  clientCertsUrl: process.env.FIREBASE_CLIENT_CERTS_URL,
};

let adminBucket: Bucket | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;
let adminInitAttempted = false;
let adminInitError: Error | null = null;

function initAdmin(): void {
  if (adminInitAttempted) return;
  adminInitAttempted = true;
  const projectId = adminCredentials.projectId;
  const clientEmail = adminCredentials.clientEmail;
  const privateKey = adminCredentials.privateKey;
  if (!projectId || !clientEmail || !privateKey) {
    adminInitError = new Error("Firebase Admin is not configured");
    return;
  }
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
      });
    }
    adminBucket = getStorage().bucket();
    adminDb = getFirestore();
    adminAuth = getAuth();
  } catch (e) {
    adminInitError = e instanceof Error ? e : new Error("Firebase Admin initialization failed");
    console.warn("Firebase Admin initialization failed (expected in build):", adminInitError.message);
  }
}

export function getAdminServices(): { bucket: Bucket; db: Firestore; auth: Auth } {
  initAdmin();
  if (!adminBucket || !adminDb || !adminAuth) {
    throw adminInitError ?? new Error("Firebase Admin is not configured");
  }
  return { bucket: adminBucket, db: adminDb, auth: adminAuth };
}
