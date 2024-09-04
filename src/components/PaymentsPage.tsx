"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import { useEffect } from "react";

export default function PaymentsPage() {
  const uid = useAuthStore((state) => state.uid);
  const { payments, paymentsLoading, paymentsError, fetchPayments } =
    usePaymentsStore();

  useEffect(() => {
    if (uid) {
      fetchPayments();
    }
  }, [uid, fetchPayments]);

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-4">
      <div className="text-3xl font-bold">Payments</div>

      {paymentsLoading && <div>Loading payments...</div>}
      {paymentsError && <div>Error: {paymentsError}</div>}
      {!paymentsLoading && !paymentsError && (
        <div className="flex flex-col gap-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border p-4 rounded-md bg-white shadow-md"
            >
              <div>ID: {payment.id}</div>
              <div>Amount: ${payment.amount / 100}</div>
              <div>
                Created At:{" "}
                {payment.createdAt
                  ? payment.createdAt.toDate().toLocaleString()
                  : "N/A"}
              </div>
              <div>Status: {payment.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
