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
import { hydrateAppState, pausePersist } from "@/lib/store/persist";

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

const fetchOpts: RequestInit = { credentials: "same-origin" };

export function NaraProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.AlientoStore = AlientoStore;
    window.AlientoAI = AlientoAI;

    async function hydrateSession() {
      try {
        const res = await fetch("/api/auth/me", fetchOpts);
        const data = (await res.json()) as {
          ok?: boolean;
          user?: Parameters<typeof applySessionUser>[0];
        };
        if (res.ok && data.ok && data.user) applySessionUser(data.user);
      } catch {
        /* sin sesión */
      }
    }

    async function hydrateTerritories() {
      try {
        const res = await fetch("/api/territories", fetchOpts);
        const data = (await res.json()) as {
          ok?: boolean;
          territories?: Array<Record<string, unknown> & { name: string; content?: string[] }>;
        };
        if (res.ok && data.ok && Array.isArray(data.territories)) {
          AlientoStore.set((s: {
            territories: Record<string, unknown>[];
            terrOv: Record<string, { content?: string[] }>;
          }) => {
            s.territories = data.territories!;
            s.terrOv = s.terrOv || {};
            data.territories!.forEach((t) => {
              if (t.content?.length) {
                s.terrOv[t.name] = Object.assign({}, s.terrOv[t.name], { content: t.content });
              }
            });
          });
        }
      } catch {
        /* sin Mongo aún */
      }
    }

    async function hydrateExperts() {
      try {
        const res = await fetch("/api/experts", fetchOpts);
        const data = (await res.json()) as {
          ok?: boolean;
          experts?: Record<string, unknown>[];
        };
        if (res.ok && data.ok && Array.isArray(data.experts)) {
          AlientoStore.set((s: { experts: Record<string, unknown>[] }) => {
            s.experts = data.experts!;
          });
        }
      } catch {
        /* sin expertos aún */
      }
    }

    async function hydrateAccounts() {
      try {
        const res = await fetch("/api/accounts", fetchOpts);
        const data = (await res.json()) as {
          ok?: boolean;
          accounts?: Record<string, unknown>[];
        };
        if (res.ok && data.ok && Array.isArray(data.accounts)) {
          AlientoStore.set((s: { accounts: Record<string, unknown>[] }) => {
            s.accounts = data.accounts!;
          });
        }
      } catch {
        /* sin cuentas o sin permiso */
      }
    }

    async function hydratePeopleFlagsWorklists() {
      try {
        const [peopleRes, flagsRes, wlRes, patientsRes, assetsRes] = await Promise.all([
          fetch("/api/people", fetchOpts),
          fetch("/api/flags", fetchOpts),
          fetch("/api/worklists", fetchOpts),
          fetch("/api/patients", fetchOpts),
          fetch("/api/assets", fetchOpts),
        ]);
        const peopleData = (await peopleRes.json()) as { ok?: boolean; people?: Record<string, unknown>[] };
        const flagsData = (await flagsRes.json()) as { ok?: boolean; flags?: Record<string, unknown>[] };
        const wlData = (await wlRes.json()) as {
          ok?: boolean;
          items?: Array<Record<string, unknown> & { expertId: string }>;
        };
        const patientsData = (await patientsRes.json()) as {
          ok?: boolean;
          patients?: Array<
            Record<string, unknown> & {
              id: string;
              name: string;
              profile?: string;
              phq?: number[];
              expert?: string;
              place?: string;
              age?: number;
            }
          >;
        };
        const assetsData = (await assetsRes.json()) as { ok?: boolean; assets?: Record<string, unknown>[] };

        AlientoStore.set((s: {
          people: Record<string, unknown>[];
          flags: Record<string, unknown>[];
          worklists: Record<string, Record<string, unknown>[]>;
          patients: Record<string, Record<string, unknown>>;
          caseload: Record<string, unknown>[];
          assets: Record<string, unknown>[];
        }) => {
          if (peopleRes.ok && peopleData.ok && Array.isArray(peopleData.people)) {
            s.people = peopleData.people;
          }
          if (flagsRes.ok && flagsData.ok && Array.isArray(flagsData.flags)) {
            s.flags = flagsData.flags;
          }
          if (wlRes.ok && wlData.ok && Array.isArray(wlData.items)) {
            s.worklists = s.worklists || {};
            const byEx: Record<string, Record<string, unknown>[]> = {};
            wlData.items.forEach((item) => {
              const k = item.expertId;
              if (!byEx[k]) byEx[k] = [];
              byEx[k].push(item);
            });
            Object.keys(byEx).forEach((k) => {
              s.worklists[k] = byEx[k];
            });
          }
          if (patientsRes.ok && patientsData.ok && Array.isArray(patientsData.patients)) {
            s.patients = s.patients || {};
            s.caseload = [];
            patientsData.patients.forEach((p) => {
              s.patients[p.id] = p;
              s.caseload.push({
                id: p.id,
                name: p.name,
                age: p.age,
                place: p.place,
                profile: p.profile,
                phq: Array.isArray(p.phq) ? p.phq[p.phq.length - 1] : 0,
                expert: p.expert,
              });
            });
          }
          if (assetsRes.ok && assetsData.ok && Array.isArray(assetsData.assets)) {
            s.assets = assetsData.assets;
          }
        });
      } catch {
        /* sin captación aún */
      }
    }

    pausePersist(true);
    void (async () => {
      try {
        await import("@/lib/agent/agent.js");
        await import("@/lib/agent/agent-chart.js");
        await hydrateSession();

        const session = AlientoStore.session() as NaraUser | null;
        const roleId = session?.roleId || null;

        if (!session) return;

        // Paciente: ficha propia (módulos del admin) + app-state
        if (roleId === "paciente") {
          try {
            const res = await fetch("/api/patients/me", fetchOpts);
            const data = (await res.json()) as {
              ok?: boolean;
              patient?: Record<string, unknown> & { id: string };
            };
            if (res.ok && data.ok && data.patient?.id) {
              AlientoStore.set((s: { patients: Record<string, Record<string, unknown>> }) => {
                s.patients = s.patients || {};
                s.patients[data.patient!.id] = {
                  ...(s.patients[data.patient!.id] || {}),
                  ...data.patient!,
                };
              });
            }
          } catch {
            /* sin ficha aún */
          }
          await hydrateAppState(AlientoStore);
          return;
        }

        const programJobs: Promise<unknown>[] = [
          hydrateTerritories(),
          hydrateExperts(),
          hydrateAppState(AlientoStore),
        ];

        if (roleId === "admin") {
          programJobs.push(hydrateAccounts());
        }

        if (roleId === "admin" || roleId === "experto" || roleId === "clinico") {
          programJobs.push(hydratePeopleFlagsWorklists());
        } else if (roleId === "observador") {
          // observador: territorios/expertos ya; people agregado vía territories+store
          programJobs.push(
            fetch("/api/people", fetchOpts)
              .then(async (peopleRes) => {
                const peopleData = (await peopleRes.json()) as {
                  ok?: boolean;
                  people?: Record<string, unknown>[];
                };
                if (peopleRes.ok && peopleData.ok && Array.isArray(peopleData.people)) {
                  AlientoStore.set((s: { people: Record<string, unknown>[] }) => {
                    s.people = peopleData.people!;
                  });
                }
              })
              .catch(() => {}),
          );
        }

        await Promise.all(programJobs);
      } finally {
        pausePersist(false);
        setReady(true);
      }
    })();
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
