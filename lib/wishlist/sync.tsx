"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { selectWishlistHydrated, useWishlistStore } from "./store";
import type { WishlistItem } from "./types";

type WishlistResponse =
  | { ok: true; data: { items: WishlistItem[] } }
  | { ok: false; error?: { message?: string } };

async function fetchRemoteWishlist(): Promise<WishlistItem[] | null> {
  const res = await fetch("/api/account/wishlist", { headers: { accept: "application/json" } });
  if (!res.ok) return null;
  const json = (await res.json()) as WishlistResponse;
  return json.ok ? json.data.items : null;
}

async function saveRemoteWishlist(items: WishlistItem[]): Promise<void> {
  await fetch("/api/account/wishlist", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export function WishlistSyncProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const hydrated = useWishlistStore(selectWishlistHydrated);
  const items = useWishlistStore((state) => state.items);
  const mergeRemote = useWishlistStore((state) => state.mergeRemote);
  const readyRef = useRef(false);
  const lastSavedRef = useRef("");

  useEffect(() => {
    if (!hydrated) {
      void useWishlistStore.persist.rehydrate();
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (status !== "authenticated") {
      readyRef.current = false;
      return;
    }

    let cancelled = false;
    void fetchRemoteWishlist().then((remoteItems) => {
      if (cancelled) return;
      const remotePayload = remoteItems ? JSON.stringify(remoteItems) : null;
      if (remoteItems) mergeRemote(remoteItems);

      const mergedItems = useWishlistStore.getState().items;
      const mergedPayload = JSON.stringify(mergedItems);
      readyRef.current = true;
      lastSavedRef.current = mergedPayload;

      if (remotePayload && mergedPayload !== remotePayload) {
        void saveRemoteWishlist(mergedItems);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, mergeRemote, status]);

  useEffect(() => {
    if (!hydrated || status !== "authenticated" || !readyRef.current) return;

    const payload = JSON.stringify(items);
    if (payload === lastSavedRef.current) return;

    const timer = window.setTimeout(() => {
      lastSavedRef.current = payload;
      void saveRemoteWishlist(items);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [hydrated, items, status]);

  return <>{children}</>;
}
