"use client";

/**
 * H-012 (caso O-02): tablero del observador con datos agregados.
 * Usa /api/people, que para el observador llega sin datos identificables (SPEC-02 FR-02.4),
 * y solo muestra conteos: nunca nombres, teléfonos ni códigos.
 */

import { useEffect, useState } from "react";

type Fila = { terr?: string; status?: string; profile?: string | null };
const RIESGO = ["Mínimo", "Leve", "Moderado", "Moderado-severo", "Severo"];

function contar(filas: Fila[], clave: (f: Fila) => string) {
  const m = new Map<string, number>();
  for (const f of filas) {
    const k = clave(f);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function riesgo(f: Fila) {
  const n = parseInt(String(f.profile || "").slice(1), 10);
  return Number.isFinite(n) && n >= 1 && n <= 15 ? RIESGO[Math.floor((n - 1) / 3)] : "Sin evaluación";
}

function Bloque({ titulo, datos }: { titulo: string; datos: [string, number][] }) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-[16px] border border-linea bg-nara-blanco p-4">
      <h2 className="font-titulos text-lg font-semibold text-nara-tinta">{titulo}</h2>
      <ul className="flex flex-col gap-1.5 font-texto text-[15px] text-nara-tinta">
        {datos.map(([k, v]) => (
          <li key={k} className="flex justify-between gap-3">
            <span className="truncate">{k}</span>
            <span className="font-medium tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ObservadorTablero() {
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/people", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        if (d?.ok && Array.isArray(d.people)) setFilas(d.people);
        else setError("No se pudieron cargar los datos.");
      })
      .catch(() => vivo && setError("No se pudieron cargar los datos."));
    return () => {
      vivo = false;
    };
  }, []);

  if (error) return <p className="font-texto text-sm text-texto-secundario">{error}</p>;
  if (!filas) return <p className="font-texto text-sm text-texto-secundario">Cargando datos del programa…</p>;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3" data-testid="observador-tablero">
      <p className="font-titulos text-2xl font-semibold text-nara-tinta">
        {filas.length} personas en el programa
      </p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Bloque titulo="Por territorio" datos={contar(filas, (f) => f.terr || "Sin territorio")} />
        <Bloque titulo="Por estado" datos={contar(filas, (f) => f.status || "Sin estado")} />
        <Bloque titulo="Por nivel de riesgo" datos={contar(filas, riesgo)} />
      </div>
      <p className="font-texto text-xs text-texto-secundario">Solo datos agregados. No se muestran datos personales.</p>
    </div>
  );
}
