import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Toast } from "@/lib/types";

interface UIStore {
  toast: Toast | null;
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      toast: null,

      showToast: (toastData) => {
        const id = crypto.randomUUID();
        set({ toast: { id, ...toastData } });
        const duration = toastData.duration || 4000;
        setTimeout(() => {
          set((state) => {
            if (state.toast?.id === id) return { toast: null };
            return state;
          });
        }, duration);
      },

      dismissToast: () => set({ toast: null }),
    }),
    { name: "ui-store" },
  ),
);