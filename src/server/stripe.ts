import Stripe from "stripe";

let stripe: Stripe | null = null;

/** Builds a Stripe client only when a secret key is configured. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not defined");
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}
