import { creditsForPaymentAmountCents } from "@/libs/heygen-response";

/** Display price for the fixed credit pack. Server charges CREDIT_PACK_PRICE_CENTS. */
export const CREDIT_PACK_PRICE_USD = 99.99;

/** $99.99 in cents. 99.99 * 100 is 9999 in IEEE math; do not recompute from the float. */
export const CREDIT_PACK_PRICE_CENTS = 9999;

export const CREDIT_PACK_PURPOSE = "credit_pack";

/** One-time balance applied only when a profile document is first created. */
export const STARTER_CREDITS = 1000;

/** Debited on the server when HeyGen accepts a generation. */
export const VIDEO_GENERATION_CREDIT_COST = 1;

const FIRESTORE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export type PaymentAssessment =
  | { ok: true; userId: string; credits: number }
  | { ok: false; reason: string };

export function assessCreditPackPayment(input: {
  amount: number;
  currency: string;
  status: string;
  metadataUserId?: string | null;
  metadataPurpose?: string | null;
  /** When set, the signed-in caller must be the PaymentIntent owner. */
  callerUserId?: string | null;
}): PaymentAssessment {
  if (input.status !== "succeeded") {
    return { ok: false, reason: "Payment was not successful" };
  }
  if (input.currency.toLowerCase() !== "usd") {
    return { ok: false, reason: "Unexpected currency" };
  }
  if (input.amount !== CREDIT_PACK_PRICE_CENTS) {
    return { ok: false, reason: "Unexpected payment amount" };
  }
  if (input.metadataPurpose !== CREDIT_PACK_PURPOSE) {
    return { ok: false, reason: "Unexpected payment purpose" };
  }
  const userId = input.metadataUserId ?? "";
  if (!FIRESTORE_ID.test(userId)) {
    return { ok: false, reason: "Payment is missing a valid user" };
  }
  if (input.callerUserId != null && input.callerUserId !== userId) {
    return { ok: false, reason: "Payment does not belong to this user" };
  }
  return {
    ok: true,
    userId,
    credits: creditsForPaymentAmountCents(input.amount),
  };
}

/** Preserve a stored balance, including 0 and values under 100. */
export function normalizeStoredCredits(credits: unknown): number {
  return typeof credits === "number" && Number.isFinite(credits) ? credits : 0;
}

/** Returns the next balance, or null when the debit cannot be covered. */
export function applyCreditDebit(current: number, cost: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(cost) || cost <= 0) return null;
  if (current < cost) return null;
  return current - cost;
}
