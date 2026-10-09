/**
 * Estado de ánimo (app paciente).
 * Desarrollar solo en `tools/mood/`.
 * Por ahora el check-in sigue en Inicio; este panel es el hueco dedicado.
 */
export function MoodPanel({ patientId }: { patientId: string }) {
  void patientId;
  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-6 font-texto text-nara-tinta">
      <h2 className="m-0 font-titulos text-xl font-semibold">Estado de ánimo</h2>
      <p className="m-0 text-[15px] text-texto-secundario">
        Esqueleto: aquí se mostrará el historial / check-in de ánimo del paciente.
      </p>
    </div>
  );
}
