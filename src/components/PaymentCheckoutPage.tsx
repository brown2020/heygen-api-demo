"use client";

import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";

import { useEffect, useState } from "react";
import { createPaymentIntent } from "@/actions/paymentActions";
import convertToSubcurrency from "@/utils/convertToSubcurrency";
import { ClipLoader } from "react-spinners";

type Props = { amount: number };

export default function PaymentCheckoutPage({ amount }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function initializePayment() {
      try {
        const secret = await createPaymentIntent(convertToSubcurrency(amount));
        if (secret) setClientSecret(secret);
      } catch (error) {
        setErrorMessage("Failed to initialize payment. Please try again.");
      }
    }

    initializePayment();
  }, [amount]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      // Confirm the Payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "Payment failed");
        setLoading(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?amount=${amount}`,
        },
      });

      if (error) {
        // This point is only reached if there's an immediate error when
        // confirming the payment. Show the error to the user
        // For example, the card was declined
        setErrorMessage(error.message || "Payment failed");
        console.log("Payment failed:", error.message);
      } else {
        console.log("Payment successful!!!!!!!!!");
        // The payment UI automatically closes with a success animation
        // User is redirected to the return_url
      }
    } catch (error) {
      setErrorMessage("Payment validation failed. Please try again.");
      console.error("Payment validation error:", error);
    }

    setLoading(false);
  };

  if (!clientSecret || !stripe || !elements) {
    return (
      <div className="flex items-center justify-center max-w-6xl h-36 mx-auto w-full">
        <ClipLoader color="#4A90E2" size={36} />
      </div>
    );
  }

  return (
    <main className="flex flex-col w-full items-center max-w-6xl mx-auto py-10">
      <div className="mb-10">
        <h1 className="text-4xl">Buy 10,000 Credits</h1>
        <h2 className="text-2xl">
          Purchase amount: <span className="font-bold">${amount}</span>
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-2 rounded-md w-full">
        {clientSecret && <PaymentElement />}

        {errorMessage && <p className="text-red-500">{errorMessage}</p>}

        <button
          disabled={!stripe || loading}
          className="text-white w-full p-5 bg-black mt-2 rounded-md font-bold disabled:opacity-50 disabled:animate-pulse"
        >
          {!loading ? `Pay $${amount}` : "Processing..."}
        </button>
      </form>
    </main>
  );
}
