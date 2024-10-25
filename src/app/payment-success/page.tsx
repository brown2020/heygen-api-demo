"use client";

import PaymentSuccessPage from "@/components/PaymentSuccessPage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent") || "";

  console.log("searchParams in calling page", searchParams);
  console.log("payment_intent in calling page", paymentIntent);

  return <PaymentSuccessPage payment_intent={paymentIntent} />;
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
