"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import { useEffect, useState } from "react";
import { formatUtcDateTime } from "@/libs/format";

export default function PaymentsPage() {
  const uid = useAuthStore((state) => state.uid);
  const { payments, paymentsLoading, paymentsError, fetchPayments } =
    usePaymentsStore();
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    if (uid) {
      fetchPayments();
    }
  }, [uid, fetchPayments]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const payment of payments) {
      next[payment.id] = formatUtcDateTime(
        payment.createdAt ? payment.createdAt.toMillis() : null
      );
    }
    queueMicrotask(() => setFormattedDates(next));
  }, [payments]);

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-4">
      <h1 className="text-3xl font-bold">Payments</h1>

      {paymentsLoading && <div role="status">Loading payments...</div>}
      {paymentsError && (
        <div role="alert">Error: {paymentsError}</div>
      )}
      {!paymentsLoading && !paymentsError && payments.length === 0 && (
        <p className="text-gray-500">No payments yet.</p>
      )}
      {!paymentsLoading && !paymentsError && payments.length > 0 && (
        <div className="flex flex-col gap-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border p-4 rounded-md bg-white shadow-md"
            >
              <div>ID: {payment.id}</div>
              <div>Amount: ${payment.amount / 100}</div>
              <div>
                Created At: {formattedDates[payment.id] ?? "…"}
              </div>
              <div>Status: {payment.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
