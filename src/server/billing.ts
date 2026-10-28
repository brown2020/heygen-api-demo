import type Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import {
  CREDIT_PACK_PURPOSE,
  VIDEO_GENERATION_CREDIT_COST,
  applyCreditDebit,
  assessCreditPackPayment,
  normalizeStoredCredits,
} from "@/libs/billing";
import { getAdminServices } from "@/firebase/firebaseAdmin";

type PaymentRecord = {
  id: string;
  amount: number;
  created: number;
  status: string;
  currency: string;
};

function readCredits(value: unknown): number {
  return normalizeStoredCredits(value);
}

export async function grantCreditPack(
  userId: string,
  payment: PaymentRecord
): Promise<{ creditsGranted: number; alreadyProcessed: boolean; balance: number }> {
  const { db } = getAdminServices();
  const payRef = db.collection("users").doc(userId).collection("payments").doc(payment.id);
  const profileRef = db.collection("users").doc(userId).collection("profile").doc("userData");
  const assessment = assessCreditPackPayment({
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    metadataUserId: userId,
    metadataPurpose: CREDIT_PACK_PURPOSE,
  });
  if (!assessment.ok) {
    throw new Error(assessment.reason);
  }

  return db.runTransaction(async (tx) => {
    const paySnap = await tx.get(payRef);
    const profileSnap = await tx.get(profileRef);
    const current = readCredits(profileSnap.get("credits"));
    if (paySnap.exists && paySnap.get("status") === "succeeded") {
      return { creditsGranted: 0, alreadyProcessed: true, balance: current };
    }
    const balance = current + assessment.credits;
    tx.set(payRef, {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: new Date(payment.created * 1000),
      status: "succeeded",
    });
    tx.set(profileRef, { credits: balance }, { merge: true });
    return { creditsGranted: assessment.credits, alreadyProcessed: false, balance };
  });
}

export async function grantCreditPackForPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ status: "ignored"; reason: string } | { status: "ok"; alreadyProcessed: boolean }> {
  const assessment = assessCreditPackPayment({
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    metadataUserId: paymentIntent.metadata?.userId,
    metadataPurpose: paymentIntent.metadata?.purpose,
  });
  if (!assessment.ok) {
    return { status: "ignored", reason: assessment.reason };
  }
  const granted = await grantCreditPack(assessment.userId, {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    created: paymentIntent.created,
    status: paymentIntent.status,
    currency: paymentIntent.currency,
  });
  return { status: "ok", alreadyProcessed: granted.alreadyProcessed };
}

export async function debitGenerationCredit(userId: string): Promise<number> {
  const { db } = getAdminServices();
  const profileRef = db.collection("users").doc(userId).collection("profile").doc("userData");
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(profileRef);
    const current = readCredits(snap.get("credits"));
    const next = applyCreditDebit(current, VIDEO_GENERATION_CREDIT_COST);
    if (next == null) {
      throw new Error("Not enough credits");
    }
    tx.set(profileRef, { credits: next }, { merge: true });
    return next;
  });
}

export async function refundGenerationCredit(userId: string): Promise<void> {
  const { db } = getAdminServices();
  const profileRef = db.collection("users").doc(userId).collection("profile").doc("userData");
  await profileRef.set(
    { credits: FieldValue.increment(VIDEO_GENERATION_CREDIT_COST) },
    { merge: true }
  );
}
