import { apiFetch } from "@/lib/api/client";
import { hydrateAppState, pausePersist } from "@/lib/store/persist";

type Store = typeof import("@/lib/store/store").default;

async function hydrateTerritories(store: Store) {
  try {
    const res = await apiFetch("/api/territories");
    const data = (await res.json()) as {
      ok?: boolean;
      territories?: Array<Record<string, unknown> & { name: string; content?: string[] }>;
    };
    if (res.ok && data.ok && Array.isArray(data.territories)) {
      const seen = new Set<string>();
      const territories = data.territories.filter((t) => {
        const n = String(t.name || "").trim();
        if (!n || seen.has(n)) return false;
        seen.add(n);
        return true;
      });
      store.set((s: {
        territories: Record<string, unknown>[];
        terrOv: Record<string, { content?: string[] }>;
      }) => {
        s.territories = territories;
        s.terrOv = s.terrOv || {};
        territories.forEach((t) => {
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

async function hydrateExperts(store: Store) {
  try {
    const res = await apiFetch("/api/experts");
    const data = (await res.json()) as {
      ok?: boolean;
      experts?: Record<string, unknown>[];
    };
    if (res.ok && data.ok && Array.isArray(data.experts)) {
      store.set((s: { experts: Record<string, unknown>[] }) => {
        s.experts = data.experts!;
      });
    }
  } catch {
    /* sin expertos aún */
  }
}

async function hydrateAccounts(store: Store) {
  try {
    const res = await apiFetch("/api/accounts");
    const data = (await res.json()) as {
      ok?: boolean;
      accounts?: Record<string, unknown>[];
    };
    if (res.ok && data.ok && Array.isArray(data.accounts)) {
      store.set((s: { accounts: Record<string, unknown>[] }) => {
        s.accounts = data.accounts!;
      });
    }
  } catch {
    /* sin cuentas o sin permiso */
  }
}

async function hydratePeopleFlagsWorklists(store: Store) {
  try {
    const [peopleRes, flagsRes, wlRes, patientsRes, assetsRes] = await Promise.all([
      apiFetch("/api/people"),
      apiFetch("/api/flags"),
      apiFetch("/api/worklists"),
      apiFetch("/api/patients"),
      apiFetch("/api/assets"),
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

    store.set((s: {
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

async function hydratePatientSelf(store: Store) {
  try {
    const res = await apiFetch("/api/patients/me");
    const data = (await res.json()) as {
      ok?: boolean;
      patient?: Record<string, unknown> & { id: string };
    };
    if (res.ok && data.ok && data.patient?.id) {
      store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
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
}

let inFlight: Promise<void> | null = null;
let lastHydratedSessionId: string | null = null;

/** Carga territorios, expertos, personas, etc. según el rol de la sesión activa. */
export async function hydrateProgramData(
  store: Store,
  opts?: { force?: boolean },
): Promise<void> {
  const session = store.session() as { id?: string; roleId?: string | null } | null;
  if (!session?.id) {
    lastHydratedSessionId = null;
    return;
  }

  if (!opts?.force && lastHydratedSessionId === session.id && !inFlight) return;
  if (inFlight) {
    if (!opts?.force) return inFlight;
    await inFlight;
  }

  inFlight = (async () => {
    pausePersist(true);
    try {
      const roleId = session.roleId || null;

      if (roleId === "paciente") {
        await hydratePatientSelf(store);
        await hydrateAppState(store);
        lastHydratedSessionId = session.id!;
        return;
      }

      const programJobs: Promise<unknown>[] = [
        hydrateTerritories(store),
        hydrateExperts(store),
        hydrateAppState(store),
      ];

      if (roleId === "admin") {
        programJobs.push(hydrateAccounts(store));
      }

      if (roleId === "admin" || roleId === "experto" || roleId === "clinico") {
        programJobs.push(hydratePeopleFlagsWorklists(store));
      } else if (roleId === "observador") {
        programJobs.push(
          apiFetch("/api/people")
            .then(async (peopleRes) => {
              const peopleData = (await peopleRes.json()) as {
                ok?: boolean;
                people?: Record<string, unknown>[];
              };
              if (peopleRes.ok && peopleData.ok && Array.isArray(peopleData.people)) {
                store.set((s: { people: Record<string, unknown>[] }) => {
                  s.people = peopleData.people!;
                });
              }
            })
            .catch(() => {}),
        );
      }

      await Promise.all(programJobs);
      lastHydratedSessionId = session.id!;
    } finally {
      pausePersist(false);
      inFlight = null;
    }
  })();

  return inFlight;
}

export function resetHydrateProgramCache() {
  lastHydratedSessionId = null;
}
