"use client";
// @ts-nocheck

import { useMemo, useState } from "react";
import { FormModal } from "@/components/shared/form-modal/FormModal";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PhoneInput } from "@/components/shared/phone-input/PhoneInput";
import {
  TableSearch,
  filterRowsBySearch,
} from "@/components/shared/table-search/TableSearch";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";

export function ExpertoTopbar({ v }: { v: Record<string, any> }) {
  return (
    <header className="box-border flex h-16 shrink-0 items-center justify-between gap-2 border-b border-linea bg-nara-blanco px-3 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={() => v.goList?.()}
        className="flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0 text-nara-tinta"
      >
        <img
          src="/nara/marca/logo/nara-logo.svg"
          alt="NARA"
          className="block h-7 w-auto sm:h-[34px]"
        />
      </button>
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        {v.dev ? (
          <span className="hidden rounded-[5px] border border-linea px-1.5 py-0.5 font-mono text-[11px] text-texto-secundario md:inline">
            {v.screenCode}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => v.openAgent?.()}
          aria-label="Abrir TEO"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-nara-tinta bg-nara-blanco px-2.5 font-texto text-sm font-medium text-nara-tinta sm:h-11 sm:px-4 sm:text-base"
        >
          <img
            src="/nara/marca/logo/teo-isotipo.svg"
            alt=""
            className="block h-7 w-7 sm:-ml-2 sm:h-8 sm:w-8"
          />
          <span className="hidden sm:inline">TEO</span>
        </button>
        <div
          className="flex max-w-[42vw] items-center gap-2 truncate rounded-full border border-linea px-2.5 py-1.5 text-xs font-medium sm:max-w-none sm:px-3.5 sm:py-2 sm:text-[15px]"
          style={{ background: v.connBg }}
          title={v.connText}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: v.connDot }}
          />
          <span className="truncate">{v.connText}</span>
        </div>
        <UserMenu notifKey={v.ex} />
      </div>
    </header>
  );
}

