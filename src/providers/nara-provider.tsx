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

export type NaraUser = {
  id: string;
  name: string;
  role: string;
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
    void Promise.all([
      import("@/lib/agent/agent.js"),
      import("@/lib/agent/agent-chart.js"),
    ]).finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F0ECE6",
          fontFamily: "Figtree, system-ui, sans-serif",
        }}
      />
    );
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
