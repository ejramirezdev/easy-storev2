"use client";
import {
  PropsWithChildren,
  MouseEvent,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUiLock } from "@/lib/ui-lock";
import { PRODUCT_MODAL_LOCK_ID } from "@/lib/locks";

export default function ProductLinkCard({
  href,
  children,
}: PropsWithChildren<{ href: string }>) {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRef = useRef(false);
  const { lock, unlock, locked } = useUiLock();

  const basePath = useMemo(() => {
    try {
      const [pathPart] = href.split("?");
      const segments = pathPart
        .split("/")
        .filter(Boolean)
        .slice(0, -1);

      return segments.length > 0 ? `/${segments.join("/")}` : "/";
    } catch {
      return "/";
    }
  }, [href]);

  const prefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    (router as any).prefetch?.(href);
  }, [href, router]);

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    if (locked) return;
    prefetch();
    const lockId = lock(PRODUCT_MODAL_LOCK_ID); // 👈 MISMO id

    const pushProduct = () => {
      router.push(href, { scroll: false });
    };

    if (pathname && pathname !== basePath) {
      router.replace(basePath, { scroll: false });
      setTimeout(pushProduct, 60);
    } else {
      pushProduct();
    }

    // Failsafe por si la navegación falla.
    setTimeout(() => unlock(lockId), 8000);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      aria-disabled={locked ? "true" : undefined}
      tabIndex={locked ? -1 : undefined}
      style={{
        textDecoration: "none",
        display: "block",
        height: "100%",
        pointerEvents: locked ? "none" : undefined,
        opacity: locked ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {children}
    </a>
  );
}