export function ExpertoBody({ v }: { v: Record<string, any> }) {
  const er = v.er || {};
  const [worklistQ, setWorklistQ] = useState("");
  const worklistRows = useMemo(
    () => filterRowsBySearch(v.worklist || [], worklistQ),
    [v.worklist, worklistQ],
  );

  return (
    <>
      <NaraMsgAlert msg={v.newMsg} onClear={() => v.clearNewMsg?.()} />
      <NaraMsgAlert msg={v.consentMsg} onClear={() => v.clearConsentMsg?.()} />
      <NaraMsgAlert msg={v.reasonErr} onClear={() => v.clearReasonErr?.()} />
      <div
        data-screen-label="Experto"
        className="min-w-0 w-full bg-nara-crema font-texto text-nara-tinta"
      >
            <div ref={v.scrollRef} className="relative">
              <div className="mx-auto box-border w-full max-w-[1280px] px-3 sm:px-7">
              {v.isList ? (
                <div
                  className="flex flex-col gap-5 py-4 sm:py-6"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  {(v.notices || []).map((n: Record<string, any>, i: number) => (
                    <div
                      key={i}
                      style={{
                        background: "#fff",
                        border: "1px solid #DCD6CD",
                        borderRadius: 12,
                        padding: "14px 18px",
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: n.tagBg,
                          color: n.tagFg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.tag}
                      </span>
                      <span style={{ fontSize: 16, lineHeight: 1.45, flex: 1 }}>
                        {n.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => n.dismiss?.()}
                        style={{
                          fontFamily: "Figtree,system-ui,sans-serif",
                          fontSize: 15,
                          border: "none",
                          background: "none",
                          color: "#161413",
                          cursor: "pointer",
                          padding: "4px 8px",
                        }}
                      >
                        Entendido
                      </button>
                    </div>
                  ))}
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #DCD6CD",
                      borderRadius: 12,
                      padding: "10px 12px 10px 16px",
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <img
                      src="/nara/marca/logo/teo-isotipo.svg"
                      alt=""
                      style={{
                        flex: "none",
                        width: 36,
                        height: 36,
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          lineHeight: 1.4,
                          textWrap: "pretty",
                        }}
                      >
                        {v.briefLine}
                      </span>
                      <span style={{ fontSize: 13, color: "#5E5750" }}>
                        {v.briefSub}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => v.openAgent?.()}
                      style={{
                        flex: "none",
                        fontFamily: "Figtree,system-ui,sans-serif",
                        fontSize: 16,
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
                      Preguntar
                    </button>
                  </div>
                  <div
                    className="nara-page-head flex flex-wrap items-end justify-between gap-3"
                    style={{
                      flexDirection: "row",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                          fontWeight: 600,
                          fontSize: 28,
                        }}
                      >
                        Visitas de hoy
                      </span>
                      {/* H-009: fecha real de hoy; la capa de fechas relativas no debe volver a correrla. */}
                      <span style={{ fontSize: 16, color: "#5E5750" }} data-real-date>
                        {(v.quotaDateLabel as string) || "Hoy"} · Solo cuentan
                        las visitas validadas
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => v.goNew?.()}
                      style={{
                        fontFamily: "Figtree,system-ui,sans-serif",
                        fontSize: 17,
                        fontWeight: 500,
                        height: 52,
                        padding: "0 22px",
                        borderRadius: 12,
                        border: "1.5px solid #161413",
                        background: "#fff",
                        color: "#161413",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      + Nueva persona
                    </button>
                  </div>
                  <div className="nara-kpi-grid" style={{ gap: 14 }}>
                    {(v.quotaCards || []).map((q: Record<string, any>, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: "#fff",
                          border: "1px solid #DCD6CD",
                          borderRadius: 20,
                          padding: "16px 18px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 15, color: "#5E5750" }}>
                          {q.label}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                              fontWeight: 600,
                              fontSize: 34,
                              lineHeight: 1,
                            }}
                          >
                            {q.val}
                          </span>
                          <span style={{ fontSize: 16, color: "#5E5750" }}>
                            de {q.target}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            background: "#E6E1D9",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: q.pct,
                              background: "#161413",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <TableSearch
                    value={worklistQ}
                    onChange={setWorklistQ}
                    placeholder="Buscar visita, persona, lugar, perfil…"
                    className="sm:max-w-md"
                  />
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #DCD6CD",
                      borderRadius: 20,
                      overflow: "hidden",
                    }}
                  >
                    <div className="nara-scroll-x">
                      <div style={{ minWidth: 940 }}>
                    {worklistRows.map((w: Record<string, any>, i: number) => (
                      <div
                        key={w.id ?? i}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "70px minmax(0,1.6fr) minmax(0,1.3fr) 90px minmax(0,1.6fr) 190px",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 20px",
                          borderBottom: "1px solid #E6E1D9",
                          background: w.rowBg,
                          boxShadow: w.rowShadow,
                        }}
                      >
                        <span style={{ fontSize: 17, fontWeight: 500 }}>
                          {w.time}
                        </span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 17, fontWeight: 500 }}>
                            {w.name}
                          </span>
                          <span style={{ fontSize: 15, color: "#5E5750" }}>
                            {w.age} años
                          </span>
                        </div>
                        <span style={{ fontSize: 16 }}>{w.place}</span>
                        <span style={{ fontSize: 15, color: "#5E5750" }}>
                          {w.zone}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              padding: "5px 10px",
                              borderRadius: 6,
                              background: w.tagBg,
                              color: w.tagFg,
                            }}
                          >
                            {w.tag}
                          </span>
                          {w.hasProfile ? (
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: "1px solid #DCD6CD",
                                background: "#fff",
                              }}
                            >
                              {w.profile}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          {w.hasAction ? (
                            <button
                              type="button"
                              onClick={() => w.onAction?.()}
                              style={{
                                fontFamily: "Figtree,system-ui,sans-serif",
                                fontSize: 16,
                                fontWeight: 500,
                                height: 48,
                                padding: "0 18px",
                                borderRadius: 10,
                                border: "1.5px solid #161413",
                                background: w.btnBg,
                                color: w.btnFg,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {w.action}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {!worklistRows.length ? (
                      <p
                        style={{
                          margin: 0,
                          padding: "28px 20px",
                          textAlign: "center",
                          fontSize: 15,
                          color: "#5E5750",
                          borderTop: "1px solid #E6E1D9",
                        }}
                      >
                        {worklistQ.trim()
                          ? "Ninguna visita coincide con la búsqueda."
                          : "No hay visitas en la lista de hoy."}
                      </p>
                    ) : null}
                      </div>
                    </div>
                  </div>
                  {v.hasGroups ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                          fontWeight: 600,
                          fontSize: 22,
                        }}
                      >
                        Sesiones PM+ y grupos de apoyo
                      </span>
                      {(v.groups || []).map((g: Record<string, any>, gi: number) => (
                        <div
                          key={g.id ?? gi}
                          style={{
                            background: "#fff",
                            border: "1px solid #DCD6CD",
                            borderRadius: 20,
                            padding: "14px 20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div
                            className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[70px_minmax(0,1fr)_auto] sm:gap-3.5"
                            style={{
                              display: "grid",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontSize: 17, fontWeight: 500 }}>
                              {g.time}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    padding: "4px 9px",
                                    borderRadius: 6,
                                    background: "#E6E1D9",
                                    color: "#161413",
                                  }}
                                >
                                  {g.kind}
                                </span>
                                <span style={{ fontSize: 17, fontWeight: 500 }}>
                                  {g.title}
                                </span>
                              </div>
                              <span style={{ fontSize: 15, color: "#5E5750" }}>
                                {g.place} · {g.attText}
                              </span>
                            </div>
                            {g.canClose ? (
                              <button
                                type="button"
                                onClick={() => g.close?.()}
                                style={{
                                  fontFamily: "Figtree,system-ui,sans-serif",
                                  fontSize: 16,
                                  fontWeight: 500,
                                  height: 46,
                                  padding: "0 16px",
                                  borderRadius: 10,
                                  border: "1.5px solid #161413",
                                  background: "#fff",
                                  color: "#161413",
                                  cursor: "pointer",
                                }}
                              >
                                Guardar asistencia
                              </button>
                            ) : null}
                            {g.closed ? (
                              <span
                                style={{
                                  fontSize: 15,
                                  fontWeight: 500,
                                  color: "#161413",
                                }}
                              >
                                Asistencia guardada
                              </span>
                            ) : null}
                          </div>
                          <div className="nara-tabs-scroll" style={{ gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => g.tabAtt?.()}
                              style={{
                                fontFamily: "Figtree,system-ui,sans-serif",
                                fontSize: 15,
                                fontWeight: 500,
                                height: 44,
                                padding: "0 14px",
                                border: "none",
                                background: "none",
                                borderBottom: `3px solid ${g.attBd}`,
                                color: "#161413",
                                cursor: "pointer",
                                marginBottom: -1,
                              }}
                            >
                              Asistencia
                            </button>
                            <button
                              type="button"
                              onClick={() => g.tabGuide?.()}
                              style={{
                                fontFamily: "Figtree,system-ui,sans-serif",
                                fontSize: 15,
                                fontWeight: 500,
                                height: 44,
                                padding: "0 14px",
                                border: "none",
                                background: "none",
                                borderBottom: `3px solid ${g.guideBd}`,
                                color: "#161413",
                                cursor: "pointer",
                                marginBottom: -1,
                              }}
                            >
                              Guía de la sesión
                            </button>
                          </div>
                          {g.isGuide ? (
                            <div className="nara-split-panel-start">
                              <img
                                src={g.cover}
                                alt={g.cuento}
                                style={{
                                  width: 120,
                                  aspectRatio: "600/780",
                                  objectFit: "cover",
                                  borderRadius: 12,
                                  boxShadow: "0 4px 12px rgba(22,20,19,.22)",
                                  display: "block",
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span style={{ fontSize: 13, color: "#5E5750" }}>
                                    Cuento del día
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      padding: "3px 10px",
                                      borderRadius: 999,
                                      background: "#E3F1E8",
                                      color: "#161413",
                                    }}
                                  >
                                    Disponible sin señal
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                                    fontWeight: 600,
                                    fontSize: 21,
                                  }}
                                >
                                  {g.cuento}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => g.read?.()}
                                  style={{
                                    fontFamily: "Figtree,system-ui,sans-serif",
                                    fontSize: 16,
                                    fontWeight: 500,
                                    minHeight: 46,
                                    padding: "0 16px",
                                    borderRadius: 14,
                                    border: "1.5px solid #161413",
                                    background: "#fff",
                                    color: "#161413",
                                    cursor: "pointer",
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  Abrir para leer en voz alta
                                </button>
                                <span
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    marginTop: 4,
                                  }}
                                >
                                  Preguntas para conversar
                                </span>
                                {(g.qs || []).map((q: Record<string, any>, qi: number) => (
                                  <span
                                    key={qi}
                                    style={{ fontSize: 16, lineHeight: 1.4 }}
                                  >
                                    {q.n}. {q.t}
                                  </span>
                                ))}
                                <span
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    marginTop: 4,
                                  }}
                                >
                                  Técnica de cierre
                                </span>
                                <span style={{ fontSize: 16 }}>{g.tech}</span>
                                <span style={{ fontSize: 14, color: "#5E5750" }}>
                                  La lista de asistencia está en la pestaña
                                  «Asistencia».
                                </span>
                              </div>
                            </div>
                          ) : null}
                          {g.isAtt ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              {(g.who || []).map(
                                (p: Record<string, any>, pi: number) => (
                                  <button
                                    key={pi}
                                    type="button"
                                    onClick={() => p.toggle?.()}
                                    style={{
                                      fontFamily: "Figtree,system-ui,sans-serif",
                                      fontSize: 15,
                                      height: 44,
                                      padding: "0 14px",
                                      borderRadius: 22,
                                      border: `1.5px solid ${p.bd}`,
                                      background: p.bg,
                                      color: p.fg,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <span style={{ fontWeight: 600 }}>{p.mark}</span>
                                    {p.name}
                                  </button>
                                ),
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <FormModal
                open={!!v.isNew}
                onClose={() => v.closeNewForm?.()}
                title={v.formTitle || "Nueva persona"}
                description={v.formDesc || "Complete la ficha. Territorio, experto, clínico y códigos se asignan solos."}
                size={v.formSize || "lg"}
                footer={(
                  <>
                    <button
                      type="button"
                      onClick={() => v.newSave?.()}
                      className="h-[46px] w-full cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta sm:w-auto"
                    >
                      {v.formSaveLabel || "Agregar y empezar visita"}
                    </button>
                    <button
                      type="button"
                      onClick={() => v.closeNewForm?.()}
                      className="h-[46px] w-full cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-[18px] font-texto text-[15px] font-medium text-nara-tinta sm:w-auto"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              >
                <div className="flex flex-col gap-6">
                  {(v.newSections || []).map((sec: { title: string; fields: Record<string, any>[] }) => (
                    <section key={sec.title} className="flex flex-col gap-3">
                      <h3 className="font-titulos text-base font-semibold text-nara-tinta">{sec.title}</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {sec.fields.map((f: Record<string, any>) => {
                          const inputClass =
                            "h-11 w-full rounded-[9px] border-[1.5px] border-linea px-3 font-texto text-[15px] text-nara-tinta outline-none " +
                            (f.readOnly || f.kind === "readonly"
                              ? "cursor-default bg-nara-crema"
                              : "bg-nara-blanco");
                          return (
                            <label
                              key={f.key || f.label}
                              className={`flex w-full flex-col gap-1.5 font-medium ${f.span === 2 ? "sm:col-span-2" : ""}`}
                            >
                              <span className="leading-5">{f.label}</span>
                              {f.kind === "phone" ? (
                                <PhoneInput
                                  value={f.value}
                                  onChange={f.onChange}
                                  placeholder={f.ph}
                                />
                              ) : f.kind === "select" ? (
                                <select
                                  value={f.value}
                                  onChange={f.onChange}
                                  className={inputClass}
                                >
                                  <option value="">Seleccione…</option>
                                  {(f.options || []).map((o: string) => (
                                    <option key={o} value={o}>
                                      {o}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={f.kind === "date" ? "date" : f.kind === "email" ? "email" : "text"}
                                  value={f.value}
                                  onChange={f.readOnly || f.kind === "readonly" ? undefined : f.onChange}
                                  readOnly={!!f.readOnly || f.kind === "readonly"}
                                  placeholder={f.ph}
                                  className={inputClass}
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
                {v.dupShow ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco p-4">
                    <span className="w-fit rounded-md bg-nara-crema px-2.5 py-1 text-sm font-medium">
                      Posible duplicado
                    </span>
                    <p className="text-[15px] leading-relaxed text-nara-tinta">
                      El teléfono ya está registrado para Marleny Osorio (Vereda Cocora). Puede ser un familiar que comparte teléfono.
                    </p>
                    <button
                      type="button"
                      onClick={() => v.dupConfirm?.()}
                      className="h-11 w-fit cursor-pointer rounded-[10px] border-none bg-nara-tinta px-4 font-texto text-[15px] font-medium text-nara-blanco"
                    >
                      Es otra persona
                    </button>
                  </div>
                ) : null}
              </FormModal>

              {v.inVisit ? (
                <div
                  style={{
                    padding: "18px 28px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                        fontWeight: 600,
                        fontSize: 24,
                      }}
                    >
                      {v.personName}
                    </span>
                    <span style={{ fontSize: 15, color: "#5E5750" }}>
                      {v.personMeta}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(v.steps || []).map((s: Record<string, any>, si: number) => (
                      <div
                        key={si}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 15,
                            fontWeight: 500,
                            background: s.bg,
                            color: s.fg,
                            border: `1.5px solid ${s.bd}`,
                          }}
                        >
                          {s.n}
                        </span>
                        <span style={{ fontSize: 16, fontWeight: s.fw }}>
                          {s.label}
                        </span>
                        {s.arrow ? (
                          <span style={{ color: "#5E5750", padding: "0 6px" }}>
                            →
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {v.isConsent ? (
                <div
                  className="nara-split-panel py-4 sm:py-7"
                  style={{
                    gap: 20,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #DCD6CD",
                      borderRadius: 20,
                      padding: "20px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 16, color: "#5E5750" }}>
                      Lea cada punto en voz alta y marque lo que la persona acepta.
                    </span>
                    {(v.consentItems || []).map(
                      (c: Record<string, any>, ci: number) => (
                        <div
                          key={ci}
                          onClick={() => c.toggle?.()}
                          style={{
                            display: "flex",
                            gap: 14,
                            alignItems: "flex-start",
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: `1.5px solid ${c.bd}`,
                            background: c.bg,
                            cursor: "pointer",
                            minHeight: 48,
                            boxSizing: "border-box",
                          }}
                        >
                          <span
                            style={{
                              flex: "none",
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              border: `2px solid ${c.boxBd}`,
                              background: c.boxBg,
                              color: "#fff",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 17,
                              fontWeight: 700,
                            }}
                          >
                            {c.mark}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              flex: 1,
                            }}
                          >
                            <span style={{ fontSize: 16, lineHeight: 1.4 }}>
                              {c.text}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: c.kindFg,
                              }}
                            >
                              {c.kind}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #DCD6CD",
                        borderRadius: 20,
                        padding: "20px 22px",
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
                        }}
                      >
                        <span style={{ fontSize: 17, fontWeight: 500 }}>
                          {v.sigTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => v.sigClear?.()}
                          style={{
                            fontFamily: "Figtree,system-ui,sans-serif",
                            fontSize: 15,
                            border: "none",
                            background: "none",
                            color: "#161413",
                            cursor: "pointer",
                          }}
                        >
                          Borrar
                        </button>
                      </div>
                      <canvas
                        ref={v.sigRef}
                        width={440}
                        height={150}
                        style={{
                          width: "100%",
                          height: 150,
                          border: "1.5px dashed #5E5750",
                          borderRadius: 10,
                          background: "#FAF8F5",
                          touchAction: "none",
                          cursor: "crosshair",
                        }}
                      />
                      <span style={{ fontSize: 14, color: "#5E5750" }}>
                        {v.sigHint}
                      </span>
                      <div
                        onClick={() => v.toggleRuego?.()}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          cursor: "pointer",
                          minHeight: 44,
                        }}
                      >
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            border: `2px solid ${v.ruegoBd}`,
                            background: v.ruegoBg,
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                          }}
                        >
                          {v.ruegoMark}
                        </span>
                        <span style={{ fontSize: 16 }}>
                          Firma a ruego (un testigo firma por quien no puede
                          escribir)
                        </span>
                      </div>
                      {v.ruego ? (
                        <input
                          value={v.witness}
                          onChange={v.setWitness}
                          placeholder="Nombre del testigo"
                          style={{
                            height: 50,
                            borderRadius: 10,
                            border: "1.5px solid #DCD6CD",
                            padding: "0 14px",
                            fontSize: 16,
                          }}
                        />
                      ) : null}
                    </div>
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #DCD6CD",
                        borderRadius: 20,
                        padding: "16px 22px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 500 }}>
                        Evidencia de la visita · automática
                      </span>
                      {(v.evidence || []).map(
                        (e: Record<string, any>, ei: number) => (
                          <div
                            key={ei}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 15,
                              gap: 12,
                            }}
                          >
                            <span style={{ color: "#5E5750" }}>{e.k}</span>
                            <span>{e.v}</span>
                          </div>
                        ),
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => v.consentNext?.()}
                      style={{
                        fontFamily: "Figtree,system-ui,sans-serif",
                        fontSize: 17,
                        fontWeight: 500,
                        height: 56,
                        borderRadius: 12,
                        border: "none",
                        background: v.consentBtnBg,
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Continuar a la evaluación
                    </button>
                  </div>
                </div>
              ) : null}

              {v.isEval ? (
                <div
                  style={{
                    padding: "14px 28px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {v.crisis ? (
                    <div
                      style={{
                        background: "#FDE7E4",
                        border: "2px solid #B42318",
                        borderRadius: 14,
                        padding: "20px 22px",
                        display: "flex",
                        gap: 22,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#fff",
                            background: "#B42318",
                            alignSelf: "flex-start",
                            padding: "4px 10px",
                            borderRadius: 6,
                          }}
                        >
                          Crisis · protocolo activado
                        </span>
                        <span
                          style={{
                            fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                            fontWeight: 600,
                            fontSize: 24,
                          }}
                        >
                          {v.crisisStay}
                        </span>
                        <span style={{ fontSize: 17, lineHeight: 1.5 }}>
                          La alerta ya se envió a la Dra. Lucía Marín, clínica de
                          turno. La meta es que llame en menos de 30 minutos. Si hay
                          peligro ahora: llame al 123. Si la persona necesita hablar
                          con alguien: Línea 192, opción 4.
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            background: "#fff",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 16,
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            Estado de la alerta:
                          </span>
                          <span>{v.alertStatusText}</span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          minWidth: 220,
                        }}
                      >
                        {(v.crisisLines || []).map(
                          (cl: Record<string, any>, cli: number) => (
                            <a
                              key={cli}
                              href={cl.tel}
                              style={{
                                minHeight: 54,
                                padding: "6px 12px",
                                boxSizing: "border-box",
                                borderRadius: 12,
                                border: "2px solid #B42318",
                                background: cl.bg,
                                color: cl.fg,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 17,
                                fontWeight: 500,
                                textAlign: "center",
                                textDecoration: "none",
                              }}
                            >
                              <span>{cl.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 400 }}>
                                {cl.sub}
                              </span>
                            </a>
                          ),
                        )}
                        <button
                          type="button"
                          onClick={() => v.goResult?.()}
                          style={{
                            fontFamily: "Figtree,system-ui,sans-serif",
                            fontSize: 16,
                            fontWeight: 500,
                            height: 54,
                            borderRadius: 12,
                            border: "1.5px solid #161413",
                            background: "#fff",
                            color: "#161413",
                            cursor: "pointer",
                          }}
                        >
                          Ver ruta de crisis
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>
                      <b style={{ fontWeight: 500 }}>{v.progressOk}</b>
                      <span style={{ color: "#161413" }}>{v.progressDraft}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => v.calc?.()}
                      style={{
                        fontFamily: "Figtree,system-ui,sans-serif",
                        fontSize: 17,
                        fontWeight: 500,
                        height: 50,
                        padding: "0 22px",
                        borderRadius: 12,
                        border: "none",
                        background: v.calcBg,
                        color: v.calcFg,
                        cursor: "pointer",
                      }}
                    >
                      Calcular resultado
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", gap: 16, alignItems: "stretch" }}
                  >
                    {v.isChat ? (
                      <div
                        style={{
                          flex: 1.05,
                          minWidth: 0,
                          background: "#fff",
                          border: "1px solid #DCD6CD",
                          borderRadius: 20,
                          display: "flex",
                          flexDirection: "column",
                          height: 540,
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #E6E1D9",
                            fontSize: 15,
                            color: "#5E5750",
                          }}
                        >
                          Escriba con sus palabras lo que la persona le cuenta. TEO
                          propone borradores; usted los confirma.
                        </div>
                        <div
                          ref={v.chatRef}
                          style={{
                            flex: 1,
                            overflow: "auto",
                            padding: "14px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          {(v.chat || []).map(
                            (m: Record<string, any>, mi: number) => (
                              <div key={mi}>
                                {m.isAi ? (
                                  <div
                                    style={{
                                      alignSelf: "flex-start",
                                      maxWidth: "88%",
                                      background: "#D8FBE3",
                                      border: "1.5px dashed #3FEA73",
                                      borderRadius: "4px 14px 14px 14px",
                                      padding: "10px 14px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 6,
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#161413",
                                      }}
                                    >
                                      <img
                                        src="/nara/marca/logo/teo-isotipo.svg"
                                        alt=""
                                        style={{
                                          flex: "none",
                                          width: 32,
                                          height: 32,
                                          display: "block",
                                        }}
                                      />
                                      {m.label}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 16,
                                        lineHeight: 1.45,
                                        color: "#161413",
                                        whiteSpace: "pre-wrap",
                                      }}
                                    >
                                      {m.text}
                                    </span>
                                  </div>
                                ) : null}
                                {m.isExp ? (
                                  <div
                                    style={{
                                      alignSelf: "flex-end",
                                      maxWidth: "85%",
                                      background: "#FFF4CC",
                                      borderRadius: "14px 4px 14px 14px",
                                      padding: "10px 14px",
                                      fontSize: 16,
                                      lineHeight: 1.45,
                                    }}
                                    data-real-date="1"
                                  >
                                    {m.text}
                                  </div>
                                ) : null}
                              </div>
                            ),
                          )}
                          {v.thinking ? (
                            <span style={{ fontSize: 15, color: "#161413" }}>
                              La IA está leyendo su nota…
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{
                            borderTop: "1px solid #E6E1D9",
                            padding: "12px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "flex", gap: 10 }}>
                            <textarea
                              value={v.chatInput}
                              onChange={v.setChatInput}
                              placeholder="Escriba lo que la persona le cuenta…"
                              rows={2}
                              style={{
                                flex: 1,
                                border: "1.5px solid #DCD6CD",
                                borderRadius: 10,
                                padding: "10px 12px",
                                fontSize: 16,
                                resize: "none",
                                color: "#161413",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => v.sendChat?.()}
                              style={{
                                fontFamily: "Figtree,system-ui,sans-serif",
                                fontSize: 16,
                                fontWeight: 500,
                                padding: "0 18px",
                                borderRadius: 14,
                                border: "none",
                                background: "#FDCD22",
                                color: "#161413",
                                cursor: "pointer",
                              }}
                            >
                              Enviar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: "#fff",
                        border: "1px solid #DCD6CD",
                        borderRadius: 20,
                        display: "flex",
                        flexDirection: "column",
                        height: 540,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          borderBottom: "1px solid #E6E1D9",
                        }}
                      >
                        {(v.secTabs || []).map(
                          (t: Record<string, any>, ti: number) => (
                            <button
                              key={ti}
                              type="button"
                              onClick={() => t.go?.()}
                              style={{
                                flex: 1,
                                fontFamily: "Figtree,system-ui,sans-serif",
                                fontSize: 16,
                                fontWeight: 500,
                                height: 54,
                                border: "none",
                                borderBottom: `3px solid ${t.bd}`,
                                background: "#fff",
                                color: t.fg,
                                cursor: "pointer",
                              }}
                            >
                              {t.label}{" "}
                              <span
                                style={{
                                  fontSize: 14,
                                  color: "#5E5750",
                                  fontWeight: 400,
                                }}
                              >
                                {t.count}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          overflow: "auto",
                          padding: "12px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {(v.rows || []).map((r: Record<string, any>, ri: number) => (
                          <div
                            key={ri}
                            style={{
                              border: `1.5px solid ${r.bd}`,
                              borderRadius: 12,
                              padding: "12px 14px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: 16, lineHeight: 1.4 }}>
                                <b style={{ fontWeight: 500 }}>{r.n}.</b> {r.q}
                              </span>
                              <span
                                style={{
                                  flex: "none",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  padding: "4px 9px",
                                  borderRadius: 6,
                                  background: r.tagBg,
                                  color: r.tagFg,
                                  border: `1px solid ${r.tagBd}`,
                                }}
                              >
                                {r.tag}
                              </span>
                            </div>
                            {r.sensitive ? (
                              <div
                                style={{
                                  background: "#F0ECE6",
                                  borderLeft: 0,
                                  borderRadius: 8,
                                  padding: "10px 12px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#161413",
                                  }}
                                >
                                  Pregunta sensible · lea esta redacción exacta
                                </span>
                                <span style={{ fontSize: 16, lineHeight: 1.45 }}>
                                  «{v.q9}»
                                </span>
                              </div>
                            ) : null}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              {(r.opts || []).map(
                                (o: Record<string, any>, oi: number) => (
                                  <button
                                    key={oi}
                                    type="button"
                                    onClick={() => o.pick?.()}
                                    style={{
                                      fontFamily: "Figtree,system-ui,sans-serif",
                                      fontSize: 15,
                                      minHeight: 44,
                                      padding: "0 14px",
                                      borderRadius: 10,
                                      border: `1.5px solid ${o.bd}`,
                                      background: o.bg,
                                      color: o.fg,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {o.label}
                                  </button>
                                ),
                              )}
                              {r.isDraft ? (
                                <button
                                  type="button"
                                  onClick={() => r.confirm?.()}
                                  style={{
                                    fontFamily: "Figtree,system-ui,sans-serif",
                                    fontSize: 15,
                                    fontWeight: 500,
                                    minHeight: 44,
                                    padding: "0 14px",
                                    borderRadius: 14,
                                    border: "none",
                                    background: "#FDCD22",
                                    color: "#161413",
                                    cursor: "pointer",
                                    marginLeft: "auto",
                                  }}
                                >
                                  Confirmar
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          borderTop: "1px solid #E6E1D9",
                          padding: "10px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 14, color: "#5E5750" }}>
                          {v.secNote}
                        </span>
                        <button
                          type="button"
                          onClick={() => v.confirmSection?.()}
                          style={{
                            fontFamily: "Figtree,system-ui,sans-serif",
                            fontSize: 15,
                            fontWeight: 500,
                            height: 44,
                            padding: "0 16px",
                            borderRadius: 10,
                            border: `1.5px solid ${(v.confirmBtnBd as string) || "#161413"}`,
                            background: (v.confirmBtnBg as string) || "#fff",
                            color: (v.confirmBtnFg as string) || "#161413",
                            cursor: "pointer",
                          }}
                        >
                          {v.secDraftN
                            ? `Confirmar las revisadas · ${v.secDraftN}`
                            : "Confirmar las revisadas"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {v.isResult ? (
                <div
                  className="flex flex-col gap-4 py-3.5 sm:py-7"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <button
                      type="button"
                      onClick={() => v.saveVisit?.()}
                      className="h-[58px] w-full shrink-0 cursor-pointer rounded-[14px] border-0 bg-[#FDCD22] px-6 font-texto text-lg font-medium text-[#161413] sm:w-auto sm:min-w-[220px]"
                    >
                      Guardar visita
                    </button>
                    <span className="text-[15px] text-[#5E5750]">
                      {v.saveNote as string}
                    </span>
                  </div>
                  {v.crisis ? (
                    <div
                      className="flex flex-wrap items-center gap-5"
                      style={{
                        background: "#FDE7E4",
                        border: "2px solid #B42318",
                        borderRadius: 14,
                        padding: "18px 22px",
                        gap: 22,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#fff",
                            background: "#B42318",
                            alignSelf: "flex-start",
                            padding: "4px 10px",
                            borderRadius: 6,
                          }}
                        >
                          Crisis · el perfil queda suspendido
                        </span>
                        <span style={{ fontSize: 17, lineHeight: 1.5 }}>
                          {v.crisisStay} La Dra. Lucía Marín tiene la alerta. Si hay
                          peligro ahora: llame al 123. Si la persona necesita hablar
                          con alguien: Línea 192, opción 4.
                        </span>
                        <span style={{ fontSize: 16 }}>
                          <b style={{ fontWeight: 500 }}>Estado:</b>{" "}
                          {v.alertStatusText}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          minWidth: 220,
                        }}
                      >
                        {(v.crisisLines || []).map(
                          (cl: Record<string, any>, cli: number) => (
                            <a
                              key={cli}
                              href={cl.tel}
                              style={{
                                minHeight: 52,
                                padding: "6px 18px",
                                boxSizing: "border-box",
                                borderRadius: 12,
                                border: "2px solid #B42318",
                                background: cl.bg,
                                color: cl.fg,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 17,
                                fontWeight: 500,
                                textAlign: "center",
                                textDecoration: "none",
                              }}
                            >
                              <span>{cl.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 400 }}>
                                {cl.sub}
                              </span>
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className="nara-form-grid-3" style={{ gap: 16, alignItems: "start" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
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
                        <span style={{ fontSize: 15, color: "#5E5750" }}>
                          Salud mental · PHQ-9
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                              fontWeight: 600,
                              fontSize: 30,
                            }}
                          >
                            {v.riskName}
                          </span>
                          <span style={{ fontSize: 17, color: "#5E5750" }}>
                            {v.phqTotal} de 27
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(v.riskScale || []).map(
                            (s: Record<string, any>, si: number) => (
                              <div
                                key={si}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    height: 12,
                                    borderRadius: 3,
                                    background: s.c,
                                    opacity: s.op,
                                    outline: s.ol,
                                    outlineOffset: 2,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: s.fg,
                                    fontWeight: s.fw,
                                  }}
                                >
                                  {s.k}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
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
                        <span style={{ fontSize: 15, color: "#5E5750" }}>
                          Capacidad digital
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                              fontWeight: 600,
                              fontSize: 30,
                            }}
                          >
                            {v.digName}
                          </span>
                          <span style={{ fontSize: 17, color: "#5E5750" }}>
                            {v.digTotal} de 11
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(v.digScale || []).map(
                            (s: Record<string, any>, si: number) => (
                              <div
                                key={si}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    height: 12,
                                    borderRadius: 3,
                                    background: s.c,
                                    opacity: s.op,
                                    outline: s.ol,
                                    outlineOffset: 2,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: s.fg,
                                    fontWeight: s.fw,
                                  }}
                                >
                                  {s.k}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                        <span style={{ fontSize: 15, color: "#161413" }}>
                          {v.digNote}
                        </span>
                      </div>
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
                      <span style={{ fontSize: 15, color: "#5E5750" }}>Perfil</span>
                      <div className="nara-scroll-x">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "96px repeat(3,minmax(0,1fr))",
                          gap: 5,
                          fontSize: 13,
                          minWidth: 300,
                        }}
                      >
                        <span />
                        <span style={{ textAlign: "center", color: "#5E5750" }}>
                          Baja
                        </span>
                        <span style={{ textAlign: "center", color: "#5E5750" }}>
                          Media
                        </span>
                        <span style={{ textAlign: "center", color: "#5E5750" }}>
                          Alta
                        </span>
                        {(v.matrix || []).flatMap(
                          (row: Record<string, any>, ri: number) => [
                            <span
                              key={`${ri}-k`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                color: "#5E5750",
                              }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background: row.c,
                                }}
                              />
                              {row.k}
                            </span>,
                            ...(row.cells || []).map(
                              (cell: Record<string, any>, ci: number) => (
                                <div
                                  key={`${ri}-${ci}`}
                                  style={{
                                    height: 42,
                                    borderRadius: 8,
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 14,
                                    fontWeight: cell.fw,
                                    background: cell.bg,
                                    color: cell.fg,
                                    border: `2px ${cell.bs} ${cell.bd}`,
                                  }}
                                >
                                  {cell.label}
                                </div>
                              ),
                            ),
                          ],
                        )}
                      </div>
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 500 }}>
                        {v.profileLine}
                      </span>
                    </div>
                    <div
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
                      <span style={{ fontSize: 15, fontWeight: 500 }}>
                        Evidencia de la visita
                      </span>
                      {(v.evidenceEnd || []).map(
                        (e: Record<string, any>, ei: number) => (
                          <div
                            key={ei}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 15,
                              gap: 12,
                            }}
                          >
                            <span style={{ color: "#5E5750" }}>{e.k}</span>
                            <span style={{ textAlign: "right" }}>{e.v}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="nara-split-panel" style={{ gap: 16, alignItems: "start" }}>
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Fredoka,Figtree,system-ui,sans-serif",
                            fontWeight: 600,
                            fontSize: 22,
                          }}
                        >
                          {v.pathTitle}
                        </span>
                        <span style={{ fontSize: 16, color: "#5E5750" }}>
                          {v.pathDuration}
                        </span>
                      </div>
                      {(v.path || []).map((p: Record<string, any>, pi: number) => (
                        <div
                          key={pi}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 0",
                            borderTop: "1px solid #E6E1D9",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                            }}
                          >
                            <span style={{ fontSize: 16, fontWeight: 500 }}>
                              {p.name}
                            </span>
                            <span style={{ fontSize: 14, color: "#5E5750" }}>
                              {p.sub}
                            </span>
                          </div>
                          {p.main ? (
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                padding: "4px 9px",
                                borderRadius: 6,
                                background: "#161413",
                                color: "#fff",
                              }}
                            >
                              Servicio principal
                            </span>
                          ) : null}
                          <span
                            style={{
                              fontSize: 15,
                              minWidth: 130,
                              textAlign: "right",
                            }}
                          >
                            {p.freq}
                          </span>
                        </div>
                      ))}
                      {v.notCrisis && v.cp ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 14,
                            alignItems: "center",
                            background: "#F0ECE6",
                            borderRadius: 14,
                            padding: "12px 14px",
                            flexWrap: "wrap",
                          }}
                        >
                          <img
                            src={v.cp.cover}
                            alt=""
                            style={{
                              flex: "none",
                              width: 52,
                              height: 68,
                              objectFit: "cover",
                              borderRadius: 8,
                              boxShadow: "0 2px 6px rgba(22,20,19,.2)",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              minWidth: 220,
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                            }}
                          >
                            <span style={{ fontSize: 16, fontWeight: 600 }}>
                              Curso: {v.cp.title} · {v.cp.motivo}
                            </span>
                            <span style={{ fontSize: 14, color: "#5E5750" }}>
                              {v.cp.sub}
                            </span>
                          </div>
                          <label
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            Cambiar curso
                            <select
                              value={v.cp.sel}
                              onChange={v.cp.set}
                              style={{
                                height: 44,
                                borderRadius: 10,
                                border: "1.5px solid #DCD6CD",
                                padding: "0 10px",
                                fontSize: 15,
                                background: "#fff",
                                color: "#161413",
                              }}
                            >
                              {(v.cp.opts || []).map(
                                (o: Record<string, any>, oi: number) => (
                                  <option key={oi} value={o.v}>
                                    {o.l}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </div>
                      ) : null}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => v.saveVisit?.()}
                        style={{
                          fontFamily: "Figtree,system-ui,sans-serif",
                          fontSize: 18,
                          fontWeight: 500,
                          height: 58,
                          borderRadius: 14,
                          border: "none",
                          background: "#FDCD22",
                          color: "#161413",
                          cursor: "pointer",
                        }}
                      >
                        Guardar visita
                      </button>
                      <span style={{ fontSize: 15, color: "#5E5750" }}>
                        {v.saveNote}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {v.toast ? (
                <div
                  style={{
                    position: "sticky",
                    bottom: 18,
                    margin: "0 auto",
                    width: "max-content",
                    maxWidth: "90%",
                    background: "#161413",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "14px 20px",
                    fontSize: 16,
                  }}
                >
                  {v.toastText}
                </div>
              ) : null}
              </div>
            </div>
      </div>

      {v.erOpen ? (
        <div
          role="dialog"
          aria-label="Lector de cuentos"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "#161413",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
            }}
          >
            <button
              type="button"
              onClick={() => er.close?.()}
              style={{
                fontFamily: "Figtree,system-ui,sans-serif",
                fontSize: 16,
                fontWeight: 500,
                height: 48,
                padding: "0 18px",
                borderRadius: 14,
                border: "none",
                background: "#fff",
                color: "#161413",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 18 }}>
              {er.title}
            </span>
            <span style={{ fontSize: 16 }}>{er.counter}</span>
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "0 16px 20px",
            }}
          >
            <button
              type="button"
              onClick={() => er.prev?.()}
              aria-label="Página anterior"
              style={{
                flex: "none",
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "none",
                background: "#fff",
                color: "#161413",
                fontSize: 26,
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <img
              src={er.img}
              alt={er.alt}
              style={{
                maxHeight: "100%",
                maxWidth: "calc(100% - 160px)",
                objectFit: "contain",
                borderRadius: 8,
                display: "block",
              }}
            />
            <button
              type="button"
              onClick={() => er.next?.()}
              aria-label="Página siguiente"
              style={{
                flex: "none",
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "none",
                background: "#fff",
                color: "#161413",
                fontSize: 26,
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
