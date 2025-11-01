"use client";

import { useEffect } from "react";
import { useUiLock } from "@/lib/ui-lock";
import { PRODUCT_MODAL_LOCK_ID } from "@/lib/locks";

export default function ProductPageUnlocker() {
  const { unlock } = useUiLock();

  useEffect(() => {
    unlock(PRODUCT_MODAL_LOCK_ID);

    return () => {
      unlock(PRODUCT_MODAL_LOCK_ID);
    };
  }, [unlock]);

  return null;
}
