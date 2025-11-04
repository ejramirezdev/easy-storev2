"use client";
import {
  PropsWithChildren,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUiLock } from "@/lib/ui-lock";
import { PRODUCT_MODAL_LOCK_ID } from "@/lib/locks";

function resolveBasePath(targetHref: string): string {
  try {
    const [pathPart] = targetHref.split("?");
    const segments = pathPart.split("/").filter(Boolean).slice(0, -1);

    return segments.length > 0 ? `/${segments.join("/")}` : "/";
  } catch {
    return "/";
  }
}

export default function ProductLinkCard({
  href,
  children,
}: PropsWithChildren<{ href: string }>) {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRef = useRef(false);
  const basePrefetchedRef = useRef(false);
  const { lock, unlock, locked } = useUiLock();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const lockIdRef = useRef<string | number | null>(null);
  const failsafeRef = useRef<number | null>(null);

  const basePath = useMemo(() => resolveBasePath(href), [href]);

  const prefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    router.prefetch?.(href);
  }, [href, router]);

  const prefetchBase = useCallback(() => {
    if (basePrefetchedRef.current) return;
    basePrefetchedRef.current = true;
    router.prefetch?.(basePath);
  }, [basePath, router]);

  useEffect(() => {
    basePrefetchedRef.current = false;
  }, [basePath]);

  const releaseLock = useCallback(() => {
    if (failsafeRef.current) {
      clearTimeout(failsafeRef.current);
      failsafeRef.current = null;
    }
    if (lockIdRef.current != null) {
      unlock(lockIdRef.current);
      lockIdRef.current = null;
    }
    setIsNavigating(false);
  }, [unlock]);

  useEffect(() => {
    return () => {
      releaseLock();
    };
  }, [releaseLock]);

  useEffect(() => {
    if (!pendingHref) return;
    if (!pathname) return;

    const pendingBase = resolveBasePath(pendingHref);

    if (pathname === pendingBase) {
      router.push(pendingHref, { scroll: false });
      setPendingHref(null);
    } else if (pathname === pendingHref) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref, router]);

  useEffect(() => {
    if (!locked) {
      if (failsafeRef.current) {
        clearTimeout(failsafeRef.current);
        failsafeRef.current = null;
      }
      lockIdRef.current = null;
      setIsNavigating(false);
    }
  }, [locked]);

  // Deshabilitar si el producto actual ya está abierto
  const isCurrentProduct = pathname === href;
  const disabled = locked || isNavigating || isCurrentProduct;

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    if (disabled) return;

    prefetch();
    if (!pathname || pathname !== basePath) {
      prefetchBase();
    }

    // Si ya estamos viendo este producto, no hacer nada
    if (isCurrentProduct) {
      return;
    }

    const lockId = lock(PRODUCT_MODAL_LOCK_ID);
    lockIdRef.current = lockId;
    setIsNavigating(true);

    if (typeof window !== "undefined") {
      if (failsafeRef.current) {
        clearTimeout(failsafeRef.current);
      }
      failsafeRef.current = window.setTimeout(() => {
        releaseLock();
      }, 8000);
    }

    // Si estamos en /products, navegar directamente al producto (el modal route lo interceptará)
    if (!pathname || pathname === basePath) {
      router.push(href, { scroll: false });
      return;
    }

    // Si estamos en la página de inicio, navegar directamente al producto (página completa)
    if (pathname === "/") {
      router.push(href);
      return;
    }

    // Si estamos en otra página, primero ir a /products y luego al producto
    setPendingHref(href);
    router.replace(basePath, { scroll: false });
  };

  return (
    <a
      href={href}
      onClick={onClick}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={disabled ? -1 : undefined}
      style={{
        textDecoration: "none",
        display: "block",
        height: "100%",
        pointerEvents: disabled ? "none" : undefined,
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {children}
    </a>
  );
}
