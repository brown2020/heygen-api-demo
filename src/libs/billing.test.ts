import { describe, expect, it } from "vitest";

import {
  CREDIT_PACK_PRICE_CENTS,
  CREDIT_PACK_PURPOSE,
  STARTER_CREDITS,
  assessCreditPackPayment,
  applyCreditDebit,
  normalizeStoredCredits,
} from "@/libs/billing";
import { paymentRecordId } from "@/libs/payments";
import { creditsForPaymentAmountCents } from "@/libs/heygen-response";

const valid = {
  amount: CREDIT_PACK_PRICE_CENTS,
  currency: "usd",
  status: "succeeded",
  metadataUserId: "user_abc",
  metadataPurpose: CREDIT_PACK_PURPOSE,
};

describe("assessCreditPackPayment", () => {
  it("matches the one-time starter balance allowed by Firestore rules", () => {
    expect(STARTER_CREDITS).toBe(1000);
  });

  it("accepts the fixed pack for its owner", () => {
    const result = assessCreditPackPayment({ ...valid, callerUserId: "user_abc" });
    expect(result).toEqual({
      ok: true,
      userId: "user_abc",
      credits: creditsForPaymentAmountCents(CREDIT_PACK_PRICE_CENTS),
    });
  });

  it("rejects another user's payment and a tampered amount", () => {
    expect(
      assessCreditPackPayment({ ...valid, callerUserId: "user_other" }).ok
    ).toBe(false);
    expect(assessCreditPackPayment({ ...valid, amount: 50 }).ok).toBe(false);
    expect(assessCreditPackPayment({ ...valid, status: "requires_payment_method" }).ok).toBe(
      false
    );
    expect(assessCreditPackPayment({ ...valid, metadataUserId: "../admin" }).ok).toBe(false);
  });
});

describe("credit balance helpers", () => {
  it("does not refill balances under 100", () => {
    expect(normalizeStoredCredits(0)).toBe(0);
    expect(normalizeStoredCredits(50)).toBe(50);
    expect(normalizeStoredCredits(1000)).toBe(1000);
    expect(normalizeStoredCredits(undefined)).toBe(0);
  });

  it("debits only when the balance covers the cost", () => {
    expect(applyCreditDebit(10, 1)).toBe(9);
    expect(applyCreditDebit(0, 1)).toBeNull();
  });
});

describe("paymentRecordId", () => {
  it("shows the Stripe id stored on the payment document", () => {
    expect(paymentRecordId("pi_123", "autoDocId")).toBe("pi_123");
    expect(paymentRecordId("", "autoDocId")).toBe("autoDocId");
  });
});
