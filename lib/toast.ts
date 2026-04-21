/**
 * Lightweight global toast store.
 *
 * Usage:
 *   const { show } = useToastStore();
 *   show("Added to cart", "success");
 *
 * Rendered once in app/providers.tsx via <ToastRoot />.
 * The actual Toast component lives in components/toast.tsx.
 */
import { create } from "zustand";

export type ToastType = "success" | "error";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  show: (message: string, type?: ToastType) => void;
  dismiss: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: "",
  type: "success",
  visible: false,
  show: (message, type = "success") => set({ message, type, visible: true }),
  dismiss: () => set({ visible: false }),
}));
