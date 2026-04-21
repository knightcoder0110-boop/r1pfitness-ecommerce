import { create } from "zustand";
import type { ImageRef } from "@/lib/woo/types";

/**
 * Tiny cross-component store: ProductPurchase writes the active variation's
 * image here; ProductGallery reads it to highlight the correct photo.
 *
 * Scoped per-page-render: values reset on navigation because Zustand stores
 * are module singletons but the page unmounts between navigations in Next.js.
 */
interface ActiveVariationState {
  variantImage: ImageRef | undefined;
  setVariantImage: (image: ImageRef | undefined) => void;
}

export const useActiveVariationStore = create<ActiveVariationState>((set) => ({
  variantImage: undefined,
  setVariantImage: (variantImage) => set({ variantImage }),
}));
