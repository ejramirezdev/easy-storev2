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
  const { lock, unlock } = useUiLock();

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
