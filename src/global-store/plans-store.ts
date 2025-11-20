import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the payment plan type
export interface PaymentPlan {
  planName: string;
  price: number;
  key: string;
  duration: number;
  savings?: number;
}

// Define the selected payment plan structure
export interface SelectedPaymentPlanData {
  mainPlan: any;
  paymentPlan: PaymentPlan;
}

export interface IPlansGlobalStore {
  selectedPaymentPlan: SelectedPaymentPlanData | null;
  setSelectedPaymentPlan: (selectedPaymentPlan: SelectedPaymentPlanData | null) => void;
}

export const plansGlobalStore = create<IPlansGlobalStore>()(
  persist(
    (set) => ({
      selectedPaymentPlan: null,
      setSelectedPaymentPlan: (selectedPaymentPlan: SelectedPaymentPlanData | null) =>
        set({ selectedPaymentPlan }),
    }),
    {
      name: "plans-storage", // unique name for localStorage
    }
  )
);
