/** Persistencia automática del AlientoStore → Mongo (/api/app-state → nara-api). */

import { APP_STATE_SLICES } from "@/lib/db/appState";
import { apiFetch } from "@/lib/api/client";

let paused = true;
let timer = null;
let lastError = null;

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

export async function hydrateAppState(store) {
  try {
    const res = await apiFetch("/api/app-state");
    const data = await res.json();
    if (!res.ok || !data.ok || !data.slices) return;
    const slices = data.slices;
    store.set((s) => {
      Object.keys(slices).forEach((k) => {
        if (slices[k] !== undefined) s[k] = slices[k];
      });
    });
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
  try {
    const slices = pickSlices(store.get());
    const res = await apiFetch("/api/app-state", {
      method: "PUT",
      body: JSON.stringify({ slices }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      lastError = data.error || res.statusText;
    }
  } catch (e) {
    lastError = e;
  }
}

export function getPersistError() {
  return lastError;
}
