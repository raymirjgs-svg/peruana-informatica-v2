import type { Dispatch, SetStateAction } from "react";

export interface UseProductsFormsParams {
  reloadProducts: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error") => void;
  setError: Dispatch<SetStateAction<string | null>>;
  selectedProducts: number[];
  clearSelection: () => void;
}
