import { create } from "zustand";
import { IUser } from "@/interfaces";

export interface ISubscription {
  id: number;
  created_at: string;
  plan_id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  total_duration: number;
  amount: number;
  payment_id: string;
  is_active: boolean;
  is_cash_approval?: boolean;
  payment_gateway: string;
  coupon_id?: number;
  original_amount?: number;
  discount_amount?: number;
  plan?: {
    id: number;
    name: string;
    description?: string;
    features?: string[];
    monthly_price?: number;
    quarterly_price?: number;
    half_yearly_price?: number;
    yearly_price?: number;
    is_active?: boolean;
  };
}

export interface IUsersGlobalStore {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  currentSubscription: ISubscription | null;
  setCurrentSubscription: (subscription: ISubscription | null) => void;
  updateUserContactNumber: (contactNo: string) => void;
  getIsProfileComplete: () => boolean;
}

const usersGlobalStore = create<IUsersGlobalStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  currentSubscription: null,
  setCurrentSubscription: (subscription) => set({ currentSubscription: subscription }),
  updateUserContactNumber: (contactNo: string) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, contact_no: contactNo } });
    }
  },
  getIsProfileComplete: () => {
    const user = get().user;
    return !!(user?.contact_no && user?.name && user?.email);
  },
}));

export default usersGlobalStore;
