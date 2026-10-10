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
import { flushSync } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { NaraLoadingScreen } from "./NaraLoadingScreen";

type RouteLoadingApi = {
  /** Muestra la carga de inmediato (antes de cambiar vista / router.push). */
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

const MIN_VISIBLE_MS = 420;

/**
 * Muestra NaraLoadingScreen al navegar.
 * `start()` pinta el overlay síncrono (flushSync) para que nunca se vea
 * la ruta nueva antes del loading.
 */
export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
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
    startedAt.current = Date.now();
    // Forzar paint del overlay antes de que el click cambie la vista/URL.
    flushSync(() => {
      setLoading(true);
    });
    // Si la ruta no cambia (error / misma vista), no dejar el overlay colgado.
    hideTimer.current = setTimeout(() => {
      setLoading(false);
      hideTimer.current = null;
    }, 2500);
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    const elapsed = Date.now() - (startedAt.current || Date.now());
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimer.current = setTimeout(() => {
      setLoading(false);
      hideTimer.current = null;
    }, wait);
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
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      if (
        /^https?:\/\//i.test(href) &&
        !href.startsWith(window.location.origin)
      ) {
        return;
      }
      if (sameDestination(href)) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  // Cuando la ruta cambia: si ya había loading, cumplir mínimo y ocultar;
  // si no (push sin start), mostrar y ocultar (mejor tarde que nunca).
  useEffect(() => {
    if (pathKeyRef.current === pathKey) return;
    pathKeyRef.current = pathKey;
    if (loading) {
      scheduleHide();
    } else {
      startedAt.current = Date.now();
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
