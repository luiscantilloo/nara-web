"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
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
    return (
      <div style={{ minHeight: "100vh", background: "#F0ECE6", fontFamily: "Figtree, system-ui, sans-serif" }} />
    );
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

            {vm.splash ? (
              <div
                aria-label="NARA"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 70,
                  background: "#FFA3D0",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  style={{
                    width: 148,
                    height: 148,
                    borderRadius: 40,
                    background: "#F0ECE6",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <img src={naraAsset("marca/logo/nara-isotipo.svg")} alt="NARA" style={{ width: 112, height: 112, display: "block" }} />
                </div>
              </div>
            ) : null}

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
    <>
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
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#161413" }}>
          <img src={naraAsset("marca/logo/nara-logo.svg")} alt="NARA" style={{ height: 34, width: "auto", display: "block" }} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={vm.openHelp}
            aria-label="Necesito ayuda ahora"
            style={{
              ...btnFont(),
              fontSize: 15,
              fontWeight: 600,
              height: 48,
              padding: "0 14px 0 10px",
              borderRadius: 24,
              border: "none",
              background: "#B42318",
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
            Ayuda
          </button>
          <UserMenu compact />
        </div>
      </div>

      <div ref={vm.bodyRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", fontSize: 17 }}>
        {vm.tabHome ? (
          <div style={{ animation: "naraTab .22s ease-out", padding: "6px 18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={naraAsset("marca/logo/nara-isotipo.svg")} alt="" style={{ flex: "none", width: 48, height: 48, display: "block" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.15 }}>
                  {vm.greet}, {vm.firstName || "Paciente"}
                </span>
                <span style={{ color: "#5E5750" }}>Martes 29 de septiembre</span>
              </div>
            </div>
            {!vm.hasAnyModule ? (
              <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Sin módulos activos</span>
                <span style={{ color: "#5E5750", lineHeight: 1.45 }}>
                  Su ruta aún no tiene servicios en la app. Cuando el equipo active alguno, aparecerá aquí.
                </span>
              </div>
            ) : null}
            {vm.mods?.mood ? (
            <div className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-titulos text-[17px] font-semibold text-nara-tinta">
                    ¿Cómo se siente hoy?
                  </span>
                  <span className="font-texto text-[13px] text-texto-secundario">
                    {vm.moodDone
                      ? "TEO le acompaña en este check-in"
                      : "Toque un número para empezar"}
                  </span>
                </div>
                <img
                  src={vm.moodDone ? vm.moodFace : naraAsset("marca/logo/teo-isotipo.svg")}
                  alt=""
                  className={`h-10 w-10 shrink-0 ${vm.moodDone ? "" : "opacity-80"}`}
                  style={vm.moodDone ? { animation: "naraMoodIn .35s ease-out" } : undefined}
                />
              </div>
              {!vm.moodDone || vm.moodStep === "why" ? (
              <div className="grid grid-cols-5 gap-1.5">
                {vm.moods.map((m) => (
                  <button
                    key={m.n}
                    type="button"
                    onClick={m.pick}
                    aria-pressed={m.on}
                    disabled={vm.moodDone && vm.moodStep !== "why"}
                    className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2.5 font-texto transition-transform active:scale-95 disabled:opacity-70"
                    style={{
                      ...btnFont(),
                      border: `1.5px solid ${m.bd}`,
                      background: m.bg,
                      color: m.fg,
                      transform: `scale(${m.scale})`,
                      animation: m.on ? "naraMoodPop .4s ease-out" : undefined,
                      boxShadow: m.on ? "0 2px 0 rgba(22,20,19,.08)" : "none",
                    }}
                  >
                    <span className="text-xl font-semibold leading-none">{m.n}</span>
                    <span className="text-[11px] leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
              ) : vm.moodDone ? (
                <div className="flex items-center gap-2 rounded-xl border border-linea bg-superficie-2 px-3 py-2">
                  <span className="font-titulos text-[15px] font-semibold text-nara-tinta">
                    Hoy: {vm.moods.find((m) => m.on)?.label}
                  </span>
                  {vm.moodLow ? (
                    <span className="rounded-full bg-crisis-suave px-2 py-0.5 font-texto text-[12px] text-crisis-texto">
                      Con cuidado
                    </span>
                  ) : null}
                </div>
              ) : null}
              {vm.moodDone ? (
                <div
                  className="flex flex-col gap-3 rounded-2xl bg-superficie-2 px-3 py-3"
                  style={{ animation: "naraMoodIn .35s ease-out" }}
                >
                  <div className="flex max-h-56 flex-col gap-2.5 overflow-y-auto">
                    {vm.moodThread.map((b, i) =>
                      b.me ? (
                        <div key={i} className="flex justify-end">
                          <span className="max-w-[90%] rounded-2xl rounded-br-md bg-nara-amarillo px-3 py-2 font-texto text-[14px] leading-snug text-nara-tinta">
                            {b.text}
                          </span>
                        </div>
                      ) : (
                        <div key={i} className="flex items-start gap-2">
                          <img src={vm.moodFace} alt="" className="mt-0.5 h-7 w-7 shrink-0" />
                          <span className="max-w-[90%] rounded-2xl rounded-bl-md border border-linea bg-nara-blanco px-3 py-2 font-texto text-[14px] leading-snug text-nara-tinta">
                            {b.text}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                  {vm.moodBreathing ? (
                    <div className="rounded-2xl border border-linea bg-nara-blanco py-3">
                      <BreathExercise onDone={vm.onMoodBreathDone} />
                    </div>
                  ) : null}
                  {vm.moodActions?.length ? (
                    <div className="flex flex-col gap-2">
                      {vm.moodActions.map((a) => (
                        <button
                          key={a.label}
                          type="button"
                          onClick={a.go}
                          className={
                            a.danger
                              ? "rounded-full bg-crisis px-4 py-2.5 text-center font-texto text-[15px] font-semibold text-nara-blanco"
                              : a.primary
                                ? "rounded-full bg-nara-amarillo px-4 py-2.5 text-center font-texto text-[15px] font-semibold text-nara-tinta"
                                : "rounded-full border border-linea bg-nara-blanco px-4 py-2.5 text-center font-texto text-[15px] text-nara-tinta"
                          }
                          style={btnFont()}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={vm.moodChange}
                    className="pt-0.5 text-center font-texto text-[13px] text-texto-secundario underline-offset-2 hover:underline"
                    style={btnFont()}
                  >
                    Empezar de nuevo
                  </button>
                </div>
              ) : null}
            </div>
            ) : null}
            {vm.callCard ? (
            <div style={{ background: "#FFC0E0", borderRadius: 20, padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ color: "#161413", fontSize: 15, fontWeight: 600 }}>{vm.callCard.title}</span>
                <span style={{ fontWeight: 500 }}>{vm.callCard.when}</span>
                <span>{vm.callCard.clin} · {vm.callCard.phone}</span>
                <span style={{ fontSize: 14, color: "#5E5750" }}>{vm.callCard.body}</span>
              </div>
              <img src={naraAsset("marca/personajes/nara-energia.svg")} alt="" style={{ flex: "none", width: 48, height: "auto", display: "block" }} />
            </div>
            ) : null}
            {vm.waCard ? (
            <div style={{ background: "#D8FBE3", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontWeight: 600, color: "#161413" }}>{vm.waCard.title}</span>
              <span style={{ lineHeight: 1.45 }}>{vm.waCard.body}</span>
              <span style={{ fontSize: 14, color: "#5E5750" }}>{vm.waCard.tip}</span>
            </div>
            ) : null}
            {vm.mods?.videos ? (
            <div
              role="button"
              tabIndex={0}
              onClick={vm.openVideosLib}
              onKeyDown={(e) => e.key === "Enter" && vm.openVideosLib()}
              style={{
                transition: "transform .12s",
                background: "#FFE189",
                borderRadius: 20,
                padding: 16,
                display: "flex",
                gap: 14,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Videos psicoeducativos</span>
                <span>Biblioteca de videos · sueño, miedo, calma</span>
                <span style={{ fontWeight: 600, textDecoration: "underline" }}>Abrir biblioteca →</span>
              </div>
              <img src={naraAsset("marca/personajes/nara-curiosidad.svg")} alt="" style={{ flex: "none", width: 48, height: "auto", display: "block" }} />
            </div>
            ) : null}
            {vm.revisitCard ? (
            <div style={{ background: "#F0ECE6", border: "1px solid #DCD6CD", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{vm.revisitCard.title}</span>
              <span style={{ fontWeight: 500 }}>{vm.revisitCard.expert} · {vm.revisitCard.freq}</span>
              <span style={{ lineHeight: 1.45 }}>{vm.revisitCard.body}</span>
              <span style={{ fontSize: 14, color: "#5E5750" }}>{vm.revisitCard.tip}</span>
            </div>
            ) : null}
            {vm.groupCard ? (
            <div style={{ background: "#E8F0E4", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{vm.groupCard.title}</span>
              <span style={{ fontWeight: 500 }}>{vm.groupCard.freq} · {vm.groupCard.channel}</span>
              <span style={{ lineHeight: 1.45 }}>{vm.groupCard.body}</span>
              <span style={{ fontSize: 14, color: "#5E5750" }}>{vm.groupCard.tip}</span>
            </div>
            ) : null}
            {vm.socialCard ? (
            <div style={{ background: "#FFF4CC", border: "1px solid #DCD6CD", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{vm.socialCard.title}</span>
              <span style={{ fontWeight: 500 }}>{vm.socialCard.status}</span>
              <span style={{ lineHeight: 1.45 }}>{vm.socialCard.body}</span>
              <span style={{ fontSize: 14, color: "#5E5750" }}>{vm.socialCard.tip}</span>
            </div>
            ) : null}
            {vm.showCourse && vm.dc ? (
              <div
                role="button"
                tabIndex={0}
                onClick={vm.openCursos}
                style={{
                  transition: "transform .12s",
                  background: "#A9D4FF",
                  borderRadius: 20,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img src={vm.dc.cover} alt="" style={{ flex: "none", width: 48, height: 62, objectFit: "cover", borderRadius: 8, boxShadow: "0 2px 6px rgba(22,20,19,.25)", display: "block" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Cursos y cuentos</span>
                    <span style={{ fontWeight: 500, lineHeight: 1.3 }}>
                      {vm.dc.title} · semana {vm.dc.week} de {vm.dc.weeks}
                    </span>
                  </div>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,.7)" }}>
                  <div style={{ width: vm.dc.pctW, height: "100%", borderRadius: 5, background: "#161413" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{vm.dc.doneLabel}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const mod = vm.dc?.mods[(vm.dc.week || 1) - 1];
                      if (mod?.slug) vm.openReader(mod.slug);
                    }}
                    style={{
                      ...btnFont(),
                      fontSize: 16,
                      fontWeight: 600,
                      minHeight: 48,
                      padding: "0 18px",
                      borderRadius: 14,
                      border: "none",
                      background: "#FDCD22",
                      color: "#161413",
                      cursor: "pointer",
                    }}
                  >
                    Seguir
                  </button>
                </div>
              </div>
            ) : null}
            {vm.mods?.cursos && !vm.dc ? (
            <div
              role="button"
              tabIndex={0}
              onClick={vm.openCursos}
              style={{
                background: "#A9D4FF",
                borderRadius: 20,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <span style={{ fontWeight: 600 }}>Cursos y cuentos</span>
              <span>Tiene acceso a la biblioteca de cuentos de su ruta.</span>
              <span style={{ fontWeight: 600, textDecoration: "underline" }}>Abrir cuentos →</span>
            </div>
            ) : null}
            {vm.showTech ? (
            <div
              role="button"
              tabIndex={0}
              onClick={vm.startTechnique}
              style={{
                transition: "transform .12s",
                background: "#A9D4FF",
                color: "#161413",
                borderRadius: 20,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <img src={naraAsset("marca/personajes/nara-calma.svg")} alt="" style={{ flex: "none", width: 44, height: "auto", display: "block" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Técnica de hoy</span>
                <span style={{ fontWeight: 500 }}>Respiración 4-6 · 2 min</span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, background: "#fff", color: "#161413", borderRadius: 20, padding: "10px 14px" }}>Empezar</span>
            </div>
            ) : null}
          </div>
        ) : null}

        {vm.tabChat && vm.mods?.ia ? <DianaChat vm={vm} /> : null}
        {vm.tabRes ? <DianaResumen vm={vm} /> : null}
        {vm.tabRoute ? <DianaRoute vm={vm} /> : null}
        {vm.tabHist ? <DianaHist vm={vm} /> : null}
      </div>

      {(vm.tabCount || 0) > 0 ? (
      <div
        role="tablist"
        className="grid shrink-0 border-t border-linea bg-nara-blanco px-1.5 pt-1.5"
        style={{
          paddingBottom: 10,
          gridTemplateColumns: `repeat(${vm.tabCount || vm.tabs.length || 2}, minmax(0, 1fr))`,
        }}
      >
        {vm.tabs.map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={t.on}
            onClick={t.go}
            className={`relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 font-texto text-[13px] outline-none after:pointer-events-none after:absolute after:right-2 after:bottom-0 after:left-2 after:h-[3px] after:content-[''] ${
              t.on
                ? "font-semibold text-nara-tinta after:bg-[#FDCD22]"
                : "font-medium text-texto-secundario after:bg-transparent"
            }`}
          >
            <span className="grid h-7 place-items-center">
              {t.isHome ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
                </svg>
              ) : null}
              {t.isTeo ? (
                <img src={naraAsset("marca/logo/teo-isotipo.svg")} alt="" style={{ width: 28, height: 28, display: "block", opacity: t.op }} />
              ) : null}
              {t.isRoute ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="19" r="2.2" />
                  <circle cx="18" cy="5" r="2.2" />
                  <path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8" />
                </svg>
              ) : null}
              {t.isHist ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20V4" />
                  <path d="M4 20h16" />
                  <path d="M8 16v-4M12 16V8M16 16v-6" />
                </svg>
              ) : null}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      ) : null}

      {vm.rdOpen && vm.rdView ? <ReaderOverlay vm={vm} /> : null}
      {vm.plOpen && vm.plView ? <PlayerOverlay vm={vm} /> : null}
      {vm.helpOpen ? <HelpSheet vm={vm} /> : null}
    </>
  );
}

function DianaChat({ vm }: { vm: Vm }) {
  return (
    <div style={{ animation: "naraTab .22s ease-out", display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ margin: "0 14px", background: "#fff", border: "1px solid #DCD6CD", borderRadius: 12, padding: "10px 12px", fontSize: 14, lineHeight: 1.4, color: "#161413" }}>
        TEO es un acompañante con inteligencia artificial. No reemplaza a su psicóloga. Si está en peligro, use el botón de ayuda.
      </div>
      <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {vm.chatMsgs.map((m, i) => (
          <div key={i}>
            {m.ai ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "90%", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <img src={m.avatar} alt="" style={{ flex: "none", width: 36, height: 36, display: "block", marginTop: 18 }} />
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#5E5750", display: "flex", gap: 6, alignItems: "center" }}>
                    TEO <span style={{ fontSize: 11, fontWeight: 500, border: "1px solid #5E5750", borderRadius: 4, padding: "0 4px" }}>IA</span>
                  </span>
                  <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: "4px 18px 18px 18px", padding: "11px 14px", lineHeight: 1.45 }}>{m.text}</div>
                </div>
              </div>
            ) : null}
            {m.me ? (
              <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "#161413", color: "#fff", borderRadius: "18px 4px 18px 18px", padding: "11px 14px", lineHeight: 1.45, marginLeft: "auto" }}>{m.text}</div>
            ) : null}
            {m.crisis ? (
              <div style={{ alignSelf: "stretch", background: "#FDE7E4", border: "1.5px solid #B42318", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#8A1C14" }}>
                  <img src={naraAsset("marca/personajes/teo-calma.svg")} alt="" style={{ width: 36, height: 36, display: "block" }} />
                  TEO · IA · mensaje de cuidado
                </span>
                <span style={{ lineHeight: 1.45 }}>{m.text}</span>
                {vm.dianaLines.map((cl) => (
                  <a key={cl.label} href={cl.tel} style={{ minHeight: 52, padding: "4px 14px", boxSizing: "border-box", borderRadius: 26, border: "2px solid #B42318", background: cl.bg, color: cl.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 16, textAlign: "center", textDecoration: "none" }}>
                    <span>{cl.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 400 }}>{cl.sub}</span>
                  </a>
                ))}
              </div>
            ) : null}
            {m.breath ? (
              <div style={{ alignSelf: "stretch", background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <BreathExercise onDone={vm.onBreathDone} />
              </div>
            ) : null}
          </div>
        ))}
        {vm.typing ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5E5750" }}>
            <img src={naraAsset("marca/personajes/teo-duda.svg")} alt="" style={{ width: 32, height: 32, display: "block" }} />
            TEO está escribiendo…
          </span>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          {vm.quick.map((q) => (
            <button key={q.label} type="button" onClick={q.go} style={{ ...btnFont(), fontSize: 16, minHeight: 48, padding: "0 16px", borderRadius: 22, border: "1.5px solid #161413", background: "#fff", color: "#161413", cursor: "pointer" }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      {vm.paused ? (
        <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #DCD6CD", padding: 14, textAlign: "center", fontWeight: 500, fontSize: 16 }}>
          Conversación en pausa · el equipo la llamará
        </div>
      ) : null}
      {vm.notPaused ? (
        <div style={{ position: "sticky", bottom: 0, background: "#F0ECE6", borderTop: "1px solid #DCD6CD", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {vm.askChips.map((q) => (
              <button key={q.label} type="button" onClick={q.go} style={{ flex: "none", ...btnFont(), fontSize: 15, minHeight: 48, padding: "0 14px", borderRadius: 22, border: "1px solid #DCD6CD", background: "#fff", color: "#161413", cursor: "pointer" }}>
                {q.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={vm.input}
              onChange={(e) => vm.setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && vm.sendDiana()}
              placeholder="Escríbale a TEO"
              style={{ flex: 1, height: 48, borderRadius: 24, border: "1.5px solid #DCD6CD", padding: "0 16px", fontSize: 17, background: "#fff", fontFamily: "Figtree, system-ui, sans-serif" }}
            />
            <button type="button" onClick={() => vm.sendDiana()} style={{ ...btnFont(), fontSize: 16, fontWeight: 500, height: 48, padding: "0 16px", borderRadius: 24, border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer" }}>
              Enviar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
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

function DianaHist({ vm }: { vm: Vm }) {
  return (
    <div style={{ animation: "naraTab .22s ease-out", padding: "6px 18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 28 }}>Historial</span>
      <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontWeight: 500 }}>Cuestionario de ánimo</span>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 120, padding: "0 6px" }}>
          {vm.hist.map((h) => (
            <div key={h.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, justifyContent: "flex-end", height: "100%" }}>
              <span style={{ fontWeight: 500 }}>{h.v}</span>
              <div style={{ width: "100%", height: h.h, background: "#A9D4FF", borderRadius: "6px 6px 2px 2px" }} />
              <span style={{ fontSize: 13, color: "#5E5750" }}>{h.d}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 16 }}>Más bajo es mejor. Empezó en 15, hoy está en 9.</span>
      </div>
      <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontWeight: 500 }}>Quién ve sus datos</span>
        <span style={{ fontSize: 16, lineHeight: 1.45 }}>
          <b style={{ fontWeight: 500 }}>Su psicóloga</b> ve todo, también sus conversaciones con TEO.
        </span>
        <span style={{ fontSize: 16, lineHeight: 1.45 }}>
          <b style={{ fontWeight: 500 }}>Su experta de campo</b> ve su ruta y sus citas. No ve sus conversaciones.
        </span>
        <span style={{ fontSize: 16, lineHeight: 1.45 }}>
          <b style={{ fontWeight: 500 }}>Los informes del programa</b> usan datos sin su nombre.
        </span>
      </div>
      <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: "6px 16px" }}>
        {vm.consents.map((c) => (
          <div key={c.label} role="button" tabIndex={0} onClick={c.toggle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #E6E1D9", cursor: "pointer", minHeight: 48 }}>
            <span style={{ fontSize: 16, lineHeight: 1.35 }}>{c.label}</span>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, color: "#5E5750" }}>{c.state}</span>
              <div style={{ width: 52, height: 30, borderRadius: 15, background: c.bg, position: "relative" }}>
                <div style={{ position: "absolute", top: 3, left: c.x, width: 24, height: 24, borderRadius: 12, background: "#fff" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <NaraMsgAlert msg={vm.consentMsg} onClear={() => vm.clearConsentMsg()} />
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

function HelpSheet({ vm }: { vm: Vm }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(22,20,19,.45)", display: "flex", alignItems: "flex-end", zIndex: 66 }}>
      <div style={{ background: "#fff", width: "100%", borderRadius: "24px 24px 0 0", padding: "22px 20px 34px", display: "flex", flexDirection: "column", gap: 12, fontSize: 17 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#A9D4FF", borderRadius: 16, padding: "12px 14px" }}>
          <img src={naraAsset("marca/personajes/nara-calma.svg")} alt="" style={{ flex: "none", width: 40, height: "auto", display: "block" }} />
          <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 24, lineHeight: 1.2 }}>Ayuda ahora</span>
        </div>
        <span style={{ lineHeight: 1.45 }}>{vm.helpText}</span>
        {vm.dianaLines.map((cl) => (
          <a key={cl.label} href={cl.tel} style={{ minHeight: 58, padding: "4px 14px", boxSizing: "border-box", borderRadius: 29, border: "2px solid #B42318", background: cl.bg, color: cl.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 17, textAlign: "center", textDecoration: "none" }}>
            <span>{cl.label}</span>
            <span style={{ fontSize: 12, fontWeight: 400 }}>{cl.sub}</span>
          </a>
        ))}
        {vm.helpNotSent ? (
          <button type="button" onClick={vm.askCall} style={{ ...btnFont(), fontSize: 17, fontWeight: 500, height: 56, borderRadius: 28, border: "2px solid #161413", background: "#fff", color: "#161413", cursor: "pointer" }}>
            Pedir que me llamen ya
          </button>
        ) : null}
        <button type="button" onClick={vm.closeHelp} style={{ ...btnFont(), fontSize: 16, border: "none", background: "none", color: "#161413", height: 48, cursor: "pointer" }}>
          Cerrar
        </button>
      </div>
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
