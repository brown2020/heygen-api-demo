import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantCreditPackForPaymentIntent } from "@/server/billing";
import { getStripe } from "@/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const result = await grantCreditPackForPaymentIntent(paymentIntent);
    if (result.status === "ignored") {
      console.error("Ignored Stripe payment", result.reason);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Stripe webhook grant failed",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json({ error: "Grant failed" }, { status: 500 });
  }
}
