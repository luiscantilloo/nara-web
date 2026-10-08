"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NaraLoadingScreen } from "./NaraLoadingScreen";

type RouteLoadingApi = {
  /** Muestra la carga (p. ej. antes de router.push). */
  start: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingApi>({ start: () => {} });

export function useRouteLoading() {
  return useContext(RouteLoadingContext);
}

function sameDestination(href: string) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return true;
    return (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  } catch {
    return true;
  }
}

/**
 * Muestra NaraLoadingScreen al cambiar de ruta (clics en nav / links internos).
 */
export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathKey = `${pathname}?${searchParams?.toString() || ""}`;
  const pathKeyRef = useRef(pathKey);

  const clearHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const start = useCallback(() => {
    clearHide();
    setLoading(true);
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => {
      setLoading(false);
      hideTimer.current = null;
    }, 320);
  }, []);

  // Clics en links internos (barra de navegación y resto de la app).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      const a = el as HTMLAnchorElement;
      if (a.target && a.target !== "_self") return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
        return;
      }
      if (sameDestination(href)) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  // Cuando la ruta cambia, mantener un instante la carga y luego quitarla.
  useEffect(() => {
    if (pathKeyRef.current === pathKey) return;
    pathKeyRef.current = pathKey;
    if (loading) {
      scheduleHide();
    } else {
      // Navegación programática (router.push sin <Link>).
      setLoading(true);
      scheduleHide();
    }
  }, [pathKey, loading, scheduleHide]);

  useEffect(() => () => clearHide(), []);

  return (
    <RouteLoadingContext.Provider value={{ start }}>
      {children}
      {loading ? <NaraLoadingScreen /> : null}
    </RouteLoadingContext.Provider>
  );
}
