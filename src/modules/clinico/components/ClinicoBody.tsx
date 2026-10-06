// @ts-nocheck
"use client";

import Link from "next/link";
import { IoClose } from "react-icons/io5";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { RoleNav } from "@/components/shared/role-nav/RoleNav";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";

export function ClinicoTopbar({ v }: { v: Record<string, unknown> }) {
  const navItems = (
    (v.nav as { key?: string; label: string; active?: boolean; go: () => void }[] | undefined) || []
  ).map((n, i) => ({
    key: n.key || String(i) + n.label,
    label: n.label,
    active: !!n.active,
    onClick: () => n.go?.(),
  }));

  return (
    <div className="box-border flex h-16 shrink-0 items-center justify-between gap-3 border-b border-linea bg-nara-blanco px-3 sm:gap-5 sm:px-6 md:px-8">
        <div className="flex h-full min-w-0 flex-1 items-stretch gap-3 sm:gap-6">
          <Link
            href="/clinico"
            className="flex shrink-0 items-center gap-2 text-nara-tinta"
          >
            <img
              src="/nara/marca/logo/nara-logo.svg"
              alt="NARA"
              className="block h-7 w-auto sm:h-[34px]"
            />
          </Link>
          <RoleNav items={navItems} />
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-3.5 md:gap-4">
          <div
            className="hidden max-w-[160px] truncate sm:flex md:max-w-none"
            style={{
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              border: `1.5px solid ${v.critBd}`,
              background: v.critBg as string,
              fontWeight: 500,
              color: v.critFg as string,
              fontSize: 13,
            }}
          >
            {v.critText as string}
          </div>
          <button
            type="button"
            onClick={() => (v.openAgent as () => void)?.()}
            aria-label="Abrir TEO"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-nara-tinta bg-nara-blanco px-2.5 font-texto text-sm font-medium text-nara-tinta sm:h-11 sm:px-4 sm:text-[15px]"
          >
            <img
              src="/nara/marca/logo/teo-isotipo.svg"
              alt=""
              className="block h-7 w-7 sm:-ml-2 sm:h-8 sm:w-8"
            />
            <span className="hidden sm:inline">TEO</span>
          </button>
          <UserMenu notifKey="clin" />
          {v.dev ? (
            <span
              style={{
                fontFamily: "ui-monospace,Menlo,monospace",
                fontSize: 11,
                color: "#5E5750",
                border: "1px solid #DCD6CD",
                padding: "2px 6px",
                borderRadius: 5,
              }}
            >
              {v.screenCode as string}
            </span>
          ) : null}
        </div>
    </div>
  );
}

