"use client";
import { useCallback, useEffect, useState } from "react";
import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";
import { listarAgenda } from "./acciones";
import { AgendaModal } from "./AgendaModal";
import { hora12, larga } from "./fechas";
import { Ico } from "./iconos";
import type { Cita } from "./tipos";

/** Psicólogo clínico — trabajar solo en `tools/clin/`. Botón que abre la agenda de citas. */
export function ClinToolCard({ item, patientId }: HerramientaCardProps) {
  const [abierta, setAbierta] = useState(false);
  const [prox, setProx] = useState<Cita | null | undefined>(undefined);

  const cargar = useCallback(() => {
    listarAgenda().then((r) => {
      if (!r.ok) return setProx(null);
      const propias = r.data.citas.filter((c) => c.patientId === patientId).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
      setProx(propias.find((c) => !c.hecha && c.fecha >= r.data.hoy) || null);
    });
  }, [patientId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <>
      <ToolCardShell onClick={() => setAbierta(true)}>
        <Ico n="calendario" className="h-7 w-7 text-nara-tinta" />
        <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
        <span className="text-[13px] text-texto-secundario first-letter:uppercase">
          {prox === undefined ? "Cargando…" : prox ? `Próxima cita: ${larga(prox.fecha)}, ${hora12(prox.hora)}` : "Sin cita agendada"}
        </span>
        <span className="mt-1 text-[13px] font-medium underline underline-offset-4">Abrir agenda de citas</span>
      </ToolCardShell>
      {abierta ? (
        <AgendaModal
          patientId={patientId}
          onCerrar={() => {
            setAbierta(false);
            cargar();
          }}
        />
      ) : null}
    </>
  );
}
