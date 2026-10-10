import { apiFetch } from "@/lib/api/client";
import { hydrateAppState, pausePersist } from "@/lib/store/persist";

/** Marca Crisis en fichas con alerta de crisis abierta (fuente de verdad operativa). */
function applyOpenCrisisToPatients(store: Store) {
  const S = store.get() as {
    alerts?: Array<{ sev?: string; status?: string; pid?: string }>;
    patients?: Record<string, Record<string, unknown>>;
    people?: Array<Record<string, unknown> & { id?: string }>;
  };
  const openPids = new Set(
    (S.alerts || [])
      .filter(
        (a) =>
          a.sev === "crisis" &&
          a.status !== "closed" &&
          a.pid,
      )
      .map((a) => String(a.pid)),
  );
  if (!openPids.size) return;
  store.set((s: typeof S) => {
    s.patients = s.patients || {};
    openPids.forEach((pid) => {
      if (s.patients![pid]) {
        s.patients![pid].status = "Crisis";
        s.patients![pid].signal = "Crisis";
        s.patients![pid].crisisLock = true;
      }
      const pe = (s.people || []).find((p) => String(p.id) === pid);
      if (pe) pe.status = "Crisis";
    });
  });
}

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

let lastStaffLiveSig = "";

function staffPayloadSig(input: {
  people?: Record<string, unknown>[];
  flags?: Record<string, unknown>[];
  worklists?: Record<string, unknown>[];
  patients?: Record<string, unknown>[];
  assets?: Record<string, unknown>[];
}): string {
  const pe = (input.people || []).map((p) => [
    p.id,
    p.status,
    p.signal,
    p.profile,
    p.pendingEval === true,
    p.evalAt,
    p.expert,
  ]);
  const pa = (input.patients || []).map((p) => [
    p.id,
    p.status,
    p.signal,
    p.profile,
    p.pendingEval === true,
    p.modulesEnabled,
    p.modulesVisible,
    Array.isArray(p.timeline) ? p.timeline.length : 0,
    p.phq,
    p.crisisLock === true,
    p.crisisAttendedAt ?? null,
  ]);
  return JSON.stringify({
    pe,
    pa,
    flags: (input.flags || []).length,
    wl: (input.worklists || []).length,
    assets: (input.assets || []).length,
  });
}

