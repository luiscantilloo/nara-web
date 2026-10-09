"use client";

import { hydrateProgramData } from "@/lib/store/hydrateProgram";

type Store = typeof import("@/lib/store/store").default;

const DEFAULT_INTERVAL_MS = 4_000;

/**
 * Mantiene el store alineado con Mongo sin recargar la página:
 * - polling mientras la pestaña está visible
 * - refresh inmediato al volver a la pestaña / foco / reconexión
 */
export function startLiveProgramSync(
  store: Store,
  opts?: { intervalMs?: number },
): () => void {
  const intervalMs = opts?.intervalMs ?? DEFAULT_INTERVAL_MS;
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastRun = 0;
  let running = false;

  const refresh = () => {
    if (stopped || running) return;
    if (typeof document !== "undefined" && document.hidden) return;
    const session = store.session() as { id?: string } | null;
    if (!session?.id) return;
    running = true;
    lastRun = Date.now();
    void hydrateProgramData(store, { force: true }).finally(() => {
      running = false;
    });
  };

  const onVisibleOrFocus = () => {
    if (typeof document !== "undefined" && document.hidden) return;
    // Al volver: refrescar ya (aunque el intervalo no haya vencido).
    refresh();
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") onVisibleOrFocus();
  };

  timer = setInterval(() => {
    if (Date.now() - lastRun < intervalMs * 0.85) return;
    refresh();
  }, intervalMs);

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onVisibleOrFocus);
  window.addEventListener("online", onVisibleOrFocus);

  // Primer tick suave tras montar (el boot inicial ya hidrató).
  const kick = setTimeout(refresh, 1_500);

  return () => {
    stopped = true;
    clearTimeout(kick);
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onVisibleOrFocus);
    window.removeEventListener("online", onVisibleOrFocus);
  };
}
