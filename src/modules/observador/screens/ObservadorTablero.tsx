"use client";

/**
 * Tablero del observador (caso O-02). H-004 (TRL 2026-10-10): /api/people le entrega al observador
 * solo un resumen agregado; los grupos con menos personas que `minGrupo` llegan en null y se muestran
 * como «menos de N» para que nadie sea reidentificable.
 */

import { useEffect, useState } from "react";

type Conteos = Record<string, number | null>;
type Resumen = {
  total: number;
  minGrupo: number;
  porTerritorio: Conteos;
  porEstado: Conteos;
  porRiesgo: Conteos;
};

function Bloque({ titulo, datos, minGrupo }: { titulo: string; datos: Conteos; minGrupo: number }) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-[16px] border border-linea bg-nara-blanco p-4">
      <h2 className="font-titulos text-lg font-semibold text-nara-tinta">{titulo}</h2>
      <ul className="flex flex-col gap-1.5 font-texto text-[15px] text-nara-tinta">
        {Object.entries(datos).map(([k, v]) => (
          <li key={k} className="flex justify-between gap-3">
            <span className="truncate">{k}</span>
            <span className="font-medium tabular-nums">{v === null ? `menos de ${minGrupo}` : v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ObservadorTablero() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/people", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        if (d?.ok && d.summary) setResumen(d.summary as Resumen);
        else setError("No se pudieron cargar los datos.");
      })
      .catch(() => vivo && setError("No se pudieron cargar los datos."));
    return () => {
      vivo = false;
    };
  }, []);

  if (error) return <p className="font-texto text-sm text-texto-secundario">{error}</p>;
  if (!resumen) return <p className="font-texto text-sm text-texto-secundario">Cargando datos del programa…</p>;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3" data-testid="observador-tablero">
      <p className="font-titulos text-2xl font-semibold text-nara-tinta">
        {resumen.total.toLocaleString("es-CO")} personas en el programa
      </p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Bloque titulo="Por territorio" datos={resumen.porTerritorio} minGrupo={resumen.minGrupo} />
        <Bloque titulo="Por estado" datos={resumen.porEstado} minGrupo={resumen.minGrupo} />
        <Bloque titulo="Por nivel de riesgo" datos={resumen.porRiesgo} minGrupo={resumen.minGrupo} />
      </div>
      <p className="font-texto text-xs text-texto-secundario">Solo datos agregados. No se muestran datos personales.</p>
    </div>
  );
}
