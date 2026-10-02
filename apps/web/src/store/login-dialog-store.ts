import { create } from "zustand";
import type { LoginDialogStore } from "@/types/login-dialog";

export const useLoginDialogStore = create<LoginDialogStore>((set) => ({
  openRequest: 0,
  requestOpen: () => set((state) => ({ openRequest: state.openRequest + 1 })),
}));
