"use client";
import { PropsWithChildren, MouseEvent, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUiLock } from "@/lib/ui-lock";

export default function ProductLinkCard({
  href,
  children,
}: PropsWithChildren<{ href: string }>) {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const { lock, unlock } = useUiLock();

  const prefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    (router as any).prefetch?.(href);
  }, [href, router]);

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    prefetch();
    const lockId = lock("open-product"); // 👈 MISMO id

    const maybe = (router as any).prefetch?.(href);
    if (maybe && typeof (maybe as any)?.finally === "function") {
      (maybe as Promise<void>).finally(() => {
        router.push(href, { scroll: false });
      });
    } else {
      setTimeout(() => router.push(href, { scroll: false }), 80);
    }

    setTimeout(() => unlock(lockId), 1200);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      style={{ textDecoration: "none", display: "block" }}
    >
      {children}
    </a>
  );
}
