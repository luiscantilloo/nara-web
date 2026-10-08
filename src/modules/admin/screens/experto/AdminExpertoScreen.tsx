"use client";

import { Suspense } from "react";
import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { useAdminExpertoScreen } from "./useAdminExpertoScreen";

function AdminExpertoInner() {
  const { v } = useAdminExpertoScreen();

  if (!v) {
    return <NaraLoadingScreen />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Experto"
      open={!!v.agentOpen}
      drawerWidth={String(v.drawerW || "480px")}
      onClose={() => v.closeAgent()}
      className="bg-nara-crema font-texto text-nara-tinta"
      drawer={
        <AgentPanel
          role="admin"
          mode="drawer"
          initialAsk={String(v.pendingAsk || "")}
          context="team"
          contextLabel={"Sobre: " + v.name}
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
          active="team"
          onOpenAgent={() => v.openAgent()}
          agentOpen={!!v.agentOpen}
        />
      }
    >
      <div className="nara-page flex flex-col gap-4 md:gap-[18px]">
        <div className="nara-page-head gap-3">
        <button
          type="button"
          onClick={() => v.back()}
          className="w-fit cursor-pointer border-none bg-transparent p-0 font-texto text-[15px] font-medium text-nara-tinta"
        >
          ← Equipos de campo
        </button>

        <NaraMsgAlert msg={v.msg} onClear={() => v.clearMsg()} />

        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold">
              {v.name}
            </h1>
            <p className="text-texto-secundario">
              {v.terr} · {v.phone}
              {v.tablet ? ` · Tablet ${v.tablet}` : " · Sin tablet"}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: v.sc }} />
            {v.status}
          </span>
        </header>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {v.kpis.map((k) => (
            <article
              key={k.label}
              className="flex flex-col gap-1.5 rounded-2xl border border-linea bg-nara-blanco px-[18px] py-4"
            >
              <span className="text-sm text-texto-secundario">{k.label}</span>
              <span className="font-titulos text-[28px] font-semibold leading-tight">{k.val}</span>
              <span className="text-sm text-texto-secundario">{k.sub}</span>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="flex flex-col gap-3 rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="font-titulos text-xl font-semibold">Datos</h2>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-texto-secundario">Capacitación</span>
              <span className="text-[15px]">{v.training}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-texto-secundario">Territorio</span>
              <div className="flex flex-wrap gap-2">
                {v.terrNames.length ? (
                  v.terrNames.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => v.setTerr(t)}
                      className={`h-10 cursor-pointer rounded-[9px] border-[1.5px] px-3.5 font-texto text-[15px] ${
                        t === v.terr
                          ? "border-nara-tinta bg-[#FFF4CC] font-medium"
                          : "border-linea bg-nara-blanco"
                      }`}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <span className="text-[15px] text-texto-secundario">Sin territorios creados.</span>
                )}
              </div>
            </div>
          </article>

          <article className="flex flex-col gap-3 rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="font-titulos text-xl font-semibold">Acciones</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => v.toggleActive()}
                className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 font-texto text-[15px] font-medium"
              >
                {v.active ? "Desactivar experto" : "Activar experto"}
              </button>
              {v.training === "Pendiente" ? (
                <button
                  type="button"
                  onClick={() => v.completeTraining()}
                  className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-4 font-texto text-[15px] font-medium"
                >
                  Marcar capacitación completa
                </button>
              ) : null}
              {!v.tablet ? (
                <button
                  type="button"
                  onClick={() => v.assignTablet()}
                  className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-tinta px-4 font-texto text-[15px] font-medium text-nara-blanco"
                >
                  Asignar tablet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => v.goAssets()}
                  className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] font-medium"
                >
                  Ver en Activos
                </button>
              )}
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco">
          <div className="flex items-baseline justify-between gap-3 px-5 py-3.5">
            <h2 className="font-titulos text-xl font-semibold">Personas asignadas</h2>
            <span className="text-sm text-texto-secundario">{v.people.length}</span>
          </div>
          {v.noPeople ? (
            <p className="border-t border-[#E6E1D9] px-5 py-4 text-[15px] text-texto-secundario">
              Aún no tiene personas. Aparecerán cuando registre visitas de campo.
            </p>
          ) : (
            <div className="nara-scroll-x">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr] gap-3 bg-nara-crema px-5 py-3 text-sm font-medium text-texto-secundario">
                  <span>Código</span>
                  <span>Nombre</span>
                  <span>Lugar</span>
                  <span>Perfil</span>
                  <span>Estado</span>
                </div>
                {v.people.map((p) => (
                  <button
                    key={p.code + p.name}
                    type="button"
                    onClick={() => p.open()}
                    className="grid w-full cursor-pointer grid-cols-[1fr_1.2fr_1fr_1fr_1fr] gap-3 border-t border-[#E6E1D9] bg-nara-blanco px-5 py-3 text-left font-texto text-[15px] text-nara-tinta"
                  >
                    <span className="font-medium">{p.code}</span>
                    <span>{p.name}</span>
                    <span>{p.place}</span>
                    <span>{p.profile}</span>
                    <span>{p.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco">
          <div className="px-5 py-3.5">
            <h2 className="font-titulos text-xl font-semibold">Visitas marcadas</h2>
          </div>
          {v.noFlags ? (
            <p className="border-t border-[#E6E1D9] px-5 py-4 text-[15px] text-texto-secundario">
              Sin visitas marcadas por control de calidad.
            </p>
          ) : (
            <ul className="flex flex-col border-t border-[#E6E1D9]">
              {v.flags.map((f) => (
                <li key={f.key} className="flex flex-col gap-1 border-b border-[#E6E1D9] px-5 py-3 last:border-none">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{f.person}</span>
                    <span className="text-sm text-texto-secundario">{f.when} · {f.status}</span>
                  </div>
                  {f.reasons.map((r) => (
                    <span key={r} className="text-sm text-texto-secundario">
                      · {r}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AgentDrawerShell>
  );
}

export function AdminExpertoScreen() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminExpertoInner />
    </Suspense>
  );
}
