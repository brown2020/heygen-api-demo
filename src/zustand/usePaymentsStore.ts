import { create } from "zustand";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";
import { db, isFirebaseConfigured } from "@/firebase/firebaseClient";
import { paymentRecordId } from "@/libs/payments";

export type PaymentType = {
  id: string;
  amount: number;
  createdAt: Timestamp | null;
  status: string;
};

interface PaymentsStoreState {
  payments: PaymentType[];
  paymentsLoading: boolean;
  paymentsError: string | null;
  fetchPayments: () => Promise<void>;
}

export const usePaymentsStore = create<PaymentsStoreState>((set) => ({
  payments: [],
  paymentsLoading: false,
  paymentsError: null,

  fetchPayments: async () => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;
    if (!isFirebaseConfigured) return;

    set({ paymentsLoading: true });

    try {
      const querySnapshot = await getDocs(collection(db, "users", uid, "payments"));
      const payments = querySnapshot.docs.map((paymentDoc) => {
        const data = paymentDoc.data();
        const stripeId = paymentRecordId(data.id, paymentDoc.id);
        return {
          id: stripeId,
          amount: data.amount,
          createdAt: data.createdAt ?? null,
          status: data.status,
        };
      });

      // Sort payments by createdAt with newest at the top
      payments.sort(
        (a, b) =>
          (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
      );

      set({ payments, paymentsLoading: false });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      set({ paymentsError: errorMessage, paymentsLoading: false });
    }
  },
}));
