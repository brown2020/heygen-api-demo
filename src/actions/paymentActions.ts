// paymentActions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

let stripe: Stripe | null = null;

function getStripe() {
  if (stripe) return stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not defined");
  stripe = new Stripe(secretKey);
  return stripe;
}

export async function createPaymentIntent(amount: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;

  try {
    if (!product) throw new Error("Stripe product name is not defined");

    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { product },
      description: `Payment for product ${process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME}`,
    });

    return paymentIntent.client_secret;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error("Failed to create payment intent");
  }
}

export async function validatePaymentIntent(paymentIntentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  try {
    const paymentIntent =
      await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Convert the Stripe object to a plain object
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        created: paymentIntent.created,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
        currency: paymentIntent.currency,
        description: paymentIntent.description,
      };
    } else {
      throw new Error("Payment was not successful");
    }
  } catch (error) {
    console.error("Error validating payment intent:", error);
    throw new Error("Failed to validate payment intent");
  }
}
