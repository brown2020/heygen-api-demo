"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import useProfileStore from "@/zustand/useProfileStore";
import { creditsForPaymentAmountCents } from "@/libs/heygen-response";
import { formatUtcDateTime } from "@/libs/format";
import Link from "next/link";
import { useEffect, useState } from "react";
import { validatePaymentIntent } from "@/actions/paymentActions";

type Props = {
  payment_intent: string;
};

export default function PaymentSuccessPage({ payment_intent }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [created, setCreated] = useState(0);
  const [id, setId] = useState("");
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState("");

  const addPayment = usePaymentsStore((state) => state.addPayment);
  const checkIfPaymentProcessed = usePaymentsStore(
    (state) => state.checkIfPaymentProcessed
  );
  const addCredits = useProfileStore((state) => state.addCredits);

  const uid = useAuthStore((state) => state.uid);

  useEffect(() => {
    let cancelled = false;

    if (!payment_intent) {
      queueMicrotask(() => {
        if (!cancelled) {
          setMessage("No payment intent found");
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (!uid) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const data = await validatePaymentIntent(payment_intent);
        if (cancelled) return;

        if (data.status === "succeeded") {
          const existingPayment = await checkIfPaymentProcessed(data.id);
          if (cancelled) return;

          if (existingPayment) {
            queueMicrotask(() => {
              if (cancelled) return;
              setMessage("Payment has already been processed.");
              setCreated(existingPayment.createdAt?.toMillis?.() ?? 0);
              setId(existingPayment.id);
              setAmount(existingPayment.amount);
              setStatus(existingPayment.status);
              setLoading(false);
            });
            return;
          }

          queueMicrotask(() => {
            if (cancelled) return;
            setMessage("Payment successful");
            setCreated(data.created * 1000);
            setId(data.id);
            setAmount(data.amount);
            setStatus(data.status);
          });

          await addPayment({
            id: data.id,
            amount: data.amount,
            status: data.status,
          });
          if (cancelled) return;

          await addCredits(creditsForPaymentAmountCents(data.amount));
        } else {
          console.error("Payment validation failed:", data.status);
          if (!cancelled) {
            queueMicrotask(() => setMessage("Payment validation failed"));
          }
        }
      } catch (error) {
        console.error("Error handling payment success:", error);
        if (!cancelled) {
          queueMicrotask(() => setMessage("Error handling payment success"));
        }
      } finally {
        if (!cancelled) {
          queueMicrotask(() => setLoading(false));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payment_intent, addPayment, checkIfPaymentProcessed, addCredits, uid]);

  return (
    <main className="max-w-6xl flex flex-col gap-2.5 mx-auto p-10 text-black text-center border m-10 rounded-md border-black">
      {loading ? (
        <div role="status">validating...</div>
      ) : id ? (
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
          <h2 className="text-2xl">You successfully purchased credits</h2>
          <div className="bg-white p-2 rounded-md my-5 text-4xl font-bold mx-auto">
            ${amount / 100}
          </div>
          <div>Uid: {uid}</div>
          <div>Id: {id}</div>
          <div>Created: {formatUtcDateTime(created)}</div>
          <div>Status: {status}</div>
          {message && <div className="sr-only">{message}</div>}
        </div>
      ) : (
        <div role="alert">{message}</div>
      )}

      <Link
        href="/profile"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        View Account
      </Link>
    </main>
  );
}
