"use client";

/**
 * Estado de ánimo (app paciente) — UI.
 * Tras enviar, no pide otro hasta el próximo periodo (mañana/tarde, semana o mes).
 */
import {
  MOOD_LABELS,
  MOOD_TINTS,
  moodWindowStatusFor,
  saveMoodCheckin,
} from "@/lib/nara-services/mood.js";
import { useNaraStore } from "@/providers/nara-provider";
import { useState } from "react";

export function MoodPanel({ patientId }: { patientId: string }) {
  const store = useNaraStore();
  const [, setBump] = useState(0);
  const [saving, setSaving] = useState(false);

  const status = moodWindowStatusFor(store, patientId);
  const freqInfo = status.freqInfo;
  const showPicker = status.needs && !saving;

  const onPick = (i: number) => {
    if (!status.needs || saving) return;
    setSaving(true);
    saveMoodCheckin(store, patientId, i, {});
    setBump((n) => n + 1);
    void import("@/lib/store/hydrateProgram").then((m) => {
      if (typeof m.pauseLiveHydrate === "function") m.pauseLiveHydrate(8_000);
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-4 font-texto text-nara-tinta">
      <div className="flex flex-col gap-0.5">
        <span className="font-titulos text-[17px] font-semibold">
          ¿Cómo se siente hoy?
        </span>
        <span className="text-[13px] text-texto-secundario">
          {showPicker
            ? `Toque un número · 1 muy mal · 5 muy bien · ${freqInfo.label}`
            : status.nextHint || `Frecuencia: ${freqInfo.label}`}
        </span>
      </div>

      {showPicker ? (
        <div className="grid grid-cols-5 gap-1.5">
          {MOOD_LABELS.map((label, i) => {
            const tint = MOOD_TINTS[i];
            return (
              <button
                key={label}
                type="button"
                onClick={() => onPick(i)}
                disabled={saving}
                aria-label={`${i + 1}: ${label}`}
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-0.5 py-2.5 transition-transform active:scale-95 disabled:opacity-60"
                style={{
                  borderColor: tint.bd,
                  background: tint.bg,
                  color: "#161413",
                }}
              >
                <span className="text-xl font-semibold leading-none">{i + 1}</span>
                <span className="text-[11px] leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      ) : status.last ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-linea bg-superficie-2 px-3 py-2.5">
            <span className="font-titulos text-[15px] font-semibold">
              Registrado: {status.last.label}
            </span>
            <span className="text-[13px] text-texto-secundario">
              ({status.last.value}/5) · {status.last.when}
            </span>
          </div>
          <span className="text-center text-[12px] text-texto-secundario">
            {status.nextHint}
          </span>
        </div>
      ) : (
        <span className="text-[13px] text-texto-secundario">
          Listo para su primer registro.
        </span>
      )}
    </div>
  );
}
