"use client";

import { useEffect, useState } from "react";
import { useNaraStore } from "@/providers/nara-provider";
import { ToolCardShell } from "../../ToolCardShell";
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
    <div className="flex flex-col gap-2 sm:col-span-2">
      <ToolCardShell>
        <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
        <span className="text-xs text-texto-secundario">
          {patientName ? `${rows.length} de ${patientName}` : "Sin nombre en la ficha"}
        </span>
      </ToolCardShell>
      <div className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco font-texto text-sm text-nara-tinta">
        <div className="grid grid-cols-[minmax(8rem,1.1fr)_minmax(0,2fr)_5.5rem] gap-2 border-b border-linea px-3 py-2 text-xs font-medium text-texto-secundario">
          <span>Fecha</span>
          <span>Resumen</span>
          <span>Estado</span>
        </div>
        {rows.length === 0 ? (
          <p className="m-0 px-3 py-3 text-texto-secundario">
            {patientName
              ? `No hay conversaciones de ${patientName}.`
              : "Esta ficha no tiene nombre de paciente."}
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(8rem,1.1fr)_minmax(0,2fr)_5.5rem] gap-2 border-b border-linea px-3 py-2 last:border-b-0"
            >
              <span className="text-xs text-texto-secundario">{row.fecha}</span>
              <p className="m-0 leading-snug">{row.resumen}</p>
              <span className="text-xs font-medium">{estadoLabel(row.estadoMental)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
