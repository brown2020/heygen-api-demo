"use server";

import {
  CREDIT_PACK_PRICE_CENTS,
  CREDIT_PACK_PURPOSE,
  assessCreditPackPayment,
} from "@/libs/billing";
import { requireUser } from "@/server/verify-id-token";
import { grantCreditPack } from "@/server/billing";
import { getStripe } from "@/server/stripe";

const PAYMENT_INTENT_ID = /^pi_[A-Za-z0-9]+$/;

export async function createPaymentIntent(): Promise<string> {
  const { uid: userId } = await requireUser();
  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;
  if (!product) throw new Error("Stripe product name is not defined");

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: CREDIT_PACK_PRICE_CENTS,
    currency: "usd",
    metadata: {
      product,
      userId,
      purpose: CREDIT_PACK_PURPOSE,
    },
    description: `Payment for product ${product}`,
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent");
  }
  return paymentIntent.client_secret;
}

export async function finalizePayment(paymentIntentId: string): Promise<{
  id: string;
  amount: number;
  created: number;
  status: string;
  creditsGranted: number;
  alreadyProcessed: boolean;
}> {
  const { uid: userId } = await requireUser();
  if (!PAYMENT_INTENT_ID.test(paymentIntentId)) {
    throw new Error("Invalid payment intent");
  }

  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  const assessment = assessCreditPackPayment({
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    metadataUserId: paymentIntent.metadata?.userId,
    metadataPurpose: paymentIntent.metadata?.purpose,
    callerUserId: userId,
  });
  if (!assessment.ok) {
    throw new Error(assessment.reason);
  }

  const granted = await grantCreditPack(userId, {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    created: paymentIntent.created,
    status: paymentIntent.status,
    currency: paymentIntent.currency,
  });

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    created: paymentIntent.created,
    status: paymentIntent.status,
    creditsGranted: granted.creditsGranted,
    alreadyProcessed: granted.alreadyProcessed,
  };
}
