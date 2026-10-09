"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import AlientoStore from "@/lib/store/store";
import AlientoAI from "@/lib/ai/ai";
import { applySessionUser } from "@/lib/auth/applySessionUser";
import { apiFetch } from "@/lib/api/client";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { pausePersist } from "@/lib/store/persist";
import { hydrateProgramData } from "@/lib/store/hydrateProgram";
import { startLiveProgramSync } from "@/lib/store/liveSync";

export type NaraUser = {
  id: string;
  name: string;
  role: string;
  roleId?: string | null;
  terr: string;
  href: string;
  nk: string | null;
};

type StoreApi = typeof AlientoStore;

const StoreContext = createContext<StoreApi | null>(null);

/** El store muta el mismo objeto en memoria; hay que versionar para que React detecte cambios. */
let storeVersion = 0;

function subscribe(onChange: () => void) {
  return AlientoStore.subscribe(() => {
    storeVersion += 1;
    onChange();
  });
}

function getSnapshot() {
  return storeVersion;
}

function getServerSnapshot() {
  return 0;
}

export function NaraProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.AlientoStore = AlientoStore;
    window.AlientoAI = AlientoAI;

    async function hydrateSession() {
      try {
        const res = await apiFetch("/api/auth/me");
        const data = (await res.json()) as {
          ok?: boolean;
          user?: Parameters<typeof applySessionUser>[0];
        };
        if (res.ok && data.ok && data.user) applySessionUser(data.user);
      } catch {
        /* sin sesión */
      }
    }

    pausePersist(true);
    let cancelled = false;
    let stopLive: (() => void) | undefined;
    void (async () => {
      try {
        await import("@/lib/agent/agent.js");
        await import("@/lib/agent/agent-chart.js");
        await hydrateSession();
        await hydrateProgramData(AlientoStore);
      } finally {
        pausePersist(false);
        if (cancelled) return;
        setReady(true);
        // Sync continuo: módulos, estados, fichas, etc. sin recargar.
        stopLive = startLiveProgramSync(AlientoStore);
      }
    })();

    // Actividad del usuario (clics / teclas) → renueva lastLoginAt (inactividad del perfil).
    let lastTouch = 0;
    const touchActivity = () => {
      const now = Date.now();
      if (now - lastTouch < 20_000) return;
      const sess = AlientoStore.session() as { id?: string; patientId?: string } | null;
      if (!sess?.id) return;
      // Con bloqueo de inactividad solo «Volví» reactiva (no renovar por clics).
      const map = (AlientoStore.get().patients || {}) as Record<
        string,
        { inactiveLock?: boolean; status?: string; signal?: string; accountId?: string }
      >;
      const row =
        (sess.patientId && map[sess.patientId]) ||
        map[sess.id] ||
        Object.values(map).find((p) => p?.accountId === sess.id) ||
        null;
      if (
        row?.inactiveLock === true ||
        /^inactivo$/i.test(String(row?.status || row?.signal || ""))
      ) {
        return;
      }
      lastTouch = now;
      void apiFetch("/api/accounts/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ touch: true }),
      }).catch(() => {
        /* sin red */
      });
    };
    document.addEventListener("pointerdown", touchActivity, { passive: true });
    document.addEventListener("keydown", touchActivity);

    return () => {
      cancelled = true;
      stopLive?.();
      document.removeEventListener("pointerdown", touchActivity);
      document.removeEventListener("keydown", touchActivity);
    };
  }, []);

  if (!ready) {
    return <NaraLoadingScreen />;
  }

  return (
    <StoreContext.Provider value={AlientoStore}>{children}</StoreContext.Provider>
  );
}

export function useNaraStore(): StoreApi {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useNaraStore debe usarse dentro de NaraProvider");
  // Suscripción versionada: cualquier store.set() re-renderiza consumidores.
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return store;
}

/** Contador de cambios del store — útil como dep de useMemo en pantallas grandes. */
export function useNaraLive(): number {
  useContext(StoreContext); // asegurar que hay provider
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useNaraSession(): NaraUser | null {
  const store = useNaraStore();
  return store.session() as NaraUser | null;
}

declare global {
  interface Window {
    AlientoStore: typeof AlientoStore;
    AlientoAI: typeof AlientoAI;
    AlientoAgent?: {
      ROLE: Record<string, { name: string; greet: string; sub: string }>;
      list: (role: string) => { id: string; q: string }[];
      ask: (role: string, text: string) => Promise<Record<string, unknown>>;
      runById: (role: string, qid: string) => Record<string, unknown> | null;
      briefing: (ex: string, S: Record<string, unknown>) => {
        text: string;
        dots: { ok: boolean }[];
        revisits: { name: string; when: string; place: string }[];
        crisis: { text: string }[];
      };
    };
    makeAlientoChart?: (React: typeof import("react")) => React.ComponentType<{
      spec: Record<string, unknown>;
    }>;
    claude?: { complete: (prompt: string) => Promise<string> };
    __alientoShift?: boolean;
  }
}
