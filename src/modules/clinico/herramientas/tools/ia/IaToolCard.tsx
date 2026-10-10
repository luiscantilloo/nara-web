"use client";

import { useEffect, useState } from "react";
import { useNaraStore } from "@/providers/nara-provider";
import type { HerramientaCardProps } from "../../types";

const STORAGE_PREFIX = "nara.teo.conversations.";

function normName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-CO");
}

function samePatientName(saved: unknown, wanted: string) {
  const left = normName(String(saved || ""));
  return !!left && left === normName(wanted);
}

async function conversationsOf(patientName: string): Promise<Conversation[]> {
  const local: Conversation[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]") as Conversation[];
      if (Array.isArray(parsed)) local.push(...parsed);
    } catch {
      /* fila ilegible */
    }
  }
  let remote: Conversation[] = [];
  try {
    const q = new URLSearchParams({ patientName });
    const res = await fetch(`/api/teo/conversations?${q}`, { credentials: "same-origin" });
    if (res.ok) {
      const data = (await res.json()) as { conversations?: Conversation[] };
      remote = Array.isArray(data.conversations) ? data.conversations : [];
    }
  } catch {
    /* queda el historial local */
  }
  const map = new Map<string, Conversation>();
  for (const row of [...local, ...remote]) {
    if (!samePatientName(row.patientName, patientName)) continue;
    map.set(row.id, row);
  }
  return [...map.values()].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
}

type Conversation = {
  id: string;
  patientName?: string;
  fecha: string;
  resumen: string;
  estadoMental: "bueno" | "malo" | "crisis";
  startedAt: number;
};

function estadoLabel(estado: Conversation["estadoMental"]) {
  if (estado === "crisis") return "Crisis";
  if (estado === "malo") return "Malo";
  return "Bueno";
}

function estadoClass(estado: Conversation["estadoMental"]) {
  if (estado === "crisis") return "bg-nara-rosa text-nara-tinta";
  if (estado === "malo") return "bg-nara-duda text-nara-tinta";
  return "bg-nara-calma text-nara-tinta";
}

/** Acompañante con IA (TEO) — historial de la ficha, solo este paciente. */
export function IaToolCard({ item, patientId }: HerramientaCardProps) {
  const store = useNaraStore();
  const stored = store.PATIENTS?.[patientId] as { name?: string } | undefined;
  const fromState = (store.get()?.patients || {})[patientId] as { name?: string } | undefined;
  const patientName = String(stored?.name || fromState?.name || "").trim();
  const [rows, setRows] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!patientName) {
      setRows([]);
      return;
    }
    let cancelled = false;
    const load = () => {
      void conversationsOf(patientName).then((list) => {
        if (!cancelled) setRows(list);
      });
    };
    load();
    const timer = window.setInterval(load, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [patientName]);

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-linea bg-nara-blanco font-texto text-nara-tinta sm:col-span-2">
      <header className="flex items-center justify-between gap-3 border-b border-linea px-4 py-3">
        <span className="text-[15px] font-medium">{item.name}</span>
        <span className="shrink-0 text-xs text-texto-secundario">
          {patientName ? `${rows.length} de ${patientName}` : "Sin nombre en la ficha"}
        </span>
      </header>
      <div className="hidden border-b border-linea bg-nara-crema px-4 py-2 text-xs font-medium text-texto-secundario sm:grid sm:grid-cols-[11rem_minmax(0,1fr)_5.5rem] sm:gap-3">
        <span>Fecha</span>
        <span>Resumen</span>
        <span>Estado</span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="m-0 px-4 py-4 text-sm text-texto-secundario">
            {patientName
              ? `No hay conversaciones de ${patientName}.`
              : "Esta ficha no tiene nombre de paciente."}
          </p>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className="flex flex-col gap-1.5 border-b border-linea px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)_5.5rem] sm:items-start sm:gap-3"
            >
              <time className="text-xs leading-snug text-texto-secundario">{row.fecha}</time>
              <p className="m-0 text-sm leading-snug">{row.resumen}</p>
              <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${estadoClass(row.estadoMental)}`}>
                {estadoLabel(row.estadoMental)}
              </span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
