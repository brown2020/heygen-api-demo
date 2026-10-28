"use client";

import { finalizePayment } from "@/actions/paymentActions";
import { formatUtcDateTime } from "@/libs/format";
import { useAuthStore } from "@/zustand/useAuthStore";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const uid = useAuthStore((state) => state.uid);
  const authError = useAuthStore((state) => state.authError);

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

    (async () => {
      try {
        const data = await finalizePayment(payment_intent);
        if (cancelled) return;
        queueMicrotask(() => {
          if (cancelled) return;
          setMessage(
            data.alreadyProcessed
              ? "Payment has already been processed."
              : "Payment successful"
          );
          setCreated(data.created * 1000);
          setId(data.id);
          setAmount(data.amount);
          setStatus(data.status);
          setLoading(false);
        });
      } catch (error) {
        console.error(
          "Error handling payment success:",
          error instanceof Error ? error.message : "unknown"
        );
        if (!cancelled) {
          queueMicrotask(() => {
            setMessage(
              error instanceof Error ? error.message : "Error handling payment success"
            );
            setLoading(false);
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payment_intent]);

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
          {uid && <div>Uid: {uid}</div>}
          <div>Id: {id}</div>
          <div>Created: {formatUtcDateTime(created)}</div>
          <div>Status: {status}</div>
          {message && <div className="sr-only">{message}</div>}
          {authError && (
            <p className="text-amber-800 mt-4" role="status">
              {authError}
            </p>
          )}
        </div>
      ) : (
        <div role="alert">{message}</div>
      )}

      <Link
        href="/profile"
        className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
      >
        View Account
      </Link>
    </main>
  );
}
