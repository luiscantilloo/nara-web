/** Persistencia automática del AlientoStore → Mongo (/api/app-state → nara-api). */

import { APP_STATE_SLICES } from "@/lib/db/appState";
import { apiFetch } from "@/lib/api/client";

let paused = true;
let timer = null;
let lastError = null;
// H-011 (TRL 2026-10-10): último estado que coincide con el servidor. Si nada cambió, no hay PUT
// (antes cada pantalla enviaba todo el estado al cargar).
let lastSynced = null;
let flushing = false;

export function pausePersist(v = true) {
  paused = v;
}

export function isPersistPaused() {
  return paused;
}

function pickSlices(s) {
  const out = {};
  for (const key of APP_STATE_SLICES) {
    if (s[key] !== undefined) {
      try {
        out[key] = JSON.parse(JSON.stringify(s[key]));
      } catch {
        out[key] = s[key];
      }
    }
  }
  return out;
}

function mergeAlertsById(local, remote) {
  const map = new Map();
  const put = (a) => {
    if (!a || typeof a !== "object") return;
    const id = String(a.id || "");
    if (!id) return;
    const prev = map.get(id);
    if (!prev || Number(a.at || 0) >= Number(prev.at || 0)) map.set(id, a);
  };
  (Array.isArray(local) ? local : []).forEach(put);
  (Array.isArray(remote) ? remote : []).forEach(put);
  return Array.from(map.values()).sort(
    (a, b) => Number(b.at || 0) - Number(a.at || 0),
  );
}

export async function hydrateAppState(store) {
  try {
    const res = await apiFetch("/api/app-state");
    const data = await res.json();
    if (!res.ok || !data.ok || !data.slices) return;
    const slices = data.slices;
    // ¿Había un cambio local sin enviar antes de traer lo del servidor?
    const pendienteAntes = !!timer || flushing;
    store.set((s) => {
      Object.keys(slices).forEach((k) => {
        if (slices[k] === undefined) return;
        // Alertas: unir por id para que crisis del paciente llegue al clínico
        // sin que un persist viejo las borre.
        if (k === "alerts") {
          s.alerts = mergeAlertsById(s.alerts, slices.alerts);
          return;
        }
        if (k === "crisisLog") {
          s.crisisLog = mergeAlertsById(s.crisisLog, slices.crisisLog);
          return;
        }
        if (k === "notifs" && slices.notifs && typeof slices.notifs === "object") {
          s.notifs = s.notifs || {};
          Object.keys(slices.notifs).forEach((role) => {
            const remote = slices.notifs[role] || [];
            const local = s.notifs[role] || [];
            const byId = new Map();
            [...local, ...remote].forEach((n) => {
              if (n?.id) byId.set(n.id, n);
            });
            s.notifs[role] = Array.from(byId.values()).sort(
              (a, b) => Number(b.at || 0) - Number(a.at || 0),
            );
          });
          return;
        }
        // Aprobaciones de ruta: unir por id (pending del admin no se pierde).
        if (k === "pathRequests") {
          const map = new Map();
          const put = (row) => {
            if (!row || typeof row !== "object") return;
            const id = String(row.id || `${row.code || ""}-${row.scope || "all"}`);
            if (!id || id === "-") return;
            const norm = { ...row, id };
            const prev = map.get(id);
            if (!prev) {
              map.set(id, norm);
              return;
            }
            const rank = (a) => {
              const st = String(a.status || "pending").toLowerCase();
              if (st === "approved" || st === "rejected") return 3;
              if (st === "superseded") return 2;
              return 1;
            };
            const aAt = Math.max(Number(norm.at || 0), Number(norm.resolvedAt || 0));
            const bAt = Math.max(Number(prev.at || 0), Number(prev.resolvedAt || 0));
            const aSt = String(norm.status || "pending").toLowerCase();
            const bSt = String(prev.status || "pending").toLowerCase();
            // Pending nuevo (reenvío) no lo pisa un approved/rejected viejo del mismo id.
            if (
              aSt === "pending" &&
              (bSt === "approved" || bSt === "rejected" || bSt === "superseded") &&
              Number(norm.at || 0) > bAt
            ) {
              map.set(id, norm);
              return;
            }
            if (rank(norm) > rank(prev) || (rank(norm) === rank(prev) && aAt >= bAt)) {
              map.set(id, { ...prev, ...norm });
            }
          };
          (Array.isArray(s.pathRequests) ? s.pathRequests : []).forEach(put);
          (Array.isArray(slices.pathRequests) ? slices.pathRequests : []).forEach(put);
          s.pathRequests = Array.from(map.values()).sort(
            (a, b) => Number(b.at || 0) - Number(a.at || 0),
          );
          return;
        }
        if (k === "pathOverrides" && slices.pathOverrides && typeof slices.pathOverrides === "object") {
          s.pathOverrides = {
            ...(s.pathOverrides && typeof s.pathOverrides === "object" ? s.pathOverrides : {}),
            ...slices.pathOverrides,
          };
          return;
        }
        if (k === "rules" && slices.rules && typeof slices.rules === "object") {
          const local = s.rules && typeof s.rules === "object" ? s.rules : {};
          const remote = slices.rules;
          const merged = { ...local, ...remote };
          const lPend = local.pending;
          const rPend = remote.pending;
          if (rPend && lPend) {
            merged.pending =
              Number(rPend.at || 0) >= Number(lPend.at || 0) ? rPend : lPend;
          } else if (rPend) {
            merged.pending = rPend;
          } else if (lPend && (remote.pending === null || remote.pending === undefined)) {
            const verAt = Number(remote.versions?.[0]?.at || 0);
            const cleared = Number(remote.pendingClearedAt || 0);
            const pendAt = Number(lPend.at || 0);
            if (Math.max(verAt, cleared) >= pendAt && pendAt > 0) {
              merged.pending = null;
            } else {
              merged.pending = lPend;
            }
          }
          s.rules = merged;
          return;
        }
        s[k] = slices[k];
      });
    });
    // Lo recién traído del servidor no es un cambio local: no se reenvía. Si había un cambio local
    // pendiente, se deja que su guardado siga su curso.
    if (!pendienteAntes) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastSynced = JSON.stringify(pickSlices(store.get()));
    }
  } catch (e) {
    lastError = e;
  }
}

export function schedulePersist(store) {
  if (paused || typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushPersist(store);
  }, 450);
}

export async function flushPersist(store) {
  if (paused || typeof window === "undefined") return;
  // H-012: el observador es de solo lectura; no escribe el estado compartido (antes daba 403 en consola).
  // Sin sesión todavía (carga inicial) tampoco hay nada que guardar.
  const roleId = typeof store.session === "function" ? store.session()?.roleId : null;
  if (!roleId || roleId === "observador") return;
  const slices = pickSlices(store.get());
  const body = JSON.stringify(slices);
  if (body === lastSynced) return;
  flushing = true;
  try {
    const res = await apiFetch("/api/app-state", {
      method: "PUT",
      body: JSON.stringify({ slices }),
    });
    if (res.ok) lastSynced = body;
    else {
      const data = await res.json().catch(() => ({}));
      lastError = data.error || res.statusText;
    }
  } catch (e) {
    lastError = e;
  } finally {
    flushing = false;
  }
}

/** Espera a que el hydrate suelte pausePersist y luego escribe app-state. */
export async function flushPersistWhenReady(store, tries = 12) {
  if (typeof window === "undefined") return;
  for (let i = 0; i < tries; i++) {
    if (!paused) {
      await flushPersist(store);
      return;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  await flushPersist(store);
}

export function getPersistError() {
  return lastError;
}
