"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import Link from "next/link";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { FormModal } from "@/components/shared/form-modal/FormModal";
import { PhoneInput } from "@/components/shared/phone-input/PhoneInput";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { VisitsMap } from "@/components/shared/visits-map/VisitsMap";
import { ix } from "./inlineStyle";

export function AdminMainContent({ v }: { v: Record<string, any> }) {
  return (
    <>
          <NaraMsgAlert
            msg={v.msg}
            actions={v.msgActions}
            onClear={() => v.clearMsg?.()}
          />
          <NaraMsgAlert
            msg={v.tfErr}
            onClear={() => v.clearTfErr?.()}
          />
          <NaraMsgAlert
            msg={v.rulesFlash}
            onClear={() => v.clearRulesFlash?.()}
          />
          <NaraMsgAlert
            msg={v.autoMsg}
            onClear={() => v.clearAutoMsg?.()}
          />

          {v.vHome && (
            <div className="nara-home-grid" style={{ paddingTop: "var(--nara-page-pad-y, 20px)" }}>
              <div className="nara-home-main">
                <AgentPanel role="admin" mode="home" onAction={v.agentAction} onOpenDrawer={v.askFromHome} style={{ flex: 1, minWidth: 0, width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                <Link href="/informe?t=admin-weekly&back=/inicio" style={{ background: '#FDCD22', color: '#161413', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ fontSize: '13px', opacity: '.9' }}>Generado el lunes 28 sep</span><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '22px' }}>Operaciones de la semana</span><span style={{ fontSize: '14px', lineHeight: '1.45' }}>Captación frente al ritmo, territorios en riesgo, control de calidad, manillas y tres acciones.</span><span style={{ fontWeight: '500', marginTop: '6px' }}>Abrir one-pager →</span></Link>
              </div>
            </div>
          )}
          {v.hasFilter && (<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ fontWeight: '500', padding: '6px 12px', borderRadius: '8px', background: '#E6E1D9', color: '#161413' }}>Filtro: {v.terrFilter}</span><button onClick={() => v.clearFilter()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '14px', border: 'none', background: 'none', color: '#161413', cursor: 'pointer' }}>Quitar filtro</button></div>)}
          {v.vTerr && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: 'clamp(22px,4vw,28px)' }}>Territorios</span><span style={{ color: '#5E5750' }}>Meta fase 1: 8.700 personas · {v.totalCap} evaluadas</span></div><button onClick={() => v.toggleTerrForm()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#FDCD22', color: '#161413', cursor: 'pointer', whiteSpace: 'nowrap' }}>{v.terrFormBtn}</button></div>
              </PageHead>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500, fontSize: 16, marginRight: 'auto' }}>{v.terrCountLabel}</span>
                <input
                  value={String(v.terrQ ?? '')}
                  onChange={v.setTerrQ}
                  placeholder="Buscar territorio, departamento, estado…"
                  style={{ height: 40, width: '100%', maxWidth: 320, borderRadius: 9, border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: 14, boxSizing: 'border-box', background: '#fff', color: '#161413' }}
                />
              </div>
              <FormModal
                open={!!v.terrForm}
                onClose={() => (v.closeTerrForm || v.toggleTerrForm)()}
                title="Crear territorio"
                description="Defina meta, cuotas y contenido local del municipio."
                size="lg"
                footer={(
                  <>
                    <button type="button" onClick={() => v.saveTerr()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#FDCD22', color: '#161413', cursor: 'pointer' }}>Guardar territorio</button>
                    <button type="button" onClick={() => (v.closeTerrForm || v.toggleTerrForm)()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 18px', borderRadius: '14px', border: '1.5px solid #DCD6CD', background: '#fff', color: '#161413', cursor: 'pointer' }}>Cancelar</button>
                  </>
                )}
              >
                <div className="nara-form-grid-3">
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Departamento<select value={String(v.tf.dep ?? "")} onChange={v.tfSet.dep} style={{ height: '44px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '15px', background: '#fff' }}><option>Quindío</option><option>Risaralda</option><option>Caldas</option><option>Valle del Cauca</option></select></label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Municipio<input value={String(v.tf.mun ?? "")} onChange={v.tfSet.mun} style={{ height: '44px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: '15px' }} /></label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Meta de captación<input value={String(v.tf.goal ?? "")} onChange={v.tfSet.goal} style={{ height: '44px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: '15px' }} /></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><span style={{ fontWeight: '500' }}>Nivel</span>{v.levels?.map((l) => (<div key={l.label} onClick={() => l.pick()} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', minHeight: '32px' }}><span style={ix`width:18px;height:18px;border-radius:50%;border:2px solid ${l.bd};background:${l.dot};box-sizing:border-box`}></span>{l.label}</div>))}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}><label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Participación rural mínima (%)<input value={String(v.tf.rural ?? "")} onChange={v.tfSet.rural} style={{ height: '44px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: '15px' }} /></label><label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Participación 60+ mínima (%)<input value={String(v.tf.sixty ?? "")} onChange={v.tfSet.sixty} style={{ height: '44px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: '15px' }} /></label></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ fontWeight: '500' }}>Contenido local</span>{v.modules?.map((m) => (<div key={m.label} onClick={() => m.toggle()} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', minHeight: '30px' }}><span style={ix`width:18px;height:18px;border-radius:5px;border:2px solid ${m.bd};background:${m.bg};color:#fff;font-size:12px;display:grid;place-items:center;box-sizing:border-box`}>{m.mark}</span>{m.label}</div>))}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ fontWeight: '500' }}>Instituciones de remisión</span>{v.tinsts?.map((m) => (<div key={m.label} onClick={() => m.toggle()} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', minHeight: '30px' }}><span style={ix`width:18px;height:18px;border-radius:5px;border:2px solid ${m.bd};background:${m.bg};color:#fff;font-size:12px;display:grid;place-items:center;box-sizing:border-box`}>{m.mark}</span>{m.label}</div>))}</div>
                  </div>
                </div>
              </FormModal>
              <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', overflow: 'hidden' }}>
                <div className="nara-scroll-x">
                <div style={{ minWidth: 1100 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr) minmax(0,1.3fr) 80px minmax(0,1.6fr) minmax(0,1.1fr) 90px 100px minmax(0,1.2fr)', gap: '12px', padding: '12px 20px', background: '#F0ECE6', color: '#5E5750', fontSize: '14px', fontWeight: '500' }}><span>Territorio</span><span>Departamento</span><span>Nivel</span><span>Expertos</span><span>Captación</span><span>Rural (real / meta)</span><span>Manillas</span><span>Instituciones</span><span>Estado</span></div>
                {v.terrs?.map((t) => (
                  <div key={t.name || t.id} onClick={() => t.open()} style={ix`display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr) minmax(0,1.3fr) 80px minmax(0,1.6fr) minmax(0,1.1fr) 90px 100px minmax(0,1.2fr);gap:12px;padding:13px 20px;border-top:1px solid #E6E1D9;align-items:center;background:${t.rowBg};cursor:pointer`} >
                    <span style={{ fontWeight: '500' }}>{t.name}</span><span>{t.dep}</span><span>{t.level}</span><span>{t.experts}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}><span>{t.capText}</span><div style={{ height: '6px', borderRadius: '3px', background: '#E6E1D9' }}><div style={ix`height:100%;width:${t.pct};border-radius:3px;background:#161413`}></div></div></div>
                    <span>{t.rural}</span><span>{t.bracelets}</span><span>{t.insts}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}><span style={ix`flex:none;width:10px;height:10px;border-radius:50%;background:${t.sc}`}></span>{t.status}</span>
                  </div>
                ))}
                </div>
                </div>
              </div>
            </div>
          )}
      
          {v.vTeam && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: 'clamp(22px,4vw,28px)' }}>Equipos de campo</span><span style={{ color: '#5E5750' }}>Metas por volumen y por mezcla (rural, 60+). Solo cuentan las visitas validadas.</span></div><button onClick={() => v.toggleExpForm()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#FDCD22', color: '#161413', cursor: 'pointer', whiteSpace: 'nowrap' }}>{v.expFormBtn}</button></div>
              <div className="nara-tabs-scroll items-center gap-2">
                {v.teamTabs?.map((tt) => (
                  <button key={tt.label} onClick={() => tt.go()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:15px;font-weight:500;height:44px;padding:0 16px;border:none;background:none;border-bottom:3px solid ${tt.bd};color:${tt.fg};cursor:pointer;margin-bottom:-1px;white-space:nowrap;flex:none`}>{tt.label}</button>
                ))}
                <button
                  type="button"
                  onClick={() => v.openGoalsForm?.()}
                  className="mb-0.5 ml-1 h-9 shrink-0 cursor-pointer rounded-[10px] border-[1.5px] border-nara-tinta bg-nara-blanco px-3 font-texto text-sm font-medium text-nara-tinta"
                >
                  Definición metas
                </button>
              </div>
              </PageHead>
              <FormModal
                open={!!v.goalsForm}
                onClose={() => (v.closeGoalsForm || (() => {}))()}
                title="Definición metas"
                description="Aplica a todo el equipo de campo. Solo cuentan las visitas validadas."
                size="sm"
                footer={(
                  <>
                    <button type="button" onClick={() => v.saveGoals?.()} className="h-[46px] cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta">Guardar metas</button>
                    <button type="button" onClick={() => (v.closeGoalsForm || (() => {}))()} className="h-[46px] cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-[18px] font-texto text-[15px] font-medium text-nara-tinta">Cancelar</button>
                  </>
                )}
              >
                <div className="flex flex-col gap-4">
                  {v.gfErr ? (
                    <p className="m-0 text-[15px] text-[#B42318]">{v.gfErr}</p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex min-w-0 flex-col gap-1.5 font-medium">
                      <span className="leading-5">Meta diaria</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(v.gf?.daily ?? "")}
                        onChange={v.gfSet?.daily}
                        className="h-11 w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta"
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1.5 font-medium">
                      <span className="leading-5">Meta semanal</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(v.gf?.weekly ?? "")}
                        onChange={v.gfSet?.weekly}
                        className="h-11 w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta"
                      />
                    </label>
                  </div>
                  <p className="m-0 text-[15px] text-texto-secundario">
                    Al guardar, se actualizan las columnas Hoy y Semana de todos los expertos.
                  </p>
                </div>
              </FormModal>
              {v.teamTab1 && (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormModal
                open={!!v.expForm}
                onClose={() => (v.closeExpForm || (() => {}))()}
                title="Crear experto"
                description="El acceso se envía por SMS. La tablet se asigna en Activos."
                size="md"
                footer={(
                  <>
                    <button type="button" onClick={() => v.saveExp()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#FDCD22', color: '#161413', cursor: 'pointer' }}>Crear experto y enviar acceso</button>
                    <button type="button" onClick={() => (v.closeExpForm || (() => {}))()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 18px', borderRadius: '14px', border: '1.5px solid #DCD6CD', background: '#fff', color: '#161413', cursor: 'pointer' }}>Cancelar</button>
                  </>
                )}
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
                    <label className="flex min-w-0 flex-col gap-1.5 font-medium">
                      <span className="leading-5">Nombre</span>
                      <input value={String(v.ef.name ?? "")} onChange={v.efSet.name} className="h-11 w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta" />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1.5 font-medium">
                      <span className="leading-5">Celular</span>
                      <PhoneInput value={String(v.ef.phone ?? "")} onChange={v.efSet.phone} placeholder="3xx xxx xxxx" />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1.5 font-medium">
                      <span className="leading-5">Meta diaria de visitas</span>
                      <input value={String(v.ef.target ?? "")} onChange={v.efSet.target} className="h-11 w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta" />
                    </label>
                  </div>
                  <div className="flex flex-col gap-1.5 font-medium">
                    <span className="leading-5">Territorio (uno solo)</span>
                    {v.terrNames?.length ? (
                      <select
                        value={String(v.ef?.terr ?? "")}
                        onChange={v.efSet.terr}
                        className="h-11 w-full max-w-md rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta"
                      >
                        <option value="">Seleccione…</option>
                        {v.terrNames.map((n: string) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[15px] text-texto-secundario">Cree un territorio antes de asignar expertos.</span>
                    )}
                  </div>
                  <p className="text-[15px] text-texto-secundario">Debe completar la capacitación antes de su primera visita.</p>
                </div>
              </FormModal>
              <div className="nara-split-panel">
                <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', overflow: 'hidden' }}>
                  <div className="nara-scroll-x">
                  <div style={{ minWidth: 720 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr) 100px 110px 80px minmax(0,1.2fr)', gap: '12px', padding: '12px 18px', background: '#F0ECE6', color: '#5E5750', fontSize: '14px', fontWeight: '500' }}><span>Experto</span><span>Territorio</span><span>Hoy</span><span>Semana</span><span>Alertas</span><span>Estado</span></div>
                  {v.experts?.map((e) => (
                    <div key={e.name || e.id} onClick={() => e.open()} style={ix`display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 100px 110px 80px minmax(0,1.2fr);gap:12px;padding:12px 18px;border-top:1px solid #E6E1D9;align-items:center;background:${e.rowBg};cursor:pointer`} ><span style={{ fontWeight: '500' }}>{e.name}</span><span>{e.terr}</span><span>{e.today}</span><span>{e.week}</span><span>{e.flags}</span><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', lineHeight: '1.3' }}><span style={ix`flex:none;width:10px;height:10px;border-radius:50%;background:${e.sc}`}></span>{e.status}</span></div>
                  ))}
                  </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '20px' }}>Visitas marcadas</span><span style={{ color: '#5E5750' }}>{v.flagCount}</span></div>
                    {v.flags?.map((f) => (
                      <div key={f.id || f.person} style={{ border: '1px solid #DCD6CD', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span style={{ fontWeight: '500' }}>{f.expertName} · {f.territory}</span><span style={{ color: '#5E5750' }}>{f.when}</span></div>
                        <span>Visita a {f.person}</span>
                        {f.reasons?.map((r, ri) => (<span key={ri} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ fontSize: '12px', fontWeight: '500', padding: '2px 7px', borderRadius: '5px', background: '#F7E2D2', color: '#7A3A10' }}>Revisar</span>{r}</span>))}
                        {f.pending && (<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button onClick={() => f.approve()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', height: '42px', padding: '0 16px', borderRadius: '10px', border: '1.5px solid #161413', background: '#fff', color: '#161413', cursor: 'pointer' }}>Aprobar</button><button onClick={() => f.reject()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', fontWeight: '500', height: '42px', padding: '0 16px', borderRadius: '10px', border: 'none', background: '#161413', color: '#fff', cursor: 'pointer' }}>Rechazar</button></div>)}
                        {f.done && (<span style={{ fontWeight: '500' }}>{f.doneText}</span>)}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontWeight: '500', fontSize: '16px' }}>Chequeos automáticos</span>
                    {v.checks?.map((c) => (<div key={c.k} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '12px', padding: '7px 0', borderTop: '1px solid #E6E1D9', fontSize: '14px' }}><span style={{ fontWeight: '500' }}>{c.k}</span><span style={{ color: '#5E5750' }}>{c.v}</span></div>))}
                  </div>
                </div>
              </div>
              </div>)}
              {v.teamTab2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}><label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#5E5750' }}>Territorio<select value={String(v.pfTerr ?? "")} onChange={v.setPfTerr} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', minWidth: '180px' }}><option value="">Todos</option>{v.terrNames?.map((n: string) => (<option key={n} value={n}>{n}</option>))}</select></label><div style={{ display: 'flex', border: '1.5px solid #161413', borderRadius: '10px', overflow: 'hidden' }}>{v.pfPeriods?.map((p) => (<button key={p.label} onClick={() => p.go()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:14px;font-weight:500;height:37px;padding:0 14px;border:none;background:${p.bg};color:${p.fg};cursor:pointer`}>{p.label}</button>))}</div><span style={{ marginLeft: 'auto', fontSize: '14px', color: '#5E5750' }}>Toque un encabezado para ordenar · toque una fila para abrir la ficha</span></div>
                  <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', overflow: 'hidden' }}>
                    <div className="nara-scroll-x">
                    <div style={{ minWidth: 980 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) repeat(6,minmax(0,.8fr)) minmax(0,1.2fr) minmax(0,.9fr)', gap: '10px', padding: '10px 18px', background: '#F0ECE6' }}>{v.pfCols?.map((c) => (<button key={c.label} onClick={() => c.go()} style={ix`font-family:Figtree,system-ui,sans-serif;text-align:left;border:none;background:none;padding:0;font-size:13px;font-weight:500;color:${c.fg};cursor:pointer;white-space:normal;line-height:1.3`}>{c.label}{c.arrow}</button>))}</div>
                    {v.pfRows?.map((r) => (<div key={r.name} onClick={() => r.open()} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) repeat(6,minmax(0,.8fr)) minmax(0,1.2fr) minmax(0,.9fr)', gap: '10px', padding: '11px 18px', borderTop: '1px solid #E6E1D9', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }} ><div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}><span style={{ fontWeight: '500' }}>{r.name}</span><span style={{ fontSize: '12px', color: '#5E5750' }}>{r.terr}</span></div><span>{r.vpd}</span><span style={ix`font-weight:${r.durFw};color:${r.durFg};background:${r.durBg};border-radius:6px;padding:2px 6px;justify-self:start`}>{r.dur}</span><span style={ix`color:${r.gpsFg};font-weight:${r.gpsFw}`}>{r.gps}</span><span style={ix`color:${r.verFg};font-weight:${r.verFw}`}>{r.ver}</span><span>{r.rej}</span><span style={ix`color:${r.gapFg};font-weight:${r.gapFw}`}>{r.gap}</span><span style={{ lineHeight: '1.35' }}>{r.mix}</span><span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '500' }}><span style={ix`flex:none;width:9px;height:9px;border-radius:50%;background:${r.sc}`}></span>{r.status}</span></div>))}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) repeat(6,minmax(0,.8fr)) minmax(0,1.2fr) minmax(0,.9fr)', gap: '10px', padding: '12px 18px', borderTop: '2px solid #161413', alignItems: 'center', fontSize: '14px', background: '#F0ECE6', fontWeight: '500' }}><span>Promedio del programa</span><span>{v.pfAvg.vpd}</span><span>{v.pfAvg.dur}</span><span>{v.pfAvg.gps}</span><span>{v.pfAvg.ver}</span><span>{v.pfAvg.rej}</span><span>{v.pfAvg.gap}</span><span>{v.pfAvg.mix}</span><span></span></div>
                    </div>
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontWeight: '500', fontSize: '17px' }}>Mapa de visitas del día · {v.mapTerr}</span><span style={{ fontSize: '13px', color: '#5E5750' }}>OpenStreetMap · ubicaciones aproximadas de veredas y visitas</span></div><div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', fontSize: '13px' }}>{v.mapLegend?.map((l: { name: string; c: string }) => (<span key={l.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={ix`width:12px;height:12px;border-radius:50%;background:${l.c}`}></span>{l.name}</span>))}<span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FDCD22', opacity: 0.7 }}></span>Vereda / barrio</span><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#B42318', boxShadow: '0 0 0 3px #FDE7E4' }}></span>Alerta de GPS</span></div></div>
                    <VisitsMap
                      center={v.mapCenter || [4.6372, -75.5706]}
                      markers={v.mapMarkers || []}
                      emptyLabel={v.mapEmpty ? `Todavía no hay visitas cerradas hoy en ${v.mapTerr}.` : undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
      
          {v.vPaths && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: 'clamp(22px,4vw,28px)' }}>Rutas</span><span style={{ color: '#5E5750' }}>Qué servicios recibe cada uno de los 15 perfiles. Los cambios pasan por aprobación clínica.</span></div>
              <div className="nara-tabs-scroll">{v.pathTabs?.map((pt) => (<button key={pt.label} onClick={() => pt.go()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:15px;font-weight:500;height:44px;padding:0 16px;border:none;background:none;border-bottom:3px solid ${pt.bd};color:${pt.fg};cursor:pointer;margin-bottom:-1px;white-space:nowrap;flex:none`}>{pt.label}</button>))}</div>
              </PageHead>
              {v.pathTab1 && (
              <div className="nara-split-panel-start">
                <div className="nara-scroll-x">
                <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px', display: 'grid', gridTemplateColumns: '110px repeat(3,minmax(0,1fr))', gap: '6px', minWidth: 420 }}>
                  <span></span><span style={{ textAlign: 'center', color: '#5E5750', fontSize: '13px' }}>Digital baja</span><span style={{ textAlign: 'center', color: '#5E5750', fontSize: '13px' }}>Media</span><span style={{ textAlign: 'center', color: '#5E5750', fontSize: '13px' }}>Alta</span>
                  {v.pm?.map((row, rowIdx) => (
                    <span key={rowIdx} style={{ display: 'contents' } as React.CSSProperties}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5E5750' }}><span style={ix`width:9px;height:9px;border-radius:2px;background:${row.c}`}></span>{row.k}</span>
                      {row.cells?.map((cell, cellIdx) => (<button key={cellIdx} type="button" onClick={() => cell.pick()} style={ix`font-family:Figtree,system-ui,sans-serif;height:62px;border-radius:10px;border:2px solid ${cell.bd};background:${cell.bg};color:${cell.fg};cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px`}><span style={{ fontWeight: '600', fontSize: '15px' }}>{cell.code}</span><span style={{ fontSize: '12px' }}>{cell.n} servicios</span></button>))}
                    </span>
                  ))}
                </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: 'clamp(20px,4vw,24px)' }}>{v.pe.title}</span><span style={{ color: '#5E5750' }}>{v.pe.people} personas hoy en este perfil</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}><span style={{ fontSize: '13px', color: '#5E5750' }}>Alcance</span><select value={String(v.scope ?? "")} onChange={v.setScope} style={{ height: '42px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '15px', background: '#fff', maxWidth: '100%' }}><option value="all">Todos los territorios</option>{v.terrNames?.map((n: string) => (<option key={n} value={n}>Solo {n}</option>))}</select></div></div>
                  {v.pe.rows?.map((s) => (
                    <div key={s.name || s.id} style={ix`display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:10px 0;border-top:1px solid #E6E1D9;opacity:${s.op}`}>
                      <div onClick={() => s.toggle()} style={ix`flex:none;width:52px;height:30px;border-radius:15px;background:${s.swBg};position:relative;cursor:${s.cur}`}><div style={ix`position:absolute;top:3px;left:${s.x};width:24px;height:24px;border-radius:12px;background:#fff`}></div></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 140px', minWidth: 0 }}><span style={{ fontWeight: '500' }}>{s.name}</span><span style={{ fontSize: '13px', color: '#5E5750' }}>{s.note}</span></div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: '1 1 200px' }}>
                        {s.freqs?.map((q) => (<button key={q.label} onClick={() => q.pick()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:14px;height:38px;padding:0 12px;border-radius:8px;border:1.5px solid ${q.bd};background:${q.bg};color:${q.fg};cursor:pointer`}>{q.label}</button>))}
                        {s.libBtn ? (
                          <button type="button" onClick={() => s.libBtn.go()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:14px;font-weight:500;height:38px;padding:0 14px;border-radius:8px;border:1.5px solid #161413;background:#FDCD22;color:#161413;cursor:pointer`}>
                            {s.libBtn.label}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {v.pe.warn && (<div style={{ background: '#F7E2D2', borderRadius: '10px', padding: '12px 14px', color: '#7A3A10', fontWeight: '500' }}>Atención: desde Moderado, el psicólogo IA no puede ser el único apoyo. Active el psicólogo clínico.</div>)}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', borderTop: '1px solid #E6E1D9', paddingTop: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '500' }}>Duración total</span>
                    {v.pe.durs?.map((d) => (<button key={d.label} onClick={() => d.pick()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:14px;height:38px;padding:0 14px;border-radius:8px;border:1.5px solid ${d.bd};background:${d.bg};color:${d.fg};cursor:pointer`}>{d.label}</button>))}
                    <button onClick={() => v.sendPath()} style={ix`margin-left:auto;font-family:Figtree,system-ui,sans-serif;font-size:15px;font-weight:500;height:46px;padding:0 20px;border-radius:10px;border:none;background:${v.pe.sendBg};color:#fff;cursor:pointer`}>Enviar a aprobación clínica</button>
                  </div>
                  <span style={{ color: '#5E5750' }}>{v.pe.status}</span>
                </div>
              </div>
              )}
              {v.pathTab3 && (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => v.closeLib?.()}
                  className="self-start border-none bg-transparent p-0 font-texto text-[15px] font-medium text-nara-tinta underline"
                >
                  ← Volver a servicios por perfil
                </button>
              <div className="nara-split-panel">
                <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}><span style={{ fontWeight: '500', fontSize: '17px' }}>Biblioteca de recursos</span><span style={{ fontSize: '13px', color: '#5E5750' }}>Fuente: Colección de cuentos del programa · aprueba la coordinadora clínica</span></div><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{v.lib.kinds?.map((k) => (<button key={k.label} onClick={() => k.go()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:14px;font-weight:500;height:40px;padding:0 14px;border-radius:14px;border:1.5px solid #161413;background:#fff;color:#161413;cursor:pointer;background:${k.bg}`}>{k.label}</button>))}</div></div>
                  <div className="nara-scroll-x">
                  <div style={{ minWidth: 520 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 150px 60px 90px', gap: '10px', padding: '8px 18px', background: '#F0ECE6', color: '#5E5750', fontSize: '13px', fontWeight: '500' }}><span>Recurso</span><span>Estado</span><span>Versión</span><span>Aprobado</span></div>
                  {v.lib.rows?.map((r) => (<div key={r.title} onClick={() => r.pick()} style={ix`display:grid;grid-template-columns:minmax(0,1.6fr) 150px 60px 90px;gap:10px;padding:9px 18px;border-top:1px solid #E6E1D9;align-items:center;cursor:pointer;background:${r.bg}`}><span style={{ display: 'flex', gap: '10px', alignItems: 'center', minWidth: '0' }}>{r.hasCover ? <img src={r.cover} alt="" style={{ flex: 'none', height: '40px', width: '31px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 1px 3px rgba(22,20,19,.25)', display: 'block' }} /> : null}<span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '0' }}><span style={{ fontWeight: '500' }}>{r.title}</span><span style={{ fontSize: '12px', color: '#5E5750' }}>{r.meta}</span></span></span><span style={ix`font-size:13px;font-weight:600;padding:3px 10px;border-radius:999px;background:${r.sBg};color:#161413;justify-self:start`}>{r.estado}</span><span>v{r.version}</span><span style={{ fontSize: '13px' }}>{r.fecha}</span></div>))}
                  </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                  {v.lib.hasSel && (<div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}><div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', minWidth: 0 }}>{v.lib.sel.hasCover ? <img src={v.lib.sel.cover} alt="" style={{ flex: 'none', width: '72px', aspectRatio: '600/780', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 3px 8px rgba(22,20,19,.2)' }} /> : null}<div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}><span style={{ fontWeight: '600', fontSize: '17px' }}>{v.lib.sel.title}</span>{v.lib.sel.hasTag && (<span style={{ fontSize: '12px', fontWeight: '600', padding: '3px 9px', borderRadius: '999px', background: '#FDE7E4', color: '#161413', alignSelf: 'flex-start' }}>{v.lib.sel.tag}</span>)}</div></div>
                    {v.lib.sel.fields?.map((f) => (<label key={f.k} className="nara-label-row" style={{ fontSize: '14px' }}><span style={{ color: '#5E5750' }}>{f.k}</span><input value={String(f.v ?? "")} onChange={f.set} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', width: '100%', boxSizing: 'border-box' }} /></label>))}
                    <label className="nara-label-row" style={{ fontSize: '14px' }}><span style={{ color: '#5E5750' }}>Estado</span><select value={String(v.lib.sel.estado ?? "")} onChange={v.lib.sel.setEstado} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', width: '100%' }}><option>Borrador</option><option>En revisión clínica</option><option>Aprobado</option><option>Retirado</option></select></label></div>)}
                  <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}><span style={{ fontWeight: '500', fontSize: '17px' }}>Editor de cursos</span><select onChange={v.lib.setCourse} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', minWidth: 0, maxWidth: '100%', width: 'min(100%, 260px)', boxSizing: 'border-box' }}>{v.lib.courseOpts?.map((o) => (<option key={String(o.v ?? o.l)} value={String(o.v ?? "")} defaultValue={o.s}>{o.l}</option>))}</select></div>
                    {v.lib.mods?.map((m) => (<div key={m.n} style={{ borderTop: '1px solid #E6E1D9', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}><span style={{ fontSize: '13px', fontWeight: '600' }}>Semana {m.n}</span><select onChange={m.setCuento} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>{m.cOpts?.map((o) => (<option key={String(o.v ?? o.l)} value={String(o.v ?? "")} defaultValue={o.s}>{o.l}</option>))}</select><div className="nara-course-week-pair"><select onChange={m.setTecnica} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>{m.tOpts?.map((o) => (<option key={String(o.v ?? o.l)} value={String(o.v ?? "")} defaultValue={o.s}>{o.l}</option>))}</select><select onChange={m.setVideo} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>{m.vOpts?.map((o) => (<option key={String(o.v ?? o.l)} value={String(o.v ?? "")} defaultValue={o.s}>{o.l}</option>))}</select></div><input value={String(m.pregunta ?? "")} onChange={m.setPregunta} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }} /></div>))}
                    <span style={{ fontSize: '13px', color: '#5E5750' }}>Los cuentos de uso restringido o con acompañamiento no se pueden poner en cursos guiados por TEO.</span></div>
                </div>
              </div>
              </div>
              )}
              {v.pathTab2 && (
                <div className="nara-split-panel" style={{ display: 'grid' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}><div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}><span style={{ fontWeight: '500', fontSize: '17px' }}>Reglas de clasificación</span><span style={{ fontSize: '13px', color: '#5E5750' }}>Cursos y canal según nivel de riesgo y capacidad digital: alta en la app, media por WhatsApp, baja con cuadernillo o con el experto. Los cambios pasan por aprobación clínica.</span>{v.lib.rules?.map((r) => (<div key={r.k} className="nara-label-row"><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}><span style={ix`width:10px;height:10px;border-radius:2px;background:${r.c}`}></span>{r.k}</span><input value={String(r.v ?? "")} onChange={r.set} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#161413', fontFamily: 'Figtree,system-ui,sans-serif', width: '100%', boxSizing: 'border-box' }} /></div>))}</div>
                    <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '21px' }}>Niveles de riesgo (PHQ-9)</span><span style={{ fontSize: '13px', color: '#5E5750' }}>Cambiarla requiere aprobación de la líder clínica</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1.6fr) 80px 80px', gap: '10px', fontSize: '13px', color: '#5E5750', fontWeight: '500' }}><span>Color</span><span>Nombre</span><span>Desde</span><span>Hasta</span></div>
                      {v.rRisk?.map((r) => (<div key={r.k} style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1.6fr) 80px 80px', gap: '10px', alignItems: 'center' }}><input type="color" value={String(r.c ?? "")} onChange={r.setC} style={{ width: '48px', height: '38px', border: '1px solid #DCD6CD', borderRadius: '8px', padding: '2px', background: '#fff', cursor: 'pointer' }} /><input value={String(r.k ?? "")} onChange={r.setK} style={{ height: '38px', borderRadius: '8px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '15px' }} /><input value={String(r.min ?? "")} onChange={r.setMin} inputMode="numeric" style={ix`height:38px;border-radius:8px;border:1.5px solid ${r.bd};padding:0 10px;font-size:15px`} /><input value={String(r.max ?? "")} onChange={r.setMax} inputMode="numeric" style={ix`height:38px;border-radius:8px;border:1.5px solid ${r.bd};padding:0 10px;font-size:15px`} /></div>))}
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '21px' }}>Capacidad digital</span><span style={{ fontSize: '13px', color: '#5E5750' }}>Puntaje máximo posible: {v.digMax}</span></div>
                      {v.rDigQ?.map((dq) => (<div key={dq.n} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #E6E1D9', paddingTop: '10px' }}><span style={{ fontWeight: '500' }}>{dq.n}. {dq.q}</span><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{dq.opts?.map((o, oi) => (<div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #DCD6CD', borderRadius: '8px', padding: '4px 4px 4px 10px' }}><input value={String(o.o ?? "")} onChange={o.setO} style={{ border: 'none', fontSize: '14px', width: '150px', fontFamily: 'Figtree,system-ui,sans-serif', color: '#161413' }} /><input value={String(o.p ?? "")} onChange={o.setP} inputMode="numeric" aria-label="Puntos" style={{ width: '36px', height: '30px', borderRadius: '6px', border: '1.5px solid #DCD6CD', textAlign: 'center', fontSize: '14px' }} /><span style={{ fontSize: '12px', color: '#5E5750', paddingRight: '4px' }}>pts</span></div>))}</div></div>))}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E6E1D9', paddingTop: '12px' }}><span style={{ fontWeight: '500' }}>Cortes</span><div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>{v.rCuts?.map((c) => (<div key={c.k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ minWidth: '48px' }}>{c.k}</span><input value={String(c.min ?? "")} onChange={c.setMin} inputMode="numeric" style={ix`width:44px;height:36px;border-radius:8px;border:1.5px solid ${c.bd};text-align:center;font-size:15px`} /><span>–</span><input value={String(c.max ?? "")} onChange={c.setMax} inputMode="numeric" style={ix`width:44px;height:36px;border-radius:8px;border:1.5px solid ${c.bd};text-align:center;font-size:15px`} /></div>))}</div></div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}><button onClick={() => v.sendRules()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:15px;font-weight:500;height:46px;padding:0 20px;border-radius:10px;border:none;background:${v.sendRulesBg};color:#fff;cursor:pointer`}>Enviar a aprobación de la líder clínica</button><button onClick={() => v.resetRules()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '15px', height: '46px', padding: '0 16px', borderRadius: '10px', border: '1.5px solid #DCD6CD', background: '#fff', color: '#161413', cursor: 'pointer' }}>Descartar cambios</button></div>
                      <span style={{ color: '#5E5750', fontSize: '14px' }}>{v.rulesStatus}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '20px' }}>Regla de crisis</span><span style={{ fontSize: '13px', fontWeight: '500', padding: '3px 9px', borderRadius: '6px', background: '#F0ECE6', color: '#161413' }}>Solo lectura</span></div>
                      <span style={{ fontSize: '17px', fontWeight: '500' }}>Pregunta 9 mayor que 0</span>
                      <span style={{ color: '#5E5750', lineHeight: '1.5' }}>Activa de inmediato el protocolo de crisis: línea 123, alerta a la clínica de turno (meta 30 min) y ruta de crisis. No se puede desactivar ni editar.</span>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '20px' }}>Asignación automática</span>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Qué experto recibe a cada persona nueva<select value={String(v.autoV.expert ?? "")} onChange={v.autoSet.expert} style={{ height: '42px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '15px', background: '#fff' }}><option value="territorio">El experto del territorio con menos carga</option><option value="vereda">El experto que cubre su vereda o barrio</option></select></label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Qué clínico recibe a cada paciente<select value={String(v.autoV.clin ?? "")} onChange={v.autoSet.clin} style={{ height: '42px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '15px', background: '#fff' }}><option value="territorio">El clínico asignado a su territorio</option><option value="carga">El clínico con menos carga del departamento</option></select></label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Cada cuánto se revisa la ruta<select value={String(v.autoV.review ?? "")} onChange={v.autoSet.review} style={{ height: '42px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '15px', background: '#fff' }}><option>Cada 2 semanas</option><option>Cada 4 semanas</option><option>Cada 8 semanas</option></select></label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><button onClick={() => v.saveAuto()} style={ix`font-family:Figtree,system-ui,sans-serif;font-size:15px;font-weight:500;height:42px;padding:0 16px;border-radius:10px;border:none;background:${v.autoBg};color:#fff;cursor:pointer`}>Guardar asignación</button></div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '20px' }}>Simulador</span><span style={{ fontSize: '13px', color: '#5E5750' }}>Con las reglas que ve en pantalla</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px' }}><label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Puntaje PHQ-9 (0–27)<input value={String(v.simPhq ?? "")} onChange={v.setSimPhq} inputMode="numeric" style={{ height: '42px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: '15px' }} /></label><label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Puntaje digital (0–{v.digMax})<input value={String(v.simDig ?? "")} onChange={v.setSimDig} inputMode="numeric" style={{ height: '42px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: '15px' }} /></label></div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px', alignItems: 'end' }}><label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '500' }}>Daño en la vivienda<select value={String(v.simDano ?? "")} onChange={v.setSimDano} style={{ height: '42px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 10px', fontSize: '15px', background: '#fff' }}><option value="0">Ninguno</option><option value="1">Parcial</option><option value="2">Total</option></select></label><div onClick={() => v.toggleSimLoss()} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', height: '42px' }}><span style={ix`width:20px;height:20px;border-radius:5px;border:2px solid ${v.simLossBd};background:${v.simLossBg};color:#fff;font-size:12px;display:grid;place-items:center;box-sizing:border-box`}>{v.simLossMark}</span>Perdió a un familiar</div></div>
                      <div onClick={() => v.toggleSimNoPhone()} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}><span style={ix`width:20px;height:20px;border-radius:5px;border:2px solid ${v.simNoPhoneBd};background:${v.simNoPhoneBg};color:#fff;font-size:12px;display:grid;place-items:center;box-sizing:border-box`}>{v.simNoPhoneMark}</span>Sin teléfono</div>
                      <div onClick={() => v.toggleSimQ9()} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}><span style={ix`width:20px;height:20px;border-radius:5px;border:2px solid ${v.simQ9Bd};background:${v.simQ9Bg};color:#fff;font-size:12px;display:grid;place-items:center;box-sizing:border-box`}>{v.simQ9Mark}</span>Pregunta 9 mayor que 0</div>
                      {v.simOk && (<div style={{ borderTop: '1px solid #E6E1D9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}><div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '24px' }}>{v.sim.code}</span><span style={ix`font-size:14px;font-weight:500;padding:3px 9px;border-radius:6px;background:${v.sim.bg};color:#161413`}>{v.sim.label}</span></div>{v.sim.crisis && (<span style={{ background: '#FDE7E4', color: '#8A1C14', borderRadius: '8px', padding: '8px 10px', fontWeight: '500' }}>Crisis: protocolo inmediato y ruta de crisis antes que la ruta del perfil.</span>)}{v.sim.services?.map((sv) => (<span key={sv.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '14px', borderTop: '1px solid #F0ECE6', paddingTop: '6px' }}><span style={{ fontWeight: '500' }}>{sv.name}</span><span style={{ color: '#5E5750', textAlign: 'right' }}>{sv.freq}</span></span>))}<span style={{ fontSize: '13px', color: '#5E5750' }}>Duración: {v.sim.months} meses</span></div>)}
                      {v.simBad && (<span style={{ color: '#9A4D14', fontWeight: '500' }}>Escriba puntajes dentro del rango.</span>)}
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '20px' }}>Historial de versiones</span>
                      {v.versions?.map((ver, i) => (<div key={`${ver.v}-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid #E6E1D9', paddingTop: '8px' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '14px' }}><span style={{ fontWeight: '500' }}>Versión {ver.v} · {ver.by}</span><span style={{ color: '#5E5750' }}>{ver.when}</span></div><span style={{ fontSize: '14px', lineHeight: '1.45' }}>{ver.what}</span></div>))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {v.vPeople && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: 'clamp(22px,4vw,28px)' }}>Personas</span>
                  <span style={{ color: '#5E5750' }}>
                    {v.peopleSample
                      ? 'Datos de prueba · 15 perfiles representativos (P01–P15), no toda la cohorte histórica'
                      : 'Cohorte completa · mayor carga operativa'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => v.togglePeopleSample?.()}
                    style={{
                      fontFamily: 'Figtree,system-ui,sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      height: '40px',
                      padding: '0 14px',
                      borderRadius: '9px',
                      border: '1.5px solid #161413',
                      background: v.peopleSample ? '#FDCD22' : '#fff',
                      color: '#161413',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {v.peopleSample ? '15 perfiles · activo' : 'Usar 15 perfiles'}
                  </button>
                  <span style={{ fontWeight: '500', padding: '6px 12px', borderRadius: '8px', background: '#fff', border: '1px solid #DCD6CD', whiteSpace: 'nowrap' }}>Datos de identidad ocultos</span>
                </div>
              </div>
              </PageHead>
              <div className="nara-kpi-grid">{v.pk?.map((k) => (<div key={k.label} style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ color: '#5E5750' }}>{k.label}</span><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '32px', lineHeight: '1.1' }}>{k.val}</span><span style={{ fontSize: '14px', color: '#5E5750' }}>{k.sub}</span></div>))}</div>
              <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #E6E1D9' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontWeight: '500', fontSize: '16px', marginRight: 'auto' }}>{v.rosterCount}</span><input value={String(v.q ?? "")} onChange={v.setQ} placeholder="Buscar código, nombre, territorio, vereda, experto…" style={{ height: '40px', width: '100%', maxWidth: '320px', borderRadius: '9px', border: '1.5px solid #DCD6CD', padding: '0 12px', fontSize: '14px', boxSizing: 'border-box' }} /><button onClick={() => v.exportRoster()} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '14px', fontWeight: '500', height: '40px', padding: '0 14px', borderRadius: '9px', border: '1.5px solid #161413', background: '#fff', color: '#161413', cursor: 'pointer', whiteSpace: 'nowrap' }}>Exportar (Excel)</button></div>
                  <div className="nara-form-grid-3" style={{ display: 'grid' }}>{v.pFilters?.map((f) => (<label key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#5E5750' }}>{f.label}<select value={String(f.val ?? "")} onChange={f.set} style={ix`height:38px;border-radius:8px;border:1.5px solid ${f.bd};padding:0 8px;font-size:14px;background:#fff;color:#161413`}>{f.opts?.map((o, i) => (<option key={`${f.label}-${String(o.v ?? o.l)}-${i}`} value={String(o.v ?? "")}>{o.l}</option>))}</select></label>))}</div>
                  {v.hasPF && (<button onClick={() => v.clearPF()} style={{ alignSelf: 'flex-start', fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '13px', border: 'none', background: 'none', color: '#161413', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}>Quitar filtros</button>)}
                </div>
                <div className="nara-scroll-x">
                <div style={{ minWidth: 960 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px minmax(0,1fr) minmax(0,1fr) 60px 70px minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr)', gap: '12px', padding: '10px 20px', background: '#F0ECE6', color: '#5E5750', fontSize: '13px', fontWeight: '500' }}><span>Código</span><span>Territorio</span><span>Vereda o barrio</span><span>Edad</span><span>Perfil</span><span>Avance en la ruta</span><span>Experto</span><span>Estado</span></div>
                <div style={{ maxHeight: '460px', overflow: 'auto' }}>
                  {v.roster?.map((p) => (<div key={p.code} onClick={() => p.open()} style={{ display: 'grid', gridTemplateColumns: '100px minmax(0,1fr) minmax(0,1fr) 60px 70px minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr)', gap: '12px', padding: '10px 20px', borderTop: '1px solid #E6E1D9', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }} ><span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: '13px' }}>{p.code}</span><span>{p.terr}</span><span>{p.place}</span><span>{p.age}</span><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={ix`width:8px;height:8px;border-radius:2px;background:${p.rc}`}></span>{p.profile}</span><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ flex: '1', height: '6px', borderRadius: '3px', background: '#E6E1D9' }}><div style={ix`height:100%;width:${p.pct};border-radius:3px;background:#161413`}></div></div><span style={{ fontSize: '12px', color: '#5E5750', whiteSpace: 'nowrap' }}>{p.prog}</span></div><span>{p.expert}</span><span style={ix`font-weight:${p.fw}`}>{p.status}</span></div>))}
                  {v.noRoster && (<span style={{ display: 'block', padding: '20px', color: '#5E5750' }}>Ninguna persona coincide con el filtro.</span>)}
                </div>
                </div>
                </div>
              </div>
              <div className="nara-split-panel" style={{ display: 'grid' }}>
                <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                  <span style={{ fontWeight: '500', fontSize: '16px' }}>Personas por perfil</span>
                  <div className="nara-scroll-x">
                  <div style={{ display: 'grid', gridTemplateColumns: '130px repeat(3,minmax(0,1fr))', gap: '6px', minWidth: 420 }}>
                    <span></span><span style={{ textAlign: 'center', color: '#5E5750', fontSize: '13px' }}>Digital baja</span><span style={{ textAlign: 'center', color: '#5E5750', fontSize: '13px' }}>Media</span><span style={{ textAlign: 'center', color: '#5E5750', fontSize: '13px' }}>Alta</span>
                    {v.heat?.map((row, rowIdx) => (
                      <span key={rowIdx} style={{ display: 'contents' } as React.CSSProperties}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5E5750' }}><span style={ix`width:9px;height:9px;border-radius:2px;background:${row.c}`}></span>{row.k}</span>
                        {row.cells?.map((c, ci) => (<div key={ci} style={ix`height:56px;border-radius:9px;background:${c.bg};color:${c.fg};display:flex;flex-direction:column;align-items:center;justify-content:center`}><span style={{ fontWeight: '600', fontSize: '17px' }}>{c.v}</span><span style={{ fontSize: '12px' }}>{c.code}</span></div>))}
                      </span>
                    ))}
                  </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                  <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontWeight: '500', fontSize: '16px' }}>Avance en la ruta</span>
                    {v.funnel?.map((f) => (<div key={f.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px,140px) minmax(0,1fr) 52px', gap: '10px', alignItems: 'center' }}><span style={{ fontSize: '13px', lineHeight: 1.3 }}>{f.label}</span><div style={{ height: '22px', background: '#F0ECE6', borderRadius: '5px', minWidth: 0 }}><div style={ix`height:100%;width:${f.w};background:#161413;border-radius:5px`}></div></div><span style={{ textAlign: 'right', fontWeight: '500' }}>{f.v}</span></div>))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontWeight: '500', fontSize: '16px' }}>Abandono por nivel digital</span>
                    {v.dropout?.map((f) => (<div key={f.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(72px,90px) minmax(0,1fr) 44px', gap: '10px', alignItems: 'center' }}><span>{f.label}</span><div style={{ height: '22px', background: '#F0ECE6', borderRadius: '5px', minWidth: 0 }}><div style={ix`height:100%;width:${f.w};background:${f.c};border-radius:5px`}></div></div><span style={{ textAlign: 'right', fontWeight: '500' }}>{f.v}</span></div>))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {v.vAssets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: 'clamp(22px,4vw,28px)' }}>Activos</span><span style={{ color: '#5E5750' }}>Manillas de monitoreo y tablets de campo</span></div>
              </PageHead>
              <div className="nara-kpi-grid-5">{v.bk?.map((k) => (<div key={k.label} style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ color: '#5E5750' }}>{k.label}</span><span style={{ fontFamily: 'Fredoka,Figtree,system-ui,sans-serif', fontWeight: '600', fontSize: '30px', lineHeight: '1.1' }}>{k.val}</span><span style={{ fontSize: '14px', color: '#5E5750' }}>{k.sub}</span></div>))}</div>
              <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', fontWeight: '500', fontSize: '16px' }}>Manillas por territorio</div>
                <div className="nara-scroll-x">
                <div style={{ minWidth: 860 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) repeat(5,minmax(0,1fr)) minmax(0,1.2fr)', gap: '12px', padding: '10px 20px', background: '#F0ECE6', color: '#5E5750', fontSize: '14px', fontWeight: '500' }}><span>Territorio</span><span>Asignadas</span><span>Entregadas</span><span>Envían datos</span><span>Sin datos</span><span>Disponibles</span><span>Estado</span></div>
                {v.brRows?.map((b) => (<div key={b.name} onClick={() => b.open()} style={ix`display:grid;grid-template-columns:minmax(0,1.2fr) repeat(5,minmax(0,1fr)) minmax(0,1.2fr);gap:12px;padding:12px 20px;border-top:1px solid #E6E1D9;align-items:center;cursor:pointer;background:${b.active ? '#FFF4CC' : '#fff'}`} ><span style={{ fontWeight: '500' }}>{b.name}</span><span>{b.a}</span><span>{b.d}</span><span>{b.s}</span><span>{b.n}</span><span style={{ fontWeight: '500' }}>{b.av}</span><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{b.low && (<span style={{ fontSize: '13px', fontWeight: '500', padding: '3px 8px', borderRadius: '5px', background: '#F9EBC8', color: '#161413' }}>Stock bajo</span>)}{b.canAssign && (<button type="button" onClick={(e) => b.assign(e)} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '14px', fontWeight: '500', height: '36px', padding: '0 12px', borderRadius: '14px', border: 'none', background: '#FDCD22', color: '#161413', cursor: 'pointer' }}>Asignar 100</button>)}</div></div>))}
                </div>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #DCD6CD', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', fontWeight: '500', fontSize: '16px' }}>Tablets de campo · 100 en total</div>
                <div className="nara-scroll-x">
                <div style={{ minWidth: 780 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) repeat(4,minmax(0,1fr)) minmax(0,1fr)', gap: '12px', padding: '10px 20px', background: '#F0ECE6', color: '#5E5750', fontSize: '14px', fontWeight: '500' }}><span>Territorio</span><span>Tablets</span><span>Sin sincronizar +24 h</span><span>En reparación</span><span>Última sincronización</span><span></span></div>
                {v.tabRows?.map((b) => (<div key={b.name} onClick={() => b.open()} style={ix`display:grid;grid-template-columns:minmax(0,1.2fr) repeat(4,minmax(0,1fr)) minmax(0,1fr);gap:12px;padding:12px 20px;border-top:1px solid #E6E1D9;align-items:center;cursor:${b.cur};background:${b.active ? '#FFF4CC' : '#fff'}`} ><span style={{ fontWeight: '500' }}>{b.name}</span><span>{b.n}</span><span style={ix`font-weight:${b.fw}`}>{b.ns}</span><span>{b.r}</span><span>{b.last}</span>{b.canAssign && (<button type="button" onClick={(e) => b.assign(e)} style={{ fontFamily: 'Figtree,system-ui,sans-serif', fontSize: '14px', fontWeight: '500', height: '36px', padding: '0 12px', borderRadius: '14px', border: 'none', background: '#FDCD22', color: '#161413', cursor: 'pointer' }}>{b.assignLabel}</button>)}</div>))}
                </div>
                </div>
              </div>

              <FormModal
                open={!!v.assetDetail}
                onClose={() => v.assetDetail?.close?.()}
                title={String(v.assetDetail?.title || "Detalle")}
                description="Resumen y unidades registradas en el territorio."
                size="lg"
                footer={(
                  <>
                    <button
                      type="button"
                      onClick={() => v.assetDetail?.openTerr?.()}
                      className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta"
                    >
                      Ver territorio
                    </button>
                    <button
                      type="button"
                      onClick={() => v.assetDetail?.close?.()}
                      className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-[18px] font-texto text-[15px] font-medium text-nara-tinta"
                    >
                      Cerrar
                    </button>
                  </>
                )}
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {v.assetDetail?.summary?.map((s: { label: string; val: string | number }) => (
                      <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-linea bg-nara-crema/50 px-3.5 py-3">
                        <span className="text-[13px] text-texto-secundario">{s.label}</span>
                        <span className="font-titulos text-2xl font-semibold">{s.val}</span>
                      </div>
                    ))}
                  </div>
                  {v.assetDetail?.items?.length ? (
                    <div className="overflow-hidden rounded-2xl border border-linea">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-2 bg-[#F0ECE6] px-3.5 py-2.5 text-[13px] font-medium text-texto-secundario sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                        <span>Código</span>
                        <span>Asignado a</span>
                        <span>Estado</span>
                        <span className="hidden sm:inline">Sync / batería</span>
                      </div>
                      {v.assetDetail.items.map((it: { code: string; who: string; state: string; sync: string; bat: string }) => (
                        <div key={it.code} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-2 border-t border-linea px-3.5 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                          <span className="font-medium">{it.code}</span>
                          <span className="min-w-0 truncate">{it.who}</span>
                          <span>{it.state}</span>
                          <span className="hidden text-texto-secundario sm:inline">{it.sync}{it.bat !== "—" ? ` · ${it.bat}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed text-texto-secundario">{v.assetDetail?.empty}</p>
                  )}
                </div>
              </FormModal>
            </div>
          )}
        
    </>
  );
}
