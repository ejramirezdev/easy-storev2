"use client";

import { useEffect } from "react";
import { useUiLock } from "@/lib/ui-lock";
import { PRODUCT_MODAL_LOCK_ID } from "@/lib/locks";

export default function ProductPageUnlocker() {
  const { unlock } = useUiLock();

  useEffect(() => {
    const t = setTimeout(() => {
      unlock(PRODUCT_MODAL_LOCK_ID);
    }, 0);

    return () => clearTimeout(t);
  }, [unlock]);

  return null;
}
