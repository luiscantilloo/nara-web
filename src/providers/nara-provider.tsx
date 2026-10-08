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

function subscribe(onChange: () => void) {
  return AlientoStore.subscribe(onChange);
}

function getSnapshot() {
  return AlientoStore.get();
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
    void (async () => {
      try {
        await import("@/lib/agent/agent.js");
        await import("@/lib/agent/agent-chart.js");
        await hydrateSession();
        await hydrateProgramData(AlientoStore);
      } finally {
        pausePersist(false);
        setReady(true);
      }
    })();
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
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return store;
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