export function ClinicoBody({ v }: { v: Record<string, unknown> }) {
  const as = (v.as as Record<string, unknown>) || {};
  const f = (v.f as Record<string, unknown>) || {};
  const rec = (f.rec as Record<string, unknown>) || {};

  return (
    <div
      data-screen-label="Clínico"
      className="min-w-0 w-full bg-nara-crema font-texto text-[15px] text-nara-tinta"
    >
      <div className="nara-page">
        <NaraMsgAlert
          msg={v.msg as string | undefined}
          onClear={() => (v.clearMsg as () => void)?.()}
        />
        {v.isHome ? (
          <div className="nara-home-grid">
            <div className="nara-home-main">
              <AgentPanel
                role="clin"
                mode="home"
                onAction={v.agentAction as (a: string, p: unknown) => void}
                onOpenDrawer={v.askFromHome as (q: string) => void}
                style={{ flex: 1, minWidth: 0, width: "100%" }}
              />
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => (v.goAlerts as () => void)?.()}
                style={{
                  fontFamily: "Figtree,system-ui,sans-serif",
                  textAlign: "left",
                  background: "#fff",
                  border: `1.5px solid ${v.critBd}`,
                  borderRadius: 16,
                  padding: "18px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  cursor: "pointer",
                  color: "#161413",
                  whiteSpace: "normal",
                }}
              >
                <span style={{ fontWeight: 500 }}>Alertas</span>
                <span style={{ fontSize: 14, color: v.critFg as string, fontWeight: 500 }}>
                  {v.critText as string}
                </span>
                <span style={{ fontSize: 13, color: "#5E5750" }}>
                  {v.openCount as number} abiertas en la cola
                </span>
              </button>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #DCD6CD",
                  borderRadius: 20,
                  padding: "18px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <span style={{ fontWeight: 500 }}>Próximas sesiones</span>
                {(v.upcoming as { name: string; next: string; open: () => void }[] | undefined)?.map(
                  (u, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => u.open?.()}
                      style={{
                        fontFamily: "Figtree,system-ui,sans-serif",
                        textAlign: "left",
                        border: "none",
                        borderTop: "1px solid #E6E1D9",
                        background: "none",
                        padding: "8px 0 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        cursor: "pointer",
                        color: "#161413",
                        whiteSpace: "normal",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                      <span style={{ fontSize: 13, color: "#5E5750" }}>{u.next}</span>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        ) : null}

        {v.asOpen ? (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4"
            role="presentation"
          >
            <div
              className="absolute inset-0 bg-[rgba(22,20,19,.45)]"
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Asignar recurso"
              className="relative z-[1] flex max-h-[min(92vh,880px)] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[20px] border border-linea bg-nara-blanco shadow-[0_20px_50px_rgba(22,20,19,.3)] sm:rounded-[20px]"
            >
              <header className="flex shrink-0 flex-col gap-3 border-b border-linea px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 font-titulos text-xl font-semibold text-nara-tinta sm:text-[22px]">
                    Asignar recurso · {as.name as string}
                  </h2>
                  <button
                    type="button"
                    onClick={() => (as.close as () => void)?.()}
                    aria-label="Cerrar"
                    className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-nara-tinta"
                  >
                    <IoClose size={22} aria-hidden />
                  </button>
                </div>
                <div className="nara-form-grid-4 gap-2.5">
                  <input
                    value={(as.q as string) || ""}
                    onChange={as.setQ as (e: React.ChangeEvent<HTMLInputElement>) => void}
                    placeholder="Buscar por título o tema"
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none"
                  />
                  <select
                    value={(as.tipo as string) || ""}
                    onChange={as.setTipo as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta outline-none"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="cuento">Cuentos</option>
                    <option value="curso">Cursos</option>
                    <option value="video">Videos</option>
                    <option value="tecnica">Técnicas</option>
                  </select>
                  <select
                    value={(as.tema as string) || ""}
                    onChange={as.setTema as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta outline-none"
                  >
                    <option value="">Todos los temas</option>
                    {(as.temas as string[] | undefined)?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <select
                    value={(as.para as string) || ""}
                    onChange={as.setPara as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta outline-none"
                  >
                    <option value="">Para quién</option>
                    <option>Todos</option>
                    <option>Adultos</option>
                    <option>60+</option>
                    <option>Familias</option>
                  </select>
                </div>
              </header>

              <div className="nara-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
                {as.confirming ? (
                  <div className="mb-4 flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-crisis bg-crisis-suave p-4">
                    <span className="font-semibold text-crisis-texto">{as.cTag as string}</span>
                    <span className="leading-relaxed">
                      «{as.cTitle as string}» {as.cWarn as string}
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => (as.confirm as () => void)?.()}
                        className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-[18px] font-texto text-[15px] font-medium text-nara-tinta"
                      >
                        Lo trabajaré en sesión
                      </button>
                      <button
                        type="button"
                        onClick={() => (as.cancel as () => void)?.()}
                        className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
                <NaraMsgAlert
                  msg={as.msg as string}
                  onClear={() => (as.clearMsg as () => void)?.()}
                />
                <div className="flex flex-col">
                  {(
                    as.items as {
                      title: string;
                      meta: string;
                      hasCover: boolean;
                      cover: string;
                      hasTag: boolean;
                      tag: string;
                      tagBg: string;
                      pick: () => void;
                    }[]
                  )?.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-t border-[#E6E1D9] py-2.5"
                    >
                      {it.hasCover ? (
                        <img
                          src={it.cover}
                          alt=""
                          className="h-[52px] w-10 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{it.title}</span>
                          {it.hasTag ? (
                            <span
                              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-nara-tinta"
                              style={{ background: it.tagBg }}
                            >
                              {it.tag}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[13px] text-texto-secundario">{it.meta}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => it.pick?.()}
                        className="h-11 shrink-0 cursor-pointer rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
                      >
                        Asignar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {v.isAlerts ? (
          <div className="nara-split-panel" style={{ gap: 24, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="nara-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                    fontWeight: 600,
                    fontSize: 28,
                  }}
                >
                  Alertas
                </span>
                <span style={{ color: "#5E5750" }}>
                  Una sola cola: visitas, TEO, manillas, sesiones, botón de ayuda y WhatsApp
                </span>
              </div>
              {(v.alerts as Record<string, unknown>[] | undefined)?.map((a, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    border: `1.5px solid ${a.bd}`,
                    borderRadius: 14,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: a.shadow as string,
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span
                      style={{
                        flex: "none",
                        fontSize: 13,
                        fontWeight: 500,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: a.tagBg as string,
                        color: a.tagFg as string,
                      }}
                    >
                      {a.sevLabel as string}
                    </span>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "baseline",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: 17, fontWeight: 500 }}>{a.name as string}</span>
                        <span style={{ color: "#5E5750" }}>
                          {a.age as number} años · {a.place as string}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: 5,
                            border: "1px solid #DCD6CD",
                          }}
                        >
                          {a.profile as string}
                        </span>
                      </div>
                      <span style={{ fontSize: 16, lineHeight: 1.45 }}>{a.what as string}</span>
                      <span style={{ color: "#5E5750" }}>{a.source as string}</span>
                    </div>
                    <div
                      style={{
                        flex: "none",
                        textAlign: "right",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        alignItems: "flex-end",
                      }}
                    >
                      <span style={{ color: "#5E5750" }}>{a.ago as string}</span>
                      <span style={{ fontWeight: 500, color: a.cdFg as string }}>{a.cd as string}</span>
                    </div>
                  </div>
                  {a.canTake ? (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => (a.take as () => void)?.()}
                        style={{
                          fontFamily: "Figtree,system-ui,sans-serif",
                          fontSize: 16,
                          fontWeight: 500,
                          height: 48,
                          padding: "0 24px",
                          borderRadius: 10,
                          border: "none",
                          background: "#B42318",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Tomar caso
                      </button>
                    </div>
                  ) : null}
                  {a.isOther ? (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span
                        style={{
                          fontWeight: 500,
                          padding: "8px 14px",
                          borderRadius: 8,
                          background: "#F0ECE6",
                        }}
                      >
                        En atención · {a.takenBy as string}
                      </span>
                    </div>
                  ) : null}
                  {a.isMine ? (
                    <div
                      className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:gap-[18px]"
                      style={{
                        borderTop: "1px solid #E6E1D9",
                        paddingTop: 14,
                        alignItems: "start",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ color: "#5E5750" }}>En atención por usted · teléfono</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 500,
                              userSelect: "all",
                              letterSpacing: ".02em",
                            }}
                          >
                            {a.phone as string}
                          </span>
                          <button
                            type="button"
                            onClick={() => (a.copy as () => void)?.()}
                            style={{
                              fontFamily: "Figtree,system-ui,sans-serif",
                              fontSize: 13,
                              border: "1px solid #DCD6CD",
                              background: "#fff",
                              borderRadius: 6,
                              padding: "4px 8px",
                              cursor: "pointer",
                            }}
                          >
                            {a.copyLabel as string}
                          </button>
                        </div>
                        <span style={{ color: "#161413" }}>{a.retryText as string}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(
                          a.outcomes as { label: string; bd: string; dot: string; pick: () => void }[]
                        )?.map((o, j) => (
                          <div
                            key={j}
                            role="button"
                            tabIndex={0}
                            onClick={() => o.pick?.()}
                            onKeyDown={(e) => e.key === "Enter" && o.pick?.()}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              minHeight: 42,
                              padding: "0 12px",
                              border: `1.5px solid ${o.bd}`,
                              borderRadius: 9,
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: `2px solid ${o.bd}`,
                                background: o.dot,
                                boxSizing: "border-box",
                              }}
                            />
                            {o.label}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => (a.close as () => void)?.()}
                        style={{
                          fontFamily: "Figtree,system-ui,sans-serif",
                          fontSize: 15,
                          fontWeight: 500,
                          height: 46,
                          padding: "0 20px",
                          borderRadius: 14,
                          border: "none",
                          background: "#FDCD22",
                          color: "#161413",
                          cursor: "pointer",
                        }}
                      >
                        {a.closeLabel as string}
                      </button>
                    </div>
                  ) : null}
                  {a.isInfo ? (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => (a.dismiss as () => void)?.()}
                        style={{
                          fontFamily: "Figtree,system-ui,sans-serif",
                          fontSize: 15,
                          height: 44,
                          padding: "0 16px",
                          borderRadius: 10,
                          border: "1.5px solid #DCD6CD",
                          background: "#fff",
                          color: "#161413",
                          cursor: "pointer",
                        }}
                      >
                        Marcar como vista
                      </button>
                      {a.hasFile ? (
                        <button
                          type="button"
                          onClick={() => (a.open as () => void)?.()}
                          style={{
                            fontFamily: "Figtree,system-ui,sans-serif",
                            fontSize: 15,
                            fontWeight: 500,
                            height: 44,
                            padding: "0 18px",
                            borderRadius: 14,
                            border: "none",
                            background: "#FDCD22",
                            color: "#161413",
                            cursor: "pointer",
                          }}
                        >
                          Abrir ficha
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
              {v.noAlerts ? (
                <div
                  style={{
                    background: "#fff",
                    border: "1px dashed #DCD6CD",
                    borderRadius: 14,
                    padding: 32,
                    textAlign: "center",
                    color: "#5E5750",
                  }}
                >
                  No hay alertas abiertas. Las nuevas aparecen aquí al instante.
                </div>
              ) : null}
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #DCD6CD",
                borderRadius: 20,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "sticky",
                top: 20,
              }}
            >
              <span
                style={{
                  fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                Atendidas hoy
              </span>
              {(v.closed as Record<string, unknown>[] | undefined)?.map((c, i) => (
                <div
                  key={i}
                  style={{
                    borderTop: "1px solid #E6E1D9",
                    paddingTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{c.name as string}</span>
                  <span>{c.outcome as string}</span>
                  <span style={{ fontSize: 13, color: "#5E5750" }}>{c.meta as string}</span>
                  {c.canReopen ? (
                    <button
                      type="button"
                      onClick={() => (c.reopen as () => void)?.()}
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 4,
                        fontFamily: "Figtree,system-ui,sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        height: 38,
                        padding: "0 12px",
                        borderRadius: 9,
                        border: "1.5px solid #161413",
                        background: "#fff",
                        color: "#161413",
                        cursor: "pointer",
                      }}
                    >
                      {c.reopenLabel as string}
                    </button>
                  ) : null}
                </div>
              ))}
              {v.noClosed ? (
                <span style={{ color: "#5E5750" }}>
                  Todavía no ha cerrado alertas hoy. Al cerrar, el resultado se envía al experto de
                  campo.
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {v.isPatients ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="nara-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              <span
                style={{
                  fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                  fontWeight: 600,
                  fontSize: 28,
                }}
              >
                Mis pacientes
              </span>
              <span style={{ color: "#5E5750" }}>
                Datos de identidad visibles solo para su carga de casos
              </span>
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #DCD6CD",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div className="nara-scroll-x">
              <div style={{ minWidth: 980 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0,1.6fr) minmax(0,1.3fr) 90px 170px minmax(0,1.2fr) 110px minmax(0,1.2fr)",
                  gap: 14,
                  padding: "12px 20px",
                  background: "#F0ECE6",
                  color: "#5E5750",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <span>Paciente</span>
                <span>Lugar</span>
                <span>Perfil</span>
                <span>PHQ-9</span>
                <span>Próxima sesión</span>
                <span>Adherencia</span>
                <span>Última señal</span>
              </div>
              {(v.patients as Record<string, unknown>[] | undefined)?.map((p, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => (p.open as () => void)?.()}
                  onKeyDown={(e) => e.key === "Enter" && (p.open as () => void)?.()}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0,1.6fr) minmax(0,1.3fr) 90px 170px minmax(0,1.2fr) 110px minmax(0,1.2fr)",
                    gap: 14,
                    padding: "14px 20px",
                    borderTop: "1px solid #E6E1D9",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FAF8F5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "";
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 500 }}>{p.name as string}</span>
                    <span style={{ fontSize: 13, color: "#5E5750" }}>{p.age as number} años</span>
                  </div>
                  <span>{p.place as string}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 2,
                        background: p.rc as string,
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>{p.profile as string}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="90" height="28" viewBox="0 0 90 28">
                      <polyline
                        points={p.spark as string}
                        fill="none"
                        stroke="#161413"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span style={{ fontWeight: 500 }}>{p.last as number}</span>
                  </div>
                  <span>{p.next as string}</span>
                  <span>{p.adh as string}</span>
                  <span style={{ fontWeight: 500, color: p.sigFg as string }}>{p.signal as string}</span>
                </div>
              ))}
              </div>
              </div>
            </div>
          </div>
        ) : null}

        {v.isApprovals ? (
          <div className="flex max-w-[880px] flex-col gap-6">
            <button
              type="button"
              onClick={() => (v.goHome as () => void)?.()}
              className="w-fit cursor-pointer border-none bg-transparent p-0 font-texto text-[15px] font-medium text-nara-tinta"
            >
              ← Volver a Inicio
            </button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="font-titulos text-[clamp(26px,4vw,32px)] font-semibold tracking-tight text-nara-tinta">
                  Aprobaciones
                </span>
                <span className="max-w-[36rem] text-[15px] leading-snug text-texto-secundario">
                  Revise los cambios de rutas y reglas enviados por administración. Al aprobar, aplican al programa.
                </span>
              </div>
              <img
                src="/nara/marca/personajes/nara-curiosidad.svg"
                alt=""
                className="hidden h-14 w-auto shrink-0 sm:block"
              />
            </div>
            {v.msg ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-linea bg-exito-suave px-4 py-3 font-texto text-[15px] text-nara-tinta">
                <span>{v.msg as string}</span>
                <button
                  type="button"
                  onClick={() => (v.clearMsg as () => void)?.()}
                  className="cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-nara-tinta underline"
                >
                  Cerrar
                </button>
              </div>
            ) : null}
            {(
              v.approvals as
                | {
                    kind?: string;
                    code?: string;
                    title: string;
                    meta: string;
                    months?: number;
                    riskLabel?: string;
                    digLabel?: string;
                    riskColor?: string;
                    kept?: { name: string; freq: string }[];
                    changed?: { name: string; freq: string; from: string }[];
                    added?: { name: string; freq: string }[];
                    removed?: { name: string; freq: string }[];
                    lines: string[];
                    approve: () => void;
                    reject: () => void;
                  }[]
                | undefined
            )?.map((ap, i) => (
              <article
                key={ap.code || ap.title + i}
                className="overflow-hidden rounded-[24px] border border-linea bg-nara-blanco shadow-[0_10px_30px_rgba(22,20,19,0.04)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linea bg-[linear-gradient(135deg,#FFF9E3_0%,#F0ECE6_55%,#FFFFFF_100%)] px-5 py-4 sm:px-7">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-nara-amarillo px-2.5 py-1 font-texto text-xs font-semibold text-nara-tinta">
                        Pendiente
                      </span>
                      <span className="rounded-full border border-linea bg-nara-blanco px-2.5 py-1 font-texto text-xs text-texto-secundario">
                        {ap.kind === "rules" ? "Reglas" : "Ruta de cuidado"}
                      </span>
                    </div>
                    <h2 className="font-titulos text-xl font-semibold text-nara-tinta sm:text-[22px]">
                      {ap.title}
                    </h2>
                    <span className="text-sm text-texto-secundario">{ap.meta}</span>
                  </div>
                  {ap.kind === "path" ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className="rounded-full px-3 py-1 font-texto text-xs font-semibold text-nara-blanco"
                        style={{ background: ap.riskColor || "#161413" }}
                      >
                        {ap.riskLabel}
                      </span>
                      <span className="text-xs text-texto-secundario">Digital {ap.digLabel}</span>
                      <span className="font-texto text-sm font-medium text-nara-tinta">
                        {ap.months} meses
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-5 px-5 py-5 sm:px-7 sm:py-6">
                  {ap.kind === "path" ? (
                    <>
                      {ap.added?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-estado-al-dia">
                            Se agrega
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.added.map((x) => (
                              <div
                                key={"a-" + x.name}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-exito-suave px-3.5 py-3"
                              >
                                <span className="text-[15px] font-medium text-nara-tinta">{x.name}</span>
                                <span className="shrink-0 text-sm text-texto-secundario">{x.freq}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                      {ap.changed?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-estado-bajo-meta">
                            Cambia
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.changed.map((x) => (
                              <div
                                key={"c-" + x.name}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FFF4CC] px-3.5 py-3"
                              >
                                <span className="text-[15px] font-medium text-nara-tinta">{x.name}</span>
                                <span className="text-sm text-texto-secundario">
                                  {x.from} → <span className="font-medium text-nara-tinta">{x.freq}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                      {ap.removed?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-crisis-texto">
                            Se quita
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.removed.map((x) => (
                              <div
                                key={"r-" + x.name}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-crisis-suave px-3.5 py-3"
                              >
                                <span className="text-[15px] font-medium text-nara-tinta line-through decoration-crisis-texto/40">
                                  {x.name}
                                </span>
                                <span className="shrink-0 text-sm text-texto-secundario">{x.freq}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                      {ap.kept?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-texto-secundario">
                            Se mantiene
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.kept.map((x) => (
                              <div
                                key={"k-" + x.name}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-linea bg-superficie-2 px-3.5 py-3"
                              >
                                <span className="text-[15px] text-nara-tinta">{x.name}</span>
                                <span className="shrink-0 text-sm text-texto-secundario">{x.freq}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {ap.lines.map((l, j) => (
                        <li
                          key={j}
                          className="flex gap-2.5 rounded-2xl border border-linea bg-superficie-2 px-3.5 py-3 text-[15px] leading-snug text-nara-tinta"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-nara-amarillo" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 border-t border-linea bg-superficie-2/60 px-5 py-4 sm:px-7">
                  <button
                    type="button"
                    onClick={() => ap.approve?.()}
                    className="h-12 min-w-[140px] cursor-pointer rounded-2xl border-none bg-nara-amarillo px-5 font-texto text-[15px] font-semibold text-nara-tinta transition hover:brightness-95"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => ap.reject?.()}
                    className="h-12 cursor-pointer rounded-2xl border-[1.5px] border-nara-tinta bg-nara-blanco px-5 font-texto text-[15px] font-medium text-nara-tinta transition hover:bg-nara-crema"
                  >
                    Devolver sin aprobar
                  </button>
                </div>
              </article>
            ))}
            {v.noApprovals ? (
              <div className="flex flex-col items-start gap-3 rounded-[24px] border border-linea bg-nara-blanco px-6 py-8">
                <img src="/nara/marca/personajes/nara-calma.svg" alt="" className="h-12 w-auto" />
                <span className="font-titulos text-lg font-semibold text-nara-tinta">
                  No hay cambios pendientes
                </span>
                <span className="text-[15px] text-texto-secundario">
                  Cuando administración envíe una ruta o reglas, aparecerán aquí para su visto bueno.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {v.isFile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <button
              type="button"
              onClick={() => (v.fileBack as () => void)?.()}
              style={{
                alignSelf: "flex-start",
                fontFamily: "Figtree,system-ui,sans-serif",
                fontSize: 15,
                fontWeight: 500,
                border: "none",
                background: "none",
                color: "#161413",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {v.fileBackLabel as string}
            </button>
            <div
              style={{
                background: "#fff",
                border: "1px solid #DCD6CD",
                borderRadius: 20,
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                    fontWeight: 600,
                    fontSize: 28,
                  }}
                >
                  {f.name as string}
                </span>
                <span style={{ color: "#5E5750" }}>
                  {f.age as number} años · {f.place as string}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    fontWeight: 500,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #DCD6CD",
                  }}
                >
                  {f.profile as string}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: f.rbg as string,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: f.rc as string,
                    }}
                  />
                  Riesgo {f.risk as string}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: f.dbg as string,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: f.dc as string,
                    }}
                  />
                  Digital {f.dig as string}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: f.consBg as string,
                    color: f.consFg as string,
                  }}
                >
                  {f.consText as string}
                </span>
              </div>
            </div>
            <div className="nara-kpi-grid" style={{ gap: 14 }}>
              {(f.kpis as { label: string; val: string; sub: string; subFg: string }[] | undefined)?.map(
                (k, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid #DCD6CD",
                      borderRadius: 20,
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "#5E5750" }}>{k.label}</span>
                    <span
                      style={{
                        fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                        fontWeight: 600,
                        fontSize: 28,
                        lineHeight: 1.1,
                      }}
                    >
                      {k.val}
                    </span>
                    <span style={{ fontWeight: 500, color: k.subFg }}>{k.sub}</span>
                  </div>
                ),
              )}
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #DCD6CD",
                borderRadius: 20,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 16 }}>Ruta asignada</span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                  gap: "8px 18px",
                }}
              >
                {(v.fRoute as { name: string; freq: string }[] | undefined)?.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      borderTop: "1px solid #E6E1D9",
                      paddingTop: 6,
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</span>
                    <span style={{ fontSize: 13, color: "#5E5750" }}>{r.freq}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="nara-split-panel" style={{ gap: 14 }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #DCD6CD",
                  borderRadius: 20,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 500, fontSize: 16 }}>PHQ-9 en el tiempo</span>
                  <span style={{ color: "#5E5750" }}>Más bajo es mejor</span>
                </div>
                <svg viewBox="0 0 600 230" style={{ width: "100%", height: "auto" }}>
                  {(f.bands as { k: string; bg: string; y: number; h: number; ty: number }[] | undefined)?.map(
                    (b, i) => (
                      <g key={i}>
                        <rect x={40} y={b.y} width={550} height={b.h} fill={b.bg} />
                        <text
                          x={36}
                          y={b.ty}
                          textAnchor="end"
                          fontSize={11}
                          fill="#5E5750"
                          fontFamily="Figtree, system-ui, sans-serif"
                        >
                          {b.k}
                        </text>
                      </g>
                    ),
                  )}
                  <polyline
                    points={f.phqLine as string}
                    fill="none"
                    stroke="#161413"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {(f.phqPts as { x: number; y: number; ly: number; v: number; d: string }[] | undefined)?.map(
                    (pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={5}
                          fill="#fff"
                          stroke="#161413"
                          strokeWidth="2.5"
                        />
                        <text
                          x={pt.x}
                          y={pt.ly}
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight={500}
                          fill="#161413"
                          fontFamily="Figtree, system-ui, sans-serif"
                        >
                          {pt.v}
                        </text>
                        <text
                          x={pt.x}
                          y={226}
                          textAnchor="middle"
                          fontSize={11}
                          fill="#5E5750"
                          fontFamily="Figtree, system-ui, sans-serif"
                        >
                          {pt.d}
                        </text>
                      </g>
                    ),
                  )}
                </svg>
              </div>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #DCD6CD",
                  borderRadius: 20,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 500, fontSize: 16 }}>
                    Horas de sueño · últimas 14 noches
                  </span>
                  <span style={{ color: "#5E5750" }}>Manilla</span>
                </div>
                {f.hasSleep ? (
                  <>
                    <svg viewBox="0 0 600 230" style={{ width: "100%", height: "auto" }}>
                      {(f.bars as { x: number; y: number; h: number; c: string; v: string; cx: number; ty: number; lbl: string; lc: string }[] | undefined)?.map(
                        (b, i) => (
                          <g key={i}>
                            <rect x={b.x} y={b.y} width={30} height={b.h} rx={4} fill={b.c} />
                            <text
                              x={b.cx}
                              y={b.ty}
                              textAnchor="middle"
                              fontSize={11}
                              fill="#161413"
                              fontFamily="Figtree, system-ui, sans-serif"
                            >
                              {b.v}
                            </text>
                            <text
                              x={b.cx}
                              y={224}
                              textAnchor="middle"
                              fontSize={10}
                              fill={b.lc}
                              fontFamily="Figtree, system-ui, sans-serif"
                            >
                              {b.lbl}
                            </text>
                          </g>
                        ),
                      )}
                      <line
                        x1={30}
                        x2={590}
                        y1={f.refY as number}
                        y2={f.refY as number}
                        stroke="#161413"
                        strokeDasharray="5 4"
                        strokeWidth="1.5"
                      />
                      <text
                        x={590}
                        y={f.refTy as number}
                        textAnchor="end"
                        fontSize={12}
                        fill="#161413"
                        fontFamily="Figtree, system-ui, sans-serif"
                      >
                        4,5 h · referencia
                      </text>
                    </svg>
                    <div style={{ display: "flex", gap: 18, fontSize: 13, color: "#5E5750" }}>
                      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: "#A9D4FF",
                          }}
                        />
                        Noche normal
                      </span>
                      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: "#D9692B",
                          }}
                        />
                        Bajo 4,5 h (marcada «bajo»)
                      </span>
                    </div>
                  </>
                ) : null}
                {f.noSleep ? (
                  <div
                    style={{
                      flex: 1,
                      display: "grid",
                      placeItems: "center",
                      color: "#5E5750",
                      border: "1px dashed #DCD6CD",
                      borderRadius: 10,
                      minHeight: 180,
                    }}
                  >
                    {f.braceletStatus as string}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="nara-split-panel-start" style={{ gap: 14, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                {f.hasSummary ? (
                  <div
                    style={{
                      background: "#D8FBE3",
                      border: "1.5px dashed #3FEA73",
                      borderRadius: 14,
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 600,
                          color: "#161413",
                        }}
                      >
                        <img
                          src="/nara/marca/logo/teo-isotipo.svg"
                          alt=""
                          style={{ flex: "none", width: 32, height: 32, display: "block" }}
                        />
                        TEO sugiere · sin confirmar · verifique antes de actuar
                      </span>
                      <a href="#" style={{ color: "#161413" }}>
                        {f.audioLink as string}
                      </a>
                    </div>
                    <span style={{ fontSize: 16, lineHeight: 1.5 }}>{f.summary as string}</span>
                  </div>
                ) : null}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #DCD6CD",
                    borderRadius: 20,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: 16 }}>Recursos</span>
                    <button
                      type="button"
                      onClick={() => (rec.assign as () => void)?.()}
                      style={{
                        fontFamily: "Figtree,system-ui,sans-serif",
                        fontSize: 15,
                        fontWeight: 500,
                        height: 44,
                        padding: "0 16px",
                        borderRadius: 14,
                        border: "1.5px solid #161413",
                        background: "#fff",
                        color: "#161413",
                        cursor: "pointer",
                      }}
                    >
                      Asignar recurso
                    </button>
                  </div>
                  {rec.has ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{rec.title as string}</span>
                      <span style={{ fontSize: 14, color: "#5E5750" }}>{rec.meta as string}</span>
                      <div className="nara-kpi-grid" style={{ gap: 6 }}>
                        {(rec.mods as { c: string; l: string }[] | undefined)?.map((m, i) => (
                          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div
                              style={{ height: 8, borderRadius: 4, background: m.c }}
                            />
                            <span style={{ fontSize: 12, lineHeight: 1.3 }}>{m.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {rec.none ? (
                    <span style={{ fontSize: 14, color: "#5E5750" }}>Sin curso asignado.</span>
                  ) : null}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Cuentos leídos o escuchados</span>
                    <span style={{ fontSize: 14, lineHeight: 1.4 }}>{rec.read as string}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Técnicas · últimas 4 semanas</span>
                    {(rec.techs as { n: string; v: string }[] | undefined)?.map((t, i) => (
                      <div
                        key={i}
                        style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}
                      >
                        <span>{t.n}</span>
                        <span style={{ fontWeight: 500 }}>{t.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      Respuestas que decidió compartir
                    </span>
                    {(rec.answers as { h: string; a: string }[] | undefined)?.map((a, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#F0ECE6",
                          borderRadius: 12,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#5E5750" }}>{a.h}</span>
                        <span style={{ fontSize: 15, lineHeight: 1.4 }}>«{a.a}»</span>
                      </div>
                    ))}
                    {rec.noAns ? (
                      <span style={{ fontSize: 14, color: "#5E5750" }}>
                        Todavía no ha compartido respuestas.
                      </span>
                    ) : null}
                  </div>
                  {(rec.assigned as string[] | undefined)?.map((x, i) => (
                    <span key={i} style={{ fontSize: 14 }}>
                      {x}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #DCD6CD",
                    borderRadius: 20,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 16, marginBottom: 6 }}>Línea de tiempo</span>
                  {(f.timeline as { d: string; t: string; x: string }[] | undefined)?.map((t, i) => (
                    <div
                      key={i}
                      className="nara-label-row"
                      style={{
                        gap: 14,
                        padding: "9px 0",
                        borderTop: "1px solid #E6E1D9",
                      }}
                    >
                      <span style={{ color: "#5E5750" }}>{t.d}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 500 }}>{t.t}</span>
                        <span style={{ color: "#161413" }}>{t.x}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #DCD6CD",
                    borderRadius: 20,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 16 }}>Nota de sesión</span>
                  <textarea
                    value={v.noteText as string}
                    onChange={v.setNote as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                    rows={3}
                    placeholder="Qué se habló y qué se acordó"
                    style={{
                      border: "1.5px solid #DCD6CD",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 15,
                      resize: "vertical",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => (v.addNote as () => void)?.()}
                    style={{
                      alignSelf: "flex-start",
                      fontFamily: "Figtree,system-ui,sans-serif",
                      fontSize: 15,
                      fontWeight: 500,
                      height: 44,
                      padding: "0 18px",
                      borderRadius: 10,
                      border: "1.5px solid #161413",
                      background: "#fff",
                      color: "#161413",
                      cursor: "pointer",
                    }}
                  >
                    Agregar a la línea de tiempo
                  </button>
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #DCD6CD",
                    borderRadius: 20,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 16 }}>Ajustar la ruta</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(v.adjust as { label: string; go: () => void }[] | undefined)?.map((j, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => j.go?.()}
                        style={{
                          fontFamily: "Figtree,system-ui,sans-serif",
                          fontSize: 15,
                          height: 44,
                          padding: "0 14px",
                          borderRadius: 10,
                          border: "1.5px solid #161413",
                          background: "#fff",
                          color: "#161413",
                          cursor: "pointer",
                        }}
                      >
                        {j.label}
                      </button>
                    ))}
                  </div>
                  <span style={{ color: "#5E5750" }}>
                    Se notifica a la paciente y al experto de campo.
                  </span>
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #DCD6CD",
                    borderRadius: 20,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 16 }}>Remitir a una institución</span>
                  {f.canRefer ? (
                    <>
                      <select
                        value={v.refInst as string}
                        onChange={v.setRefInst as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                        style={{
                          height: 46,
                          borderRadius: 10,
                          border: "1.5px solid #DCD6CD",
                          padding: "0 12px",
                          fontSize: 15,
                          background: "#fff",
                        }}
                      >
                        {(v.insts as { id: string; label: string }[] | undefined)?.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={v.refReason as string}
                        onChange={v.setRefReason as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                        rows={3}
                        placeholder="Motivo de la remisión"
                        style={{
                          border: `1.5px solid ${v.refBd}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                          fontSize: 15,
                          resize: "vertical",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => (v.refer as () => void)?.()}
                        style={{
                          alignSelf: "flex-start",
                          fontFamily: "Figtree,system-ui,sans-serif",
                          fontSize: 15,
                          fontWeight: 500,
                          height: 46,
                          padding: "0 20px",
                          borderRadius: 14,
                          border: "none",
                          background: "#FDCD22",
                          color: "#161413",
                          cursor: "pointer",
                        }}
                      >
                        Enviar remisión
                      </button>
                    </>
                  ) : null}
                  {f.referBlocked ? (
                    <div
                      style={{
                        background: "#F0ECE6",
                        borderRadius: 10,
                        padding: "12px 14px",
                        lineHeight: 1.5,
                      }}
                    >
                      <b style={{ fontWeight: 500 }}>Remisión bloqueada.</b> La paciente no autorizó
                      compartir su caso. Pida el consentimiento en la próxima sesión; cuando lo autorice,
                      podrá remitir.
                    </div>
                  ) : null}
                  {f.referred ? (
                    <div
                      style={{
                        background: "#FFF4CC",
                        borderRadius: 10,
                        padding: "12px 14px",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.referredText as string}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