async function hydratePeopleFlagsWorklists(store: Store) {
  try {
    const [peopleRes, flagsRes, wlRes, patientsRes, assetsRes] = await Promise.all([
      apiFetch("/api/people"),
      apiFetch("/api/flags"),
      apiFetch("/api/worklists"),
      apiFetch("/api/patients"),
      // H-013: /api/assets es solo del admin; los demás roles no lo piden (antes daba 403 en consola).
      (store.session() as { roleId?: string | null } | null)?.roleId === "admin"
        ? apiFetch("/api/assets")
        : Promise.resolve(new Response(JSON.stringify({ ok: true, assets: [] }), { status: 200 })),
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

    const nextSig = staffPayloadSig({
      people: peopleRes.ok && peopleData.ok ? peopleData.people : undefined,
      flags: flagsRes.ok && flagsData.ok ? flagsData.flags : undefined,
      worklists: wlRes.ok && wlData.ok ? wlData.items : undefined,
      patients: patientsRes.ok && patientsData.ok ? patientsData.patients : undefined,
      assets: assetsRes.ok && assetsData.ok ? assetsData.assets : undefined,
    });
    if (nextSig === lastStaffLiveSig) return;
    lastStaffLiveSig = nextSig;

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
        const peopleRows = Array.isArray(s.people) ? s.people : [];
        const peopleById: Record<string, Record<string, unknown>> = {};
        const peopleByCode: Record<string, Record<string, unknown>> = {};
        peopleRows.forEach((pe) => {
          if (pe?.id) peopleById[String(pe.id)] = pe;
          if (pe?.code) peopleByCode[String(pe.code)] = pe;
        });
        const isProfile = (v: unknown) =>
          !!(v && /^P\d+$/i.test(String(v)));
        patientsData.patients.forEach((p) => {
          const pe =
            peopleById[p.id] ||
            (p.code ? peopleByCode[String(p.code)] : null) ||
            null;
          const merged = { ...p } as Record<string, unknown> & {
            id: string;
            name: string;
            profile?: string | null;
            status?: string;
            signal?: string;
            pendingEval?: boolean;
            phq?: number[];
            expert?: string;
            place?: string;
            age?: number;
          };
          if (pe) {
            if (!isProfile(merged.profile) && isProfile(pe.profile)) {
              merged.profile = String(pe.profile);
            }
            if (
              (!merged.status || /^(nueva|activo|activa)$/i.test(String(merged.status))) &&
              pe.status
            ) {
              merged.status = String(pe.status);
            }
            // No pisar señales clínicas (Aceptado / Rechazado / Crisis) con el estado.
            const keepSignal = /^(Aceptado|Rechazado|Crisis)/i.test(
              String(merged.signal || ""),
            );
            if (!keepSignal) {
              // Legado: signal == status Activo tras aprobar → mostrar Aceptado.
              if (
                /^(activo|activa)$/i.test(String(merged.signal || merged.status || "")) &&
                /^(activo|activa)$/i.test(String(merged.status || pe.status || "")) &&
                isProfile(merged.profile)
              ) {
                merged.signal = "Aceptado";
              }
            }
            if (pe.pendingEval === true) merged.pendingEval = true;
            if (pe.activeAt != null && merged.activeAt == null) {
              merged.activeAt = pe.activeAt;
            }
            if (pe.inactiveLock === true) merged.inactiveLock = true;
            if (pe.evalAt != null && merged.evalAt == null) merged.evalAt = pe.evalAt;
            if (pe.evalBy != null && !merged.evalBy) merged.evalBy = pe.evalBy;
            if (pe.evalPhq != null && merged.evalPhq == null) merged.evalPhq = pe.evalPhq;
            if (pe.evalDig != null && merged.evalDig == null) merged.evalDig = pe.evalDig;
            if (pe.code && !merged.code) merged.code = pe.code;
            if (pe.expert && !merged.expert) merged.expert = pe.expert;
          }
          s.patients[merged.id] = {
            ...(s.patients[merged.id] || {}),
            ...merged,
          };
          s.caseload.push({
            id: merged.id,
            name: merged.name,
            age: merged.age,
            place: merged.place,
            profile: merged.profile,
            phq: Array.isArray(merged.phq) ? merged.phq[merged.phq.length - 1] : 0,
            expert: merged.expert,
            status: merged.status || merged.signal || null,
            pendingEval: merged.pendingEval === true,
          });
        });
        // Personas evaluadas en people sin ficha patients aún → caseload clínico.
        peopleRows.forEach((pe) => {
          const id = pe?.id ? String(pe.id) : "";
          if (!id || s.patients[id]) return;
          const pending =
            pe.pendingEval === true ||
            /por\s*aprobar/i.test(String(pe.status || ""));
          if (!pending && !isProfile(pe.profile)) return;
          s.patients[id] = {
            id,
            name: pe.name,
            age: pe.age || 0,
            place: pe.place || pe.terr || "",
            profile: isProfile(pe.profile) ? String(pe.profile) : null,
            status: pe.status || "Por aprobar",
            signal: pe.status || "Por aprobar",
            pendingEval: pe.pendingEval === true || pending,
            expert: pe.expert || "",
            code: pe.code || "",
            phq: pe.evalPhq != null ? [Number(pe.evalPhq)] : [],
            clin: pe.clin || null,
          };
          s.caseload.push({
            id,
            name: pe.name,
            age: pe.age || 0,
            place: pe.place || pe.terr || "",
            profile: isProfile(pe.profile) ? String(pe.profile) : null,
            phq: pe.evalPhq != null ? Number(pe.evalPhq) : 0,
            expert: pe.expert || "",
            status: pe.status || "Por aprobar",
            pendingEval: true,
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

/** Firma de campos que la UI del paciente debe reflejar en vivo. */
function patientLiveSig(p: Record<string, unknown> | undefined | null): string {
  if (!p) return "";
  return JSON.stringify({
    profile: p.profile ?? null,
    status: p.status ?? null,
    signal: p.signal ?? null,
    pendingEval: p.pendingEval === true,
    modulesEnabled: p.modulesEnabled ?? null,
    modulesVisible: p.modulesVisible ?? null,
    phq: p.phq ?? null,
    next: p.next ?? null,
    nextShort: p.nextShort ?? null,
    braceletStatus: p.braceletStatus ?? null,
    lastSession: p.lastSession ?? null,
    consent: p.consent ?? null,
    plan: p.plan ?? null,
    timelineLen: Array.isArray(p.timeline) ? p.timeline.length : 0,
    crisisLock: p.crisisLock === true,
    crisisAttendedAt: p.crisisAttendedAt ?? null,
    crisisAttendedOutcome: p.crisisAttendedOutcome ?? null,
    crisisBtnReady: p.crisisBtnReady === true,
  });
}

async function hydratePatientSelf(store: Store) {
  try {
    const res = await apiFetch("/api/patients/me");
    const data = (await res.json()) as {
      ok?: boolean;
      patient?: Record<string, unknown> & { id: string; accountId?: string };
    };
    if (res.ok && data.ok && data.patient?.id) {
      const id = data.patient.id;
      const accountId = data.patient.accountId
        ? String(data.patient.accountId)
        : "";
      const prev = (store.get().patients || {})[id] as Record<string, unknown> | undefined;
      const merged = { ...(prev || {}), ...data.patient };
      // Normalizar attendedAt (API / BSON).
      if (merged.crisisAttendedAt != null) {
        const n = Number(merged.crisisAttendedAt);
        merged.crisisAttendedAt = Number.isFinite(n) && n > 0 ? n : null;
      }
      const openCrisis = (
        (store.get() as { alerts?: Array<{ sev?: string; status?: string; pid?: string }> })
          .alerts || []
      ).some(
        (a) =>
          a.sev === "crisis" &&
          a.status !== "closed" &&
          a.status !== "awaiting_patient" &&
          (a.pid === id || a.pid === accountId || String(a.pid) === id),
      );
      const patientConfirmed = (
        (store.get() as {
          closedToday?: Array<{
            sev?: string;
            pid?: string;
            patientConfirmedAt?: number | null;
          }>;
        }).closedToday || []
      ).some(
        (c) =>
          c.sev === "crisis" &&
          !!c.patientConfirmedAt &&
          (c.pid === id || c.pid === accountId),
      );
      let sessionWell = false;
      try {
        if (typeof window !== "undefined") {
          const now = Date.now();
          for (const key of [id, accountId].filter(Boolean)) {
            const raw = window.sessionStorage.getItem(
              "nara:well-confirmed:" + key,
            );
            const until = Number(raw || 0);
            if (Number.isFinite(until) && now < until) {
              sessionWell = true;
              break;
            }
          }
        }
      } catch {
        /* private mode */
      }
      const remoteCleared =
        data.patient.crisisLock === false &&
        /^activo$/i.test(String(data.patient.status || ""));
      // Tras «estoy bien» local: no dejar que un /me obsoleto vuelva a Crisis.
      const localJustCleared =
        (Date.now() < suppressLiveUntil || sessionWell || patientConfirmed) &&
        (prev?.crisisLock === false || sessionWell || patientConfirmed) &&
        (/^activo$/i.test(String(prev?.status || "")) ||
          sessionWell ||
          patientConfirmed);
      if ((localJustCleared || sessionWell || patientConfirmed) && !remoteCleared) {
        merged.status = "Activo";
        merged.signal = "Activo";
        merged.crisisLock = false;
        merged.crisisAttendedAt = null;
        merged.crisisAttendedOutcome = null;
        merged.crisisBtnReady = true;
      } else if (!remoteCleared) {
        const stillLocked =
          openCrisis ||
          merged.crisisLock === true ||
          (prev?.crisisLock === true && data.patient.crisisLock !== false);
        if (stillLocked && !sessionWell && !patientConfirmed) {
          merged.status = "Crisis";
          merged.signal = "Crisis";
          merged.crisisLock = true;
        }
        // Remoto gana si ya marcó atendido; si no, conservar local.
        if (data.patient.crisisAttendedAt != null) {
          const n = Number(data.patient.crisisAttendedAt);
          if (Number.isFinite(n) && n > 0) {
            merged.crisisAttendedAt = n;
            merged.crisisAttendedOutcome =
              data.patient.crisisAttendedOutcome ?? merged.crisisAttendedOutcome;
          }
        } else if (prev?.crisisAttendedAt && stillLocked) {
          merged.crisisAttendedAt = prev.crisisAttendedAt;
          merged.crisisAttendedOutcome = prev.crisisAttendedOutcome ?? null;
        }
      }
      if (patientLiveSig(prev) === patientLiveSig(merged)) return;
      store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
        s.patients = s.patients || {};
        s.patients[id] = merged;
        // Alias por accountId para lecturas con id de sesión.
        if (accountId && accountId !== id) {
          s.patients[accountId] = { ...merged, id };
        }
      });
    }
  } catch {
    /* sin ficha aún */
  }
}

let inFlight: Promise<void> | null = null;
let lastHydratedSessionId: string | null = null;
/** Evita que un poll pise un write local recién enviado a la API. */
let suppressLiveUntil = 0;

/** Pausar el sync forzado unos segundos tras mutaciones locales. */
export function pauseLiveHydrate(ms = 4_000) {
  suppressLiveUntil = Date.now() + ms;
  lastStaffLiveSig = "";
}

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

  if (opts?.force && Date.now() < suppressLiveUntil) return;

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

      if (roleId === "admin" || roleId === "clinico") {
        programJobs.push(hydrateAccounts(store));
      }

      if (roleId === "admin" || roleId === "experto" || roleId === "clinico") {
        programJobs.push(hydratePeopleFlagsWorklists(store));
      }
      // H-004: el observador no carga personas en el store; su tablero pide el resumen agregado.

      await Promise.all(programJobs);
      if (roleId === "admin" || roleId === "experto" || roleId === "clinico") {
        applyOpenCrisisToPatients(store);
      }
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
  lastStaffLiveSig = "";
}
