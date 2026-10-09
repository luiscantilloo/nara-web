"use client";
import { useEffect, useState } from "react";
import { naraAsset } from "@/modules/paciente/app/naraAsset";
import { hora12, larga } from "@/modules/clinico/herramientas/tools/clin/fechas";
import { calificarCita, misCitas, type MisCitas } from "./acciones";

/** Psicólogo clínico — solo `tools/clin/`. Próxima cita y calificación de la última realizada. */
export function ClinPanel({ patientId }: { patientId: string }) {
  const [datos, setDatos] = useState<MisCitas | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    misCitas().then((r) => (r.ok ? setDatos(r.data) : setError(r.error)));
  }, [patientId]);

  const titulo = <h2 className="m-0 font-titulos text-xl font-semibold">Psicólogo clínico</h2>;
  if (!datos)
    return (
      <div className="flex flex-1 flex-col gap-3 px-4 py-6 font-texto text-nara-tinta">
        {titulo}
        <p className={`m-0 text-[15px] ${error ? "text-crisis-texto" : "text-texto-secundario"}`} role="status">{error || "Cargando sus citas…"}</p>
      </div>
    );

  if (!datos.activo)
    return (
      <div className="flex flex-1 flex-col gap-3 px-4 py-6 font-texto text-nara-tinta">
        {titulo}
        <p className="m-0 rounded-[16px] border border-dashed border-linea px-5 py-4 text-sm text-texto-secundario">Su ruta no incluye citas con psicólogo por ahora.</p>
      </div>
    );

  const citas = datos.citas;
  const prox = citas.find((c) => !c.hecha && c.fecha >= datos.hoy) || null;
  const ult = citas.filter((c) => c.hecha).pop() || null;

  const calificar = async (v: number) => {
    if (!ult) return;
    setGuardando(true);
    const r = await calificarCita(ult.id, ult.rp === v ? null : v);
    setGuardando(false);
    if (!r.ok) return setError(r.error);
    setError("");
    setDatos((d) => (d ? { ...d, citas: d.citas.map((c) => (c.id === r.data.id ? r.data : c)) } : d));
  };

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 font-texto text-nara-tinta">
      {titulo}
      <section className="overflow-hidden rounded-[24px] border border-linea bg-nara-blanco" aria-label="Su psicóloga">
        <div className="flex items-center gap-4 bg-nara-calma px-5 py-5">
          <img src={naraAsset("marca/personajes/nara-calma.svg")} alt="" className="h-16 w-auto" />
          <div>
            <p className="m-0 text-sm text-nara-tinta/75">Su próxima cita con {datos.clinico}</p>
            {prox ? (
              <>
                <p className="m-0 mt-0.5 font-titulos text-[24px] font-semibold leading-tight first-letter:uppercase">{larga(prox.fecha)}</p>
                <p className="m-0 mt-0.5 text-[15px] [font-variant-numeric:tabular-nums]">
                  {hora12(prox.hora)} · {prox.canal}
                </p>
              </>
            ) : (
              <>
                <p className="m-0 mt-0.5 font-titulos text-[20px] font-semibold leading-tight">Todavía no tiene cita</p>
                <p className="m-0 mt-0.5 text-sm text-nara-tinta/75">Su psicóloga le avisará la fecha.</p>
              </>
            )}
          </div>
        </div>
        <div className="px-5 py-5">
          {ult ? (
            <>
              <p className="m-0 font-medium">¿Cómo le fue en su cita del {larga(ult.fecha)}?</p>
              <p className="m-0 mt-0.5 text-sm text-texto-secundario">1 es muy mal y 5 es muy bien.</p>
              <div role="radiogroup" aria-label="Calificación de la cita" className="mt-3 grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = ult.rp === n;
                  return (
                    <button key={n} type="button" role="radio" aria-checked={on} disabled={guardando} onClick={() => calificar(n)}
                      className={`h-11 cursor-pointer rounded-[10px] border-[1.5px] text-[15px] font-semibold [font-variant-numeric:tabular-nums] hover:border-nara-tinta disabled:cursor-wait ${on ? "border-nara-tinta bg-nara-tinta text-nara-blanco" : "border-linea bg-nara-blanco"}`}>
                      {n}
                    </button>
                  );
                })}
              </div>
              <p className={`m-0 mt-2 text-sm ${error ? "text-crisis-texto" : ult.rp ? "text-estado-al-dia" : "text-texto-secundario"}`}>
                {error || (ult.rp ? "Gracias. Su psicóloga ya puede ver su calificación." : "Su respuesta le ayuda a su psicóloga a preparar la próxima cita.")}
              </p>
            </>
          ) : (
            <>
              <p className="m-0 font-medium">Después de cada cita le preguntaremos cómo le fue</p>
              <p className="m-0 mt-0.5 text-sm text-texto-secundario">
                {prox ? "Podrá calificarla del 1 al 5 cuando su psicóloga la marque como realizada." : "Cuando tenga citas, aquí podrá calificarlas."}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
