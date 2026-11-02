import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/stripe/webhook/route";

const saved = {
  secret: process.env.STRIPE_WEBHOOK_SECRET,
  key: process.env.STRIPE_SECRET_KEY,
};

afterEach(() => {
  if (saved.secret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = saved.secret;
  if (saved.key === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = saved.key;
});

describe("POST /api/stripe/webhook", () => {
  it("returns 503 when the webhook is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe webhook is not configured",
    });
  });

  it("returns 400 when the signature header is missing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing signature" });
  });
});
