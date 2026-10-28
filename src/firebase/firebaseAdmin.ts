import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
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

let adminBucket: Bucket;
let adminDb: Firestore;
let adminAuth: Auth;

try {
  if (!getApps().length) {
    initializeApp({
      credential: cert(adminCredentials as ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
    });
  }
  adminBucket = getStorage().bucket();
  adminDb = getFirestore();
  adminAuth = getAuth();
} catch (e) {
  console.warn("Firebase Admin initialization failed (expected in build):", e);
  adminBucket = {} as Bucket;
  adminDb = {} as Firestore;
  adminAuth = {} as Auth;
}

export { adminBucket, adminDb, adminAuth };
