"use client";

import { Suspense } from "react";
import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { useAdminPersonaScreen } from "./useAdminPersonaScreen";

function AdminPersonaInner() {
  const { v } = useAdminPersonaScreen();

  if (!v?.ready) {
    return <div className="min-h-screen bg-nara-crema font-texto" />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Persona"
      open={!!v.agentOpen}
      drawerWidth="480px"
      onClose={() => v.closeAgent()}
      className="bg-nara-crema font-texto text-nara-tinta"
      drawer={
        <AgentPanel
          role="admin"
          mode="drawer"
          context="people"
          contextLabel={"Sobre: " + (v.code || "Persona")}
          onClose={() => v.closeAgent()}
          style={{
            flex: 1,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        />
      }
      header={
        <AdminTopbar
          active="people"
          onOpenAgent={() => v.openAgent()}
          agentOpen={!!v.agentOpen}
        />
      }
    >
      <div className="nara-page flex flex-col gap-4 md:gap-5">
        <NaraMsgAlert msg={v.msg} onClear={() => v.clearMsg()} />
        <NaraMsgAlert msg={v.err} onClear={() => v.clearErr()} options={{ icon: "warning" }} />

        <PageHead>
          <div className="flex w-full min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => v.back()}
                className="self-start border-none bg-transparent p-0 font-texto text-sm text-texto-secundario underline"
              >
                ← Personas
              </button>
              <span className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold text-nara-tinta">
                {v.missing ? "Persona no encontrada" : v.showName ? v.name : v.code}
              </span>
              <span className="text-[15px] text-texto-secundario">
                {v.missing
                  ? `No hay ficha con código «${v.code}».`
                  : `${v.code} · ${v.profile} · ${v.status}`}
              </span>
            </div>
            {!v.missing ? (
              <span
                className="inline-flex items-center gap-2 rounded-lg border border-linea bg-nara-blanco px-3 py-1.5 text-sm font-medium"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: v.riskColor }}
                />
                {v.riskLabel} · digital {String(v.digLabel || "").toLowerCase()}
              </span>
            ) : null}
          </div>
        </PageHead>

        {v.missing ? (
          <div className="rounded-[20px] border border-linea bg-nara-blanco p-5">
            <p className="text-[15px] text-texto-secundario">
              Vuelva al listado o busque otro código. Si acaba de migrar datos, recargue la página.
            </p>
            <button
              type="button"
              onClick={() => v.back()}
              className="mt-4 h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta"
            >
              Volver a Personas
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Territorio", val: v.terr },
                { label: "Vereda o barrio", val: v.place },
                { label: "Edad", val: String(v.age) },
                { label: "Avance", val: v.prog },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex flex-col gap-1.5 rounded-[20px] border border-linea bg-nara-blanco px-[18px] py-4"
                >
                  <span className="text-sm text-texto-secundario">{k.label}</span>
                  <span className="font-titulos text-xl font-semibold leading-tight">{k.val}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-5">
                <h2 className="font-titulos text-lg font-semibold">Datos de la ficha</h2>
                <dl className="flex flex-col gap-2.5 text-sm">
                  {[
                    ["Código", v.code],
                    ["Id interno", v.id],
                    v.showName ? ["Nombre", v.name] : null,
                    ["Correo", v.email],
                    ["Teléfono", v.phone],
                    ["Experto", v.expert],
                    ["Clínico", v.clin],
                    v.sexo ? ["Sexo", v.sexo] : null,
                    v.genero ? ["Género", v.genero] : null,
                    v.estadoCivil ? ["Estado civil", v.estadoCivil] : null,
                    v.estrato ? ["Estrato", v.estrato] : null,
                    v.source ? ["Origen", v.source] : null,
                  ]
                    .filter(Boolean)
                    .map((row) => {
                      const [dt, dd] = row as [string, string];
                      return (
                        <div key={dt} className="grid grid-cols-[120px_minmax(0,1fr)] gap-2 border-t border-[#F0ECE6] pt-2 first:border-0 first:pt-0">
                          <dt className="text-texto-secundario">{dt}</dt>
                          <dd className="min-w-0 break-words font-medium">{dd || "—"}</dd>
                        </div>
                      );
                    })}
                </dl>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E6E1D9]">
                    <div
                      className="h-full rounded-full bg-nara-tinta"
                      style={{ width: v.pct }}
                    />
                  </div>
                  <span className="text-xs text-texto-secundario whitespace-nowrap">{v.pct}</span>
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-5">
                <div className="flex flex-col gap-1">
                  <h2 className="font-titulos text-lg font-semibold">Módulos de la app</h2>
                  <p className="text-sm text-texto-secundario">
                    Como administrador usted decide qué ofrece el programa (verde = activo). Lo que
                    desactive aquí no aparece en la app del paciente. Si está activo y la persona lo
                    ocultó en su perfil, verá la etiqueta «oculto por la persona».
                  </p>
                </div>
                {v.modules?.map((m: {
                  key: string;
                  name: string;
                  desc: string;
                  swBg: string;
                  x: string;
                  on: boolean;
                  patientHid: boolean;
                  toggle: () => void;
                }) => (
                  <button
                    key={m.key}
                    type="button"
                    disabled={v.saving}
                    onClick={() => m.toggle()}
                    className="grid cursor-pointer grid-cols-[52px_minmax(0,1fr)] items-center gap-2.5 border-t border-[#F0ECE6] py-2 text-left disabled:opacity-60"
                  >
                    <span
                      className="relative h-[26px] w-11 rounded-full"
                      style={{ background: m.swBg }}
                    >
                      <span
                        className="absolute top-[3px] h-5 w-5 rounded-full bg-white"
                        style={{ left: m.x }}
                      />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {m.name}
                        {m.patientHid ? (
                          <span className="ml-2 text-xs font-normal text-texto-secundario">
                            (oculto por la persona)
                          </span>
                        ) : !m.on ? (
                          <span className="ml-2 text-xs font-normal text-texto-secundario">
                            (desactivado por el programa)
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-texto-secundario">{m.desc}</span>
                    </span>
                  </button>
                ))}
              </section>
            </div>
          </>
        )}
      </div>
    </AgentDrawerShell>
  );
}

export function AdminPersonaScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-nara-crema" />}>
      <AdminPersonaInner />
    </Suspense>
  );
}
