"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import {
  ClinPanel,
  IaPanel,
  MoodPanel,
  PacienteHerramientasNav,
  PacienteHomeTools,
  RevisitPanel,
  TechPanel,
} from "@/modules/paciente/herramientas";
import { BreathExercise } from "./BreathExercise";
import { naraAsset } from "./naraAsset";
import { usePacienteScreen } from "./usePacienteScreen";

const globalCss = `
@keyframes naraTab{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes naraDrop{from{opacity:0;transform:translateY(-120%)}to{opacity:1;transform:none}}
@keyframes naraMoodIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes naraMoodPop{0%{transform:scale(.94)}60%{transform:scale(1.05)}100%{transform:scale(1.03)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

export function PacienteScreen() {
  const vm = usePacienteScreen();

  if (!vm.ready) {
    return <NaraLoadingScreen />;
  }

  if (vm.needsAppConsent) {
    return <ConsentimientoApp onAccept={vm.acceptAppConsent} />;
  }

  return (
    <>
      <style>{globalCss}</style>
      <div
        style={{
          minHeight: "100vh",
          fontFamily: "Figtree, system-ui, sans-serif",
          color: "#161413",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#F0ECE6",
        }}
      >
        <div
          data-screen-label="Paciente"
          style={{
            position: "relative",
            flex: "none",
            width: vm.devW,
            height: vm.devH,
            zoom: vm.devZoom,
            borderRadius: vm.devR,
            border: vm.devBd,
            boxShadow: vm.devSh,
            background: "#161413",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              background: "#F0ECE6",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              borderRadius: vm.scrR,
            }}
          >
            {vm.framed ? (
              <div
                aria-hidden
                style={{
                  flex: "none",
                  height: 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 28px 0 34px",
                  fontSize: 15,
                  fontWeight: 600,
                  background: vm.sbBg,
                  color: vm.sbFg,
                  position: "relative",
                  zIndex: 56,
                }}
              >
                <span>{vm.clock}</span>
                <span
                  style={{
                    position: "absolute",
                    top: 11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 118,
                    height: 32,
                    borderRadius: 18,
                    background: "#161413",
                  }}
                />
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
                    <rect x="0" y="8" width="3" height="4" rx="1" />
                    <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                    <rect x="10" y="3" width="3" height="9" rx="1" />
                    <rect x="15" y="0" width="3" height="12" rx="1" />
                  </svg>
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M1 4.2a10 10 0 0 1 14 0" />
                    <path d="M3.6 7a6.3 6.3 0 0 1 8.8 0" />
                    <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
                  </svg>
                  <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
                    <rect x="0.75" y="0.75" width="22.5" height="11.5" rx="3.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                    <rect x="2.5" y="2.5" width="16" height="8" rx="2" fill="currentColor" />
                    <rect x="24.5" y="4.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
                  </svg>
                </span>
              </div>
            ) : null}

            {vm.splash ? <NaraLoadingScreen /> : null}

            {vm.framed ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 134,
                  height: 5,
                  borderRadius: 3,
                  background: vm.gestC,
                  zIndex: 58,
                  pointerEvents: "none",
                }}
              />
            ) : null}

            {vm.dev ? (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 60,
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 11,
                  color: "#5E5750",
                  background: "#fff",
                  border: "1px solid #DCD6CD",
                  padding: "2px 6px",
                  borderRadius: 5,
                }}
              >
                {vm.screenCode}
              </span>
            ) : null}

            {vm.hasBanner ? (
              <div
                role="presentation"
                onClick={vm.openBanner}
                style={{
                  position: "absolute",
                  top: vm.bannerTop,
                  left: 10,
                  right: 10,
                  zIndex: 57,
                  animation: "naraDrop .35s ease-out",
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 10px 30px rgba(22,20,19,.25)",
                  padding: "12px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                }}
              >
                <img src={naraAsset("marca/logo/nara-isotipo.svg")} alt="" style={{ flex: "none", width: 36, height: 36, display: "block" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>NARA</span>
                    <span style={{ fontSize: 12, color: "#5E5750" }}>ahora</span>
                  </div>
                  <span style={{ fontSize: 15, lineHeight: 1.4 }}>{vm.bannerText}</span>
                </div>
                <button
                  type="button"
                  onClick={vm.dismissBanner}
                  aria-label="Cerrar"
                  style={{
                    flex: "none",
                    width: 32,
                    height: 32,
                    border: "none",
                    background: "none",
                    fontSize: 18,
                    color: "#5E5750",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ) : null}

            {vm.isDiana ? <DianaApp vm={vm} /> : null}
            {vm.isRosalba ? <RosalbaWA vm={vm} /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

type Vm = ReturnType<typeof usePacienteScreen>;

function btnFont(): CSSProperties {
  return { fontFamily: "Figtree, system-ui, sans-serif" };
}

function DianaApp({ vm }: { vm: Vm }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        style={{
          flex: "none",
          padding: "6px 16px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          background: "#F0ECE6",
          borderBottom: "1px solid #E6E1D9",
        }}
      >
        <button
          type="button"
          onClick={() => (vm.goHome as (() => void) | undefined)?.()}
          aria-label="Ir al inicio"
          className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-nara-tinta"
        >
          <img
            src={naraAsset("marca/logo/nara-logo.svg")}
            alt="NARA"
            style={{ height: 34, width: "auto", display: "block" }}
          />
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!vm.helpOpen && !vm.crisisAlertSent && !vm.inactiveOpen ? (
            <button
              type="button"
              onClick={vm.openHelp}
              aria-label="Estoy en crisis"
              style={{
                ...btnFont(),
                fontSize: 14,
                fontWeight: 600,
                height: 48,
                padding: "0 14px 0 10px",
                borderRadius: 24,
                border: "none",
                background: "#6B0000",
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3.5" />
                <path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
              </svg>
              Estoy en crisis
            </button>
          ) : null}
          {!vm.helpOpen && !vm.crisisAlertSent && !vm.inactiveOpen ? (
            <UserMenu compact />
          ) : null}
        </div>
      </div>

      <div ref={vm.bodyRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", fontSize: 17 }}>
        {vm.tabHome ? (
          <div className="flex flex-col gap-3.5 px-[18px] pb-[22px] pt-1.5 font-texto [animation:naraTab_.22s_ease-out]">
            <div className="flex items-center gap-3">
              <img
                src={naraAsset("marca/logo/nara-isotipo.svg")}
                alt=""
                className="h-12 w-12 shrink-0"
              />
              <div className="flex flex-col gap-0.5">
                <span className="font-titulos text-[28px] font-semibold leading-tight text-nara-tinta">
                  {vm.greet}, {vm.firstName || "Paciente"}
                </span>
                <span className="text-texto-secundario">Inicio</span>
              </div>
            </div>
            <PacienteHomeTools
              items={
                (vm.herramientaNav as
                  | {
                      id: "mood" | "clin" | "ia" | "tech" | "revisit" | "cursos";
                      name: string;
                      navLabel: string;
                      on: boolean;
                      go: () => void;
                      disabled?: boolean;
                    }[]
                  | undefined) || []
              }
            />
          </div>
        ) : null}

        {vm.tabMood && vm.mods?.mood ? (
          <div className="px-[18px] pb-[22px] pt-1.5 [animation:naraTab_.22s_ease-out]">
            <MoodPanel patientId={String(vm.patientId || "")} />
          </div>
        ) : null}

        {vm.tabChat && vm.mods?.ia ? <DianaChat vm={vm} /> : null}
        {vm.tabRes ? <DianaResumen vm={vm} /> : null}
        {vm.tabRoute ? <DianaRoute vm={vm} /> : null}
        {vm.tabClin && vm.mods?.clin ? (
          <ClinPanel patientId={String(vm.patientId || "")} />
        ) : null}
        {vm.tabTech && vm.mods?.tech ? (
          <TechPanel patientId={String(vm.patientId || "")} />
        ) : null}
        {vm.tabRevisit && vm.mods?.revisit ? (
          <RevisitPanel patientId={String(vm.patientId || "")} />
        ) : null}
      </div>

      {(vm.herramientaNavCount || vm.tabCount || 0) > 0 &&
      !vm.helpOpen &&
      !vm.inactiveOpen ? (
        <PacienteHerramientasNav
          items={
            (vm.herramientaNav as
              | {
                  id: "mood" | "clin" | "ia" | "tech" | "revisit" | "cursos";
                  name: string;
                  navLabel: string;
                  on: boolean;
                  go: () => void;
                  disabled?: boolean;
                }[]
              | undefined) || []
          }
        />
      ) : null}

      {vm.rdOpen && vm.rdView && !vm.helpOpen && !vm.inactiveOpen ? (
        <ReaderOverlay vm={vm} />
      ) : null}
      {vm.plOpen && vm.plView && !vm.helpOpen && !vm.inactiveOpen ? (
        <PlayerOverlay vm={vm} />
      ) : null}
      {vm.helpOpen ? <CrisisLockScreen vm={vm} /> : null}
      {!vm.helpOpen && vm.inactiveOpen ? <InactiveLockScreen vm={vm} /> : null}
    </div>
  );
}

function DianaChat({ vm }: { vm: Vm }) {
  return <IaPanel vm={vm} />;
}

function DianaResumen({ vm }: { vm: Vm }) {
  return (
    <div style={{ animation: "naraTab .22s ease-out", padding: "6px 18px 22px", display: "flex", flexDirection: "column", gap: 14, fontSize: 19 }}>
      <button type="button" onClick={vm.closeResumen} style={{ alignSelf: "flex-start", ...btnFont(), fontSize: 16, border: "none", background: "none", color: "#161413", cursor: "pointer", padding: 0, minHeight: 48 }}>
        ← Inicio
      </button>
      <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2 }}>Mi resumen</span>
      <span style={{ fontSize: 15, color: "#5E5750" }}>Semana del 23 al 29 de septiembre</span>
      {vm.res.blocks.map((b) => (
        <div key={b.t} style={{ background: "#fff", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 6, borderLeft: "6px solid #161413" }}>
          <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 18 }}>{b.t}</span>
          <span style={{ lineHeight: 1.5 }}>{b.x}</span>
        </div>
      ))}
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Días que practicó la respiración</span>
        <div style={{ display: "flex", gap: 8 }}>
          {vm.res.dots.map((d) => (
            <div key={d.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #161413", background: d.bg, boxSizing: "border-box" }} />
              <span style={{ fontSize: 13, color: "#5E5750" }}>{d.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 18 }}>Para su sesión del {vm.sesionDia}</span>
        <span style={{ fontSize: 16, lineHeight: 1.45 }}>Temas que podría querer hablar, según lo que nos contó. Quite o agregue los que quiera.</span>
        {vm.topics.map((t) => (
          <div key={t.label} role="button" tabIndex={0} onClick={t.toggle} style={{ display: "flex", gap: 12, alignItems: "center", minHeight: 48, cursor: "pointer" }}>
            <span style={{ flex: "none", width: 28, height: 28, borderRadius: 7, border: "2px solid #161413", background: t.bg, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>{t.mark}</span>
            <span style={{ fontSize: 17, lineHeight: 1.35 }}>{t.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={vm.topicInput} onChange={(e) => vm.setTopicInput(e.target.value)} placeholder="Agregar un tema" style={{ flex: 1, height: 48, borderRadius: 12, border: "1.5px solid #DCD6CD", padding: "0 12px", fontSize: 17, fontFamily: "Figtree, system-ui, sans-serif" }} />
          <button type="button" onClick={vm.addTopic} style={{ ...btnFont(), fontSize: 16, fontWeight: 500, height: 48, padding: "0 14px", borderRadius: 14, border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer" }}>
            Agregar
          </button>
        </div>
      </div>
      <Link href="/informe?t=resumen-diana&back=/paciente" style={{ fontSize: 16, minHeight: 48, display: "flex", alignItems: "center", color: "#161413", textDecoration: "none" }}>
        Ver como página para imprimir →
      </Link>
    </div>
  );
}

function DianaRoute({ vm }: { vm: Vm }) {
  return (
    <div style={{ animation: "naraTab .22s ease-out", padding: "6px 18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 28 }}>Mi ruta</span>
      {vm.showCourse && vm.dc ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 21 }}>Su curso asignado</span>
            <span style={{ fontSize: 14, color: "#5E5750" }}>{vm.dc.doneLabel}</span>
          </div>
          <span style={{ fontWeight: 500, lineHeight: 1.3 }}>{vm.dc.title}</span>
          <span style={{ fontSize: 14, color: "#5E5750", lineHeight: 1.4 }}>
            Solo ve la semana actual y las que ya hizo. Las próximas se abren cuando toque.
          </span>
          {vm.dc.mods.map((m) => (
            <div key={m.n} style={{ background: "#fff", border: m.bd, borderRadius: 20, padding: 12, display: "flex", gap: 12 }}>
              <button type="button" aria-label="Abrir el cuento" onClick={() => vm.openReader(m.slug)} style={{ flex: "none", border: "none", padding: 0, background: "none", cursor: "pointer", alignSelf: "flex-start" }}>
                <img src={m.cover} alt={m.cuento} style={{ width: 64, height: 80, objectFit: "cover", borderRadius: 10, boxShadow: "0 3px 8px rgba(22,20,19,.22)", display: "block" }} />
              </button>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#5E5750" }}>Semana {m.n}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: m.chipBg, color: "#161413" }}>{m.state}</span>
                </div>
                <span style={{ fontWeight: 600, lineHeight: 1.25 }}>{m.cuento}</span>
                <button type="button" onClick={() => vm.playItem(m.tecnicaId)} style={{ ...btnFont(), textAlign: "left", border: "none", background: "#F0ECE6", borderRadius: 12, minHeight: 48, padding: "6px 10px", fontSize: 14, color: "#161413", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "100%", boxSizing: "border-box", whiteSpace: "normal" }}>
                  <img src={naraAsset("marca/personajes/nara-calma.svg")} alt="" style={{ width: 22, height: "auto" }} />
                  <span style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>{m.tech}</span>
                  <span style={{ flex: "none", fontWeight: 600 }}>{m.techCount}</span>
                </button>
                <button type="button" onClick={() => vm.playItem(m.videoId)} style={{ ...btnFont(), textAlign: "left", border: "none", background: "#F0ECE6", borderRadius: 12, minHeight: 48, padding: "6px 10px", fontSize: 14, color: "#161413", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "100%", boxSizing: "border-box", whiteSpace: "normal" }}>
                  <img src={naraAsset("marca/personajes/nara-curiosidad.svg")} alt="" style={{ width: 22, height: "auto" }} />
                  <span style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>{m.video}</span>
                  <span style={{ flex: "none", fontWeight: 600 }}>Ver</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {!vm.showCourse && vm.lib.tabs.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 21 }}>
          Su contenido de esta semana
        </span>
        <span style={{ fontSize: 14, color: "#5E5750", lineHeight: 1.4 }}>
          Solo ve lo que su ruta le asignó. No es la biblioteca completa.
        </span>
        {vm.lib.tabs.length > 1 ? (
        <div role="tablist" style={{ display: "grid", gridTemplateColumns: `repeat(${vm.lib.tabs.length}, 1fr)`, gap: 6, background: "#E6E1D9", borderRadius: 14, padding: 4 }}>
          {vm.lib.tabs.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={t.on} onClick={() => vm.setLibTab(t.key)} style={{ ...btnFont(), fontSize: 15, fontWeight: t.fw, minHeight: 44, border: "none", borderRadius: 11, background: t.bg, color: "#161413", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
        ) : null}
        {vm.lib.isCuentos ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {vm.lib.cuentos.map((c) => (
              <button key={c.slug} type="button" onClick={() => vm.openReader(c.slug)} style={{ ...btnFont(), border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, color: "#161413", whiteSpace: "normal", minWidth: 0 }}>
                <img src={c.cover} alt="" style={{ width: "100%", aspectRatio: "600/780", objectFit: "cover", borderRadius: 12, boxShadow: "0 4px 12px rgba(22,20,19,.22)", display: "block" }} />
                <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{c.title}</span>
                <span style={{ fontSize: 13, color: "#5E5750" }}>{c.meta}</span>
              </button>
            ))}
          </div>
        ) : null}
        {vm.lib.isList ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vm.lib.items.map((v) => (
              <button key={v.id} type="button" onClick={() => vm.playItem(v.id)} style={{ ...btnFont(), border: "none", background: "#fff", borderRadius: 16, padding: 10, display: "flex", gap: 12, alignItems: "center", textAlign: "left", cursor: "pointer", color: "#161413", minHeight: 64, whiteSpace: "normal" }}>
                <span style={{ flex: "none", width: 64, height: 52, borderRadius: 12, background: v.bg, display: "grid", placeItems: "center" }}>
                  <img src={v.char} alt="" style={{ height: 36, width: "auto", display: "block" }} />
                </span>
                <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 600, lineHeight: 1.25 }}>{v.title}</span>
                  <span style={{ fontSize: 13, color: "#5E5750" }}>{v.meta}</span>
                </span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{v.cta}</span>
              </button>
            ))}
          </div>
        ) : null}
        {vm.lib.empty ? <span style={{ color: "#5E5750" }}>Aún no hay contenido asignado para esta semana.</span> : null}
      </div>
      ) : null}
      {vm.route.length ? (
      <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: "6px 16px" }}>
        {vm.route.map((r) => (
          <div key={r.name} style={{ padding: "12px 0", borderBottom: "1px solid #E6E1D9", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{r.name}</span>
              <span style={{ fontWeight: 500 }}>{r.val}</span>
            </div>
            {r.hasBar ? (
              <div style={{ height: 8, borderRadius: 4, background: "#E6E1D9" }}>
                <div style={{ width: r.pct, height: "100%", borderRadius: 4, background: "#161413" }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      ) : null}
      {vm.hasRouteChanges ? (
        <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontWeight: 500 }}>Cambios en su ruta</span>
          {vm.routeChanges.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, borderTop: "1px solid #E6E1D9", paddingTop: 8 }}>
              <span style={{ fontSize: 14, color: "#5E5750" }}>{c.d}</span>
              <span style={{ lineHeight: 1.45 }}>{c.x}</span>
            </div>
          ))}
        </div>
      ) : null}
      <span style={{ fontSize: 15, color: "#5E5750" }}>Su psicóloga revisa su ruta cada mes.</span>
    </div>
  );
}

function ReaderOverlay({ vm }: { vm: Vm }) {
  const rd = vm.rdView!;
  return (
    <div role="dialog" aria-label="Lector de cuentos" style={{ position: "absolute", inset: 0, zIndex: 66, background: "#161413", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}>
        <button type="button" onClick={vm.closeReader} aria-label="Cerrar" style={{ flex: "none", width: 48, height: 48, border: "none", background: "none", color: "#fff", fontSize: 26, cursor: "pointer" }}>
          ×
        </button>
        <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rd.title}</span>
        <span style={{ flex: "none", fontSize: 14, padding: "0 10px" }}>{rd.counter}</span>
      </div>
      {rd.isPage ? (
        <>
          <div
            onTouchStart={(e) => {
              vm.touchXRef.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - (vm.touchXRef.current || 0);
              if (Math.abs(dx) > 40) vm.goPage(dx < 0 ? 1 : -1);
            }}
            style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}
          >
            <img src={rd.img} alt={rd.alt} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, display: "block", userSelect: "none" }} />
            {rd.noPages ? (
              <span style={{ position: "absolute", left: 16, right: 16, bottom: 14, background: "rgba(22,20,19,.85)", borderRadius: 12, padding: "10px 12px", fontSize: 14, lineHeight: 1.4 }}>
                Este cuento está en audio. Toque «Escuchar» para oírlo completo.
              </span>
            ) : null}
          </div>
          <div style={{ flex: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: 28, padding: "10px 0 0" }}>
            <button type="button" onClick={() => vm.goPage(-1)} aria-label="Página anterior" style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.9)", color: "#161413", fontSize: 22, cursor: "pointer", opacity: rd.prevOp }}>
              ‹
            </button>
            <button type="button" onClick={() => vm.goPage(1)} aria-label="Página siguiente" style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.9)", color: "#161413", fontSize: 22, cursor: "pointer" }}>
              ›
            </button>
          </div>
          <div style={{ flex: "none", padding: "10px 14px 30px", display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={vm.toggleReaderAudio}
              style={{ flex: "none", ...btnFont(), fontSize: 15, fontWeight: 600, minHeight: 48, padding: "0 16px", borderRadius: 24, border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer" }}
            >
              {rd.audioLabel}
            </button>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.25)" }}>
                <div style={{ width: rd.aW, height: "100%", borderRadius: 3, background: "#FDCD22" }} />
              </div>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Cuento narrado · {rd.aTime}</span>
            </div>
          </div>
        </>
      ) : null}
      {rd.isQ ? (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "#F0ECE6", color: "#161413", borderRadius: "24px 24px 0 0", padding: "20px 18px 34px", display: "flex", flexDirection: "column", gap: 14, fontSize: 17 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFE189", borderRadius: 16, padding: "12px 14px" }}>
            <img src={naraAsset("marca/personajes/nara-curiosidad.svg")} alt="" style={{ flex: "none", width: 36, height: "auto" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 20 }}>Preguntas para conversar</span>
              <span style={{ fontSize: 14 }}>{rd.qCounter}</span>
            </div>
          </div>
          <span style={{ fontWeight: 600, fontSize: 19, lineHeight: 1.35 }}>{rd.q}</span>
          <textarea value={rd.ans} onChange={(e) => vm.rdUpd({ ans: e.target.value })} placeholder="Si quiere, escriba su respuesta" style={{ minHeight: 110, borderRadius: 14, border: "1.5px solid #DCD6CD", padding: 12, fontSize: 17, fontFamily: "Figtree, system-ui, sans-serif", resize: "none", background: "#fff", color: "#161413" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Compartir con mi psicóloga</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button type="button" onClick={() => vm.rdUpd({ share: true })} aria-pressed={rd.share} style={{ ...btnFont(), fontSize: 16, minHeight: 48, borderRadius: 14, border: "1.5px solid #161413", background: rd.yesBg, color: "#161413", cursor: "pointer" }}>
                Sí
              </button>
              <button type="button" onClick={() => vm.rdUpd({ share: false })} style={{ ...btnFont(), fontSize: 16, minHeight: 48, borderRadius: 14, border: "1.5px solid #161413", background: rd.noBg, color: "#161413", cursor: "pointer" }}>
                No
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            <button type="button" onClick={() => vm.answerQ(true)} style={{ ...btnFont(), fontSize: 15, fontWeight: 500, minHeight: 48, padding: "0 14px", borderRadius: 14, border: "1.5px solid #161413", background: "#fff", color: "#161413", cursor: "pointer", flex: 1 }}>
              Saltar
            </button>
            <button type="button" onClick={() => vm.answerQ(false)} style={{ ...btnFont(), fontSize: 16, fontWeight: 600, minHeight: 48, padding: "0 18px", borderRadius: 14, border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer", flex: 1 }}>
              {rd.nextLabel}
            </button>
          </div>
        </div>
      ) : null}
      {rd.isDone ? (
        <div style={{ flex: 1, background: "#F0ECE6", color: "#161413", borderRadius: "24px 24px 0 0", padding: "24px 18px 34px", display: "flex", flexDirection: "column", gap: 14, fontSize: 17, alignItems: "flex-start" }}>
          <img src={naraAsset("marca/personajes/nara-energia.svg")} alt="" style={{ width: 56, height: "auto" }} />
          <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 22, lineHeight: 1.25 }}>{rd.doneTitle}</span>
          <span style={{ lineHeight: 1.45 }}>{rd.doneText}</span>
          <button type="button" onClick={vm.closeReader} style={{ ...btnFont(), fontSize: 16, fontWeight: 600, minHeight: 48, padding: "0 18px", borderRadius: 14, border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer", marginTop: "auto", alignSelf: "stretch" }}>
            Volver
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PlayerOverlay({ vm }: { vm: Vm }) {
  const pl = vm.plView!;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 66, background: "rgba(22,20,19,.45)", display: "flex", alignItems: "flex-end" }}>
      <div role="dialog" aria-label={pl.title} style={{ background: "#fff", width: "100%", borderRadius: "24px 24px 0 0", padding: "20px 18px 34px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ height: 150, borderRadius: 18, background: pl.bg, display: "grid", placeItems: "center" }}>
          <img src={pl.char} alt="" style={{ height: 96, width: "auto", display: "block" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 21, lineHeight: 1.25 }}>{pl.title}</span>
          <span style={{ fontSize: 14, color: "#5E5750" }}>{pl.meta}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 8, borderRadius: 4, background: "#E6E1D9" }}>
            <div style={{ width: pl.w, height: "100%", borderRadius: 4, background: "#161413" }} />
          </div>
          <span style={{ fontSize: 13, color: "#5E5750" }}>{pl.time}</span>
        </div>
        {pl.done ? <span style={{ fontWeight: 500 }}>{pl.doneText}</span> : null}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={vm.plClose} style={{ ...btnFont(), fontSize: 15, fontWeight: 500, minHeight: 48, padding: "0 14px", borderRadius: 14, border: "1.5px solid #161413", background: "#fff", color: "#161413", cursor: "pointer", flex: 1 }}>
            Cerrar
          </button>
          <button type="button" onClick={vm.plToggle} style={{ ...btnFont(), fontSize: 16, fontWeight: 600, minHeight: 48, padding: "0 18px", borderRadius: 14, border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer", flex: 1 }}>
            {pl.label}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pantalla amarilla: inactividad · botón redondo «Volví» (mismo lenguaje que «ayuda»). */
function InactiveLockScreen({ vm }: { vm: Vm }) {
  return (
    <div
      role="alertdialog"
      aria-label="Inactividad"
      aria-modal="true"
      className="absolute inset-0 z-[115] flex flex-col items-center justify-center bg-nara-amarillo px-8"
    >
      <button
        type="button"
        disabled={!!vm.confirmBackBusy}
        onClick={() => (vm.confirmBack as () => void)?.()}
        className={[
          "flex h-[min(72vw,280px)] w-[min(72vw,280px)] max-h-[42vh] max-w-[42vh] flex-col items-center justify-center gap-3 rounded-full border-[6px] border-nara-tinta bg-nara-blanco font-titulos font-bold uppercase tracking-[0.12em] text-nara-tinta shadow-[0_0_0_10px_rgba(22,20,19,0.12),0_0_0_22px_rgba(22,20,19,0.06)]",
          vm.confirmBackBusy
            ? "cursor-wait opacity-70"
            : "cursor-pointer active:scale-[0.97]",
        ].join(" ")}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
        <span className="text-[clamp(2rem,9vw,3.25rem)] leading-none">
          {vm.confirmBackBusy ? "..." : "Volví"}
        </span>
      </button>
    </div>
  );
}

/** Pantalla roja sangre: «ayuda» → espera → «estoy bien» solo tras atención clínica. */
function CrisisLockScreen({ vm }: { vm: Vm }) {
  const sent = !!vm.crisisAlertSent;
  const attended = !!vm.crisisAttended;
  return (
    <div
      role="alertdialog"
      aria-label={
        !sent ? "Confirmar ayuda" : attended ? "Confirmar que está bien" : "Crisis activa"
      }
      aria-modal="true"
      className="absolute inset-0 z-[120] flex flex-col items-center justify-center gap-8 bg-[#6B0000] px-8"
    >
      {!sent ? (
        <button
          type="button"
          onClick={vm.askCall}
          className="flex h-[min(72vw,280px)] w-[min(72vw,280px)] max-h-[42vh] max-w-[42vh] cursor-pointer flex-col items-center justify-center gap-3 rounded-full border-[6px] border-white bg-white font-titulos font-bold uppercase tracking-[0.12em] text-[#6B0000] shadow-[0_0_0_10px_rgba(255,255,255,0.22),0_0_0_22px_rgba(255,255,255,0.1)] active:scale-[0.97]"
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
          </svg>
          <span className="text-[clamp(2rem,9vw,3.25rem)] leading-none">ayuda</span>
        </button>
      ) : (
        <>
          <p className="m-0 max-w-[20rem] text-center font-titulos text-[clamp(1.35rem,5.5vw,1.85rem)] font-semibold leading-snug text-white">
            {attended
              ? "El equipo ya te atendió. Cuando te sientas bien, confírmalo."
              : "Ya avisamos al equipo. Nos pondremos en contacto contigo."}
          </p>
          {attended ? (
            <button
              type="button"
              disabled={!!vm.confirmWellBusy}
              onClick={() => (vm.confirmWell as () => void)?.()}
              className={[
                "min-h-16 w-full max-w-[20rem] rounded-full border-0 px-8 py-4 font-titulos text-[clamp(1.25rem,5vw,1.65rem)] font-bold tracking-wide text-[#6B0000]",
                vm.confirmWellBusy
                  ? "cursor-wait bg-white/70"
                  : "cursor-pointer bg-white active:scale-[0.98]",
              ].join(" ")}
            >
              {vm.confirmWellBusy ? "guardando..." : "estoy bien"}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function RosalbaWA({ vm }: { vm: Vm }) {
  return (
    <>
      <div style={{ flex: "none", background: "#161413", color: "#fff", padding: "6px 10px 8px 4px", display: "flex", alignItems: "center", gap: 6 }}>
        <button type="button" aria-label="Atrás" style={{ flex: "none", width: 40, height: 48, border: "none", background: "none", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <img src={naraAsset("marca/whatsapp-perfil-640.png")} alt="" style={{ flex: "none", width: 42, height: 42, borderRadius: "50%", display: "block" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            NARA <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", color: "#161413", fontSize: 11, display: "grid", placeItems: "center", fontWeight: 700 }}>✓</span>
          </span>
          <span style={{ fontSize: 13, opacity: 0.9 }}>en línea</span>
        </div>
        <UserMenu compact />
      </div>
      <div style={{ flex: "none", background: "#fff", borderBottom: "1px solid #DCD6CD", padding: "6px 14px", fontSize: 13, color: "#5E5750", textAlign: "center" }}>
        Celular de Paola (hija) · para doña Rosalba
      </div>
      <div ref={vm.waRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", background: "#EDE8E0", padding: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 17 }}>
        {vm.waMapped.map((m, i) => (
          <div key={i}>
            {m.sys ? (
              <span style={{ alignSelf: "center", background: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 13, color: "#5E5750", display: "block", textAlign: "center", margin: "0 auto" }}>{m.text}</span>
            ) : null}
            {m.inText ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "84%", background: "#fff", borderRadius: "4px 14px 14px 14px", padding: "9px 12px", lineHeight: 1.4 }}>
                {m.text}
                <span style={{ display: "block", textAlign: "right", fontSize: 12, color: "#5E5750", marginTop: 2 }}>{m.time}</span>
              </div>
            ) : null}
            {m.isAudio ? (
              <div style={{ alignSelf: m.align as "flex-start" | "flex-end", maxWidth: "86%", width: 280, background: m.bg, borderRadius: 14, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {m.hasTitle ? <span style={{ fontSize: 15, fontWeight: 500 }}>{m.title}</span> : null}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button type="button" onClick={m.play} aria-label="Reproducir audio" style={{ flex: "none", width: 48, height: 48, borderRadius: "50%", border: "none", background: "#FDCD22", color: "#161413", fontSize: 16, cursor: "pointer" }}>
                    {m.icon}
                  </button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, height: 30 }}>
                    {m.bars.map((b, j) => (
                      <span key={j} style={{ flex: 1, borderRadius: 2, height: b.h, background: b.c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: "#5E5750" }}>{m.dur}</span>
                </div>
                {m.hasCaption ? <span style={{ fontSize: 15, lineHeight: 1.4 }}>{m.caption}</span> : null}
                {m.hasTranscript ? (
                  <div style={{ borderTop: "1px solid #DCD6CD", paddingTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 12, color: "#5E5750", fontWeight: 500 }}>Transcripción automática</span>
                    <span style={{ fontSize: 15, lineHeight: 1.4 }}>«{m.transcript}»</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            {m.isCard ? (
              <div style={{ alignSelf: "flex-start", width: "84%", background: "#fff", borderRadius: "4px 14px 14px 14px", padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ background: "#F0ECE6", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10, borderTop: "6px solid #161413" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#161413" }}>
                    <img src={naraAsset("marca/logo/nara-logo.svg")} alt="NARA" style={{ height: 34, width: "auto", display: "block" }} />
                  </div>
                  <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 20, lineHeight: 1.2 }}>Mi resumen · doña Rosalba</span>
                  {m.lines.map((l) => (
                    <div key={l.t} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#161413" }}>{l.t}</span>
                      <span style={{ fontSize: 16, lineHeight: 1.4 }}>{l.x}</span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "#5E5750", textAlign: "right", padding: "0 6px 2px" }}>Imagen · {m.time}</span>
              </div>
            ) : null}
            {m.isStory ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "84%", background: "#fff", borderRadius: "4px 14px 14px 14px", padding: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                <img src={m.cover} alt="Portada del cuento" style={{ width: 200, aspectRatio: "600/780", objectFit: "cover", borderRadius: 12, display: "block", boxShadow: "0 3px 8px rgba(22,20,19,.2)" }} />
                <span style={{ padding: "2px 6px", lineHeight: 1.4 }}>{m.text}</span>
                <span style={{ display: "block", textAlign: "right", fontSize: 12, color: "#5E5750", padding: "0 6px 2px" }}>{m.time}</span>
              </div>
            ) : null}
            {m.isAsk ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "84%", background: "#fff", borderRadius: "4px 14px 14px 14px", padding: "9px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ lineHeight: 1.4 }}>{m.text}</span>
                {m.open ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {m.opts.map((o) => (
                      <button key={o.label} type="button" onClick={o.go} style={{ ...btnFont(), fontSize: 16, minHeight: 48, borderRadius: 10, border: "1.5px solid #161413", background: "#fff", color: "#161413", fontWeight: 500, cursor: "pointer" }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <span style={{ display: "block", textAlign: "right", fontSize: 12, color: "#5E5750" }}>{m.time}</span>
              </div>
            ) : null}
            {m.meText ? (
              <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#FFF4CC", borderRadius: "14px 4px 14px 14px", padding: "9px 12px", lineHeight: 1.4 }}>
                <span>{m.text}</span>
                <span style={{ display: "block", textAlign: "right", fontSize: 12, color: "#5E5750", marginTop: 2 }}>{m.time} ✓✓</span>
              </div>
            ) : null}
            {m.crisis ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "90%", background: "#FDE7E4", border: "1.5px solid #B42318", borderRadius: "4px 14px 14px 14px", padding: "10px 12px", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: 8 }}>
                <span>{m.text}</span>
                {vm.rosaLines.map((cl) => (
                  <a key={cl.label} href={cl.tel} style={{ minHeight: 48, padding: "4px 14px", boxSizing: "border-box", borderRadius: 24, border: "2px solid #B42318", background: cl.bg, color: cl.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 16, textAlign: "center", textDecoration: "none" }}>
                    <span>{cl.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 400 }}>{cl.sub}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-start" }}>
          {vm.waQuick.map((q) => (
            <button key={q.label} type="button" onClick={q.go} style={{ ...btnFont(), fontSize: 16, minHeight: 48, minWidth: 44, padding: "0 16px", borderRadius: 10, border: "none", background: "#fff", color: "#161413", fontWeight: 500, cursor: "pointer", boxShadow: "0 1px 0 #CFC8BE" }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: "none", background: "#EDE8E0", padding: "8px 10px 18px", display: "flex", gap: 8 }}>
        <input
          value={vm.waInput}
          onChange={(e) => vm.setWaInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && vm.waSendText()}
          placeholder="Mensaje · escriba AYUDA si la necesita"
          style={{ flex: 1, height: 48, borderRadius: 24, border: "none", padding: "0 16px", fontSize: 16, background: "#fff", fontFamily: "Figtree, system-ui, sans-serif" }}
        />
        {vm.waEmpty ? (
          <button type="button" aria-label="Grabar audio" style={{ flex: "none", width: 48, height: 48, borderRadius: "50%", border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v3" />
            </svg>
          </button>
        ) : null}
        {vm.waHasText ? (
          <button type="button" onClick={() => vm.waSendText()} aria-label="Enviar" style={{ flex: "none", width: 48, height: 48, borderRadius: "50%", border: "none", background: "#FDCD22", color: "#161413", fontSize: 18, cursor: "pointer" }}>
            ➤
          </button>
        ) : null}
      </div>
    </>
  );
}

/**
 * P-01 (TRL 2026-10-10): consentimiento del primer ingreso a la app. El consentimiento de la evaluación
 * lo firmó con el experto en la visita; aquí acepta el uso de la app antes de que se registre nada desde ella.
 */
function ConsentimientoApp({ onAccept }: { onAccept: () => void }) {
  const puntos = [
    "La app guarda lo que usted registre: su estado de ánimo, sus conversaciones con TEO y sus pedidos de ayuda.",
    "Su psicólogo clínico y el experto de su territorio pueden ver esa información para acompañarle.",
    "TEO es un asistente con inteligencia artificial: no reemplaza a su psicólogo ni da diagnósticos.",
    "Si usted reporta una crisis, el equipo clínico le contactará.",
    "Puede retirar su consentimiento cuando quiera: dígaselo a su experto de campo o a su psicólogo.",
  ];
  return (
    <main
      data-testid="paciente-consentimiento"
      className="flex min-h-screen items-center justify-center bg-nara-crema px-4 py-8"
    >
      <section className="flex w-full max-w-[520px] flex-col gap-4 rounded-[20px] border border-linea bg-nara-blanco p-6">
        <h1 className="font-titulos text-2xl font-semibold text-nara-tinta">Antes de empezar</h1>
        <p className="font-texto text-base text-nara-tinta">
          Lea estos puntos. Si está de acuerdo, toque «Acepto y continúo».
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5 font-texto text-[15px] text-nara-tinta">
          {puntos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onAccept}
          className="h-12 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-base font-medium text-nara-tinta"
        >
          Acepto y continúo
        </button>
        <p className="font-texto text-sm text-texto-secundario">
          Si no está de acuerdo, cierre la app y hable con su experto de campo.
        </p>
      </section>
    </main>
  );
}
