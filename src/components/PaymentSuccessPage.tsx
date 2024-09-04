"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import useProfileStore from "@/zustand/useProfileStore";
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
    if (!payment_intent) {
      console.log("in useEffect no payment intent", payment_intent);
      setMessage("No payment intent found");
      setLoading(false);
      return;
    }

    const handlePaymentSuccess = async () => {
      try {
        const data = await validatePaymentIntent(payment_intent);
        console.log("Payment validation result:", data);

        if (data.status === "succeeded") {
          // Check if payment is already processed
          const existingPayment = await checkIfPaymentProcessed(data.id);
          if (existingPayment) {
            setMessage("Payment has already been processed.");

            // Convert Timestamp to milliseconds before setting state
            if (existingPayment.createdAt) {
              setCreated(existingPayment.createdAt.toMillis());
            } else {
              setCreated(0); // Fallback if createdAt is null
            }

            setId(existingPayment.id);
            setAmount(existingPayment.amount);
            setStatus(existingPayment.status);
            setLoading(false);
            return;
          }

          setMessage("Payment successful");
          setCreated(data.created * 1000); // Assuming `data.created` is a UNIX timestamp in seconds
          setId(data.id);
          setAmount(data.amount);
          setStatus(data.status);
          console.log("Payment successful:", data.amount);

          // Add payment to store
          await addPayment({
            id: data.id,
            amount: data.amount,
            status: data.status,
          });

          // Add credits to profile
          const creditsToAdd = data.amount + 1;
          await addCredits(creditsToAdd);
          console.log("Credits added to profile successfully");
        } else {
          console.error("Payment validation failed:", data.status);
          setMessage("Payment validation failed");
        }
      } catch (error) {
        console.error("Error handling payment success:", error);
        setMessage("Error handling payment success");
      } finally {
        setLoading(false);
      }
    };

    if (uid) handlePaymentSuccess();
  }, [payment_intent, addPayment, checkIfPaymentProcessed, addCredits, uid]);

  return (
    <main className="max-w-6xl flex flex-col gap-2.5 mx-auto p-10 text-black text-center border m-10 rounded-md border-black">
      {loading ? (
        <div>validating...</div>
      ) : id ? (
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
          <h2 className="text-2xl">You successfully purchased credits</h2>
          <div className="bg-white p-2 rounded-md my-5 text-4xl font-bold mx-auto">
            ${amount / 100}
          </div>
          <div>Uid: {uid}</div>
          <div>Id: {id}</div>
          <div>Created: {new Date(created).toLocaleString()}</div>
          <div>Status: {status}</div>
        </div>
      ) : (
        <div>{message}</div>
      )}

      <Link
        href="/profile"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:opacity-50"
      >
        View Account
      </Link>
    </main>
  );
}
