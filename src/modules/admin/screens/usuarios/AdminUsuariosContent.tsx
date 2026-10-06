"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormModal } from "@/components/shared/form-modal/FormModal";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { ix } from "../inlineStyle";

export function AdminUsuariosContent({ v }: { v: Record<string, any> }) {
  return (
    <>
      <PageHead>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold text-nara-tinta">
            Usuarios y permisos
          </span>
          <span className="text-[15px] text-texto-secundario">
            Quién entra a NARA, con qué rol y qué puede ver
          </span>
        </div>
        <button
          type="button"
          onClick={() => v.newUser()}
          className="h-11 w-full cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta sm:w-auto sm:self-start"
        >
          + Crear usuario
        </button>
      </PageHead>

      <NaraMsgAlert
        msg={v.msg}
        onClear={() => v.clearMsg?.()}
      />
      <NaraMsgAlert
        msg={v.err}
        onClear={() => v.clearErr?.()}
      />

      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex min-w-0 flex-wrap gap-2">
          {v.roleChips?.map((c: any) => (
            <button
              key={c.key}
              type="button"
              onClick={() => c.go()}
              className="h-9 shrink-0 cursor-pointer rounded-full border-[1.5px] px-3 font-texto text-[13px] text-nara-tinta sm:text-sm"
              style={{ borderColor: c.bd, background: c.bg }}
            >
              {c.label} · {c.n}
            </button>
          ))}
        </div>
        <input
          value={v.q}
          onChange={v.setQ}
          placeholder="Buscar por nombre u organización"
          className="box-border h-10 w-full min-w-0 rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-sm text-nara-tinta sm:max-w-sm"
        />
      </div>

      <p className="text-sm text-texto-secundario md:hidden">
        Toque un usuario para editarlo, o cree uno nuevo.
      </p>

      {/* Móvil: tarjetas */}
      <div className="flex flex-col gap-2 md:hidden">
        {v.users?.map((u: any) => (
          <button
            key={u.key}
            type="button"
            onClick={() => u.pick()}
            className="flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl border border-linea px-4 py-3.5 text-left"
            style={{ background: u.bg || "#fff" }}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-nara-tinta">{u.name}</span>
                <span className="truncate text-xs text-texto-secundario">{u.contact}</span>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-nara-tinta">
                <span
                  className="size-2 rounded-full"
                  style={{ background: u.sc }}
                />
                {u.status}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 text-sm">
              <span className="text-nara-tinta">{u.role}</span>
              {u.mods ? (
                <span className="text-xs text-texto-secundario">{u.mods}</span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-sm text-texto-secundario">
              <span className="min-w-0 break-words">{u.org}</span>
              {u.terr ? <span className="min-w-0 break-words">{u.terr}</span> : null}
            </div>
          </button>
        ))}
        {v.noUsers ? (
          <div className="rounded-2xl border border-linea bg-nara-blanco px-5 py-5 text-[15px] text-texto-secundario">
            Ningún usuario coincide con la búsqueda.
          </div>
        ) : null}
      </div>

      {/* Desktop: tabla + tip */}
      <div className="nara-split-panel hidden md:grid">
        <div className="nara-scroll-x overflow-hidden rounded-[20px] border border-linea bg-nara-blanco">
          <div style={{ minWidth: 720 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,.9fr) 100px",
                gap: 12,
                padding: "10px 20px",
                background: "#F0ECE6",
                color: "#5E5750",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <span>Nombre</span>
              <span>Rol</span>
              <span>Organización</span>
              <span>Territorio</span>
              <span>Estado</span>
            </div>
            {v.users?.map((u: any) => (
              <div
                key={u.key}
                onClick={() => u.pick()}
                style={ix`display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,.9fr) 100px;gap:12px;padding:11px 20px;border-top:1px solid #E6E1D9;align-items:center;font-size:14px;cursor:pointer;background:${u.bg}`}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 500 }}>{u.name}</span>
                  <span style={{ fontSize: 12, color: "#5E5750" }}>{u.contact}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span>{u.role}</span>
                  <span style={{ fontSize: 12, color: "#5E5750" }}>{u.mods}</span>
                </div>
                <span style={{ minWidth: 0 }}>{u.org}</span>
                <span style={{ minWidth: 0 }}>{u.terr}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 500 }}>
                  <span style={ix`width:8px;height:8px;border-radius:50%;background:${u.sc}`} />
                  {u.status}
                </span>
              </div>
            ))}
            {v.noUsers ? (
              <span style={{ display: "block", padding: 20, color: "#5E5750" }}>
                Ningún usuario coincide con la búsqueda.
              </span>
            ) : null}
          </div>
        </div>

        <div className="sticky top-5 flex flex-col gap-3.5 rounded-[20px] border border-linea bg-nara-blanco px-[22px] py-5">
          <span className="leading-relaxed text-texto-secundario">
            Toque un usuario para editarlo en el formulario, o cree uno nuevo.
          </span>
        </div>
      </div>

      <FormModal
        open={!!v.hasForm}
        onClose={() => v.closeForm()}
        title={String(v.formTitle || "Usuario")}
        description="Quién entra a NARA, con qué rol y qué puede ver."
        size="md"
        footer={(
          <>
            <button
              type="button"
              onClick={() => v.save()}
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
              {v.saveLabel}
            </button>
            {v.isEdit ? (
              <button
                type="button"
                onClick={() => v.toggleStatus()}
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
                {v.statusLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => v.closeForm()}
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
              Cancelar
            </button>
          </>
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
            Nombre
            <input
              value={v.f.name ?? ""}
              onChange={v.fSet.name}
              style={{
                height: 42,
                borderRadius: 9,
                border: "1.5px solid #DCD6CD",
                padding: "0 12px",
                fontSize: 15,
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
            Correo
            <input
              type="email"
              value={v.f.contact ?? ""}
              onChange={v.fSet.contact}
              placeholder="nombre@nara.com"
              style={{
                height: 42,
                borderRadius: 9,
                border: "1.5px solid #DCD6CD",
                padding: "0 12px",
                fontSize: 15,
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
            Contraseña
            <input
              type="password"
              value={v.f.password ?? ""}
              onChange={v.fSet.password}
              placeholder={v.isEdit ? "Dejar vacío para no cambiarla" : "Mínimo 8 caracteres"}
              autoComplete="new-password"
              style={{
                height: 42,
                borderRadius: 9,
                border: "1.5px solid #DCD6CD",
                padding: "0 12px",
                fontSize: 15,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 400, color: "#5E5750" }}>
              {v.isEdit
                ? "Solo complete si quiere cambiar la contraseña."
                : "Esta contraseña se usa en Ingreso (correo + clave)."}
            </span>
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
              Rol
              <select
                value={v.f.role ?? ""}
                onChange={v.fSet.role}
                className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta"
              >
                <option>Administrador</option>
                <option>Experto de campo</option>
                <option>Clínico</option>
                <option>Observador</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
              Territorio
              <select
                value={v.f.terr ?? ""}
                onChange={v.fSet.terr}
                className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta"
              >
                {v.terrOpts?.map((o: string, i: number) => (
                  <option key={`${o}-${i}`} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {v.isObs ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderTop: "1px solid #E6E1D9",
                paddingTop: 12,
              }}
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
                  Organización
                  <input
                    value={v.f.org ?? ""}
                    onChange={v.fSet.org}
                    className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea px-3 font-texto text-[15px] text-nara-tinta"
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
                  Tipo
                  <select
                    value={v.f.orgType ?? ""}
                    onChange={v.fSet.orgType}
                    style={{
                      height: 42,
                      borderRadius: 9,
                      border: "1.5px solid #DCD6CD",
                      padding: "0 8px",
                      fontSize: 15,
                      background: "#fff",
                    }}
                  >
                    <option>Financiador</option>
                    <option>Investigación</option>
                    <option>Institución de salud</option>
                    <option>Otra</option>
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Plantilla rápida</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {v.tpls?.map((t: any) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => t.go()}
                      style={ix`font-family:Figtree,system-ui,sans-serif;font-size:13px;font-weight:500;height:34px;padding:0 10px;border-radius:8px;border:1.5px solid ${t.bd};background:${t.bg};color:#161413;cursor:pointer`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Módulos</span>
                {v.mods?.map((m: any) => (
                  <div
                    key={m.key}
                    onClick={() => m.toggle()}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "52px minmax(0,1fr)",
                      gap: 10,
                      alignItems: "center",
                      padding: "8px 0",
                      borderTop: "1px solid #F0ECE6",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={ix`width:44px;height:26px;border-radius:13px;background:${m.swBg};position:relative`}
                    >
                      <div
                        style={ix`position:absolute;top:3px;left:${m.x};width:20px;height:20px;border-radius:10px;background:#fff`}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</span>
                      <span style={{ fontSize: 12, color: "#5E5750", lineHeight: 1.35 }}>{m.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              {v.needEthics ? (
                <label style={{ display: "flex", flexDirection: "column", gap: 5, fontWeight: 500, fontSize: 14 }}>
                  Número de aprobación ética
                  <input
                    value={v.f.ethics ?? ""}
                    onChange={v.fSet.ethics}
                    placeholder="Ej. CEI-2026-118"
                    style={ix`height:42px;border-radius:9px;border:1.5px solid ${v.ethicsBd};padding:0 12px;font-size:15px`}
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {v.isEdit ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                borderTop: "1px solid #E6E1D9",
                paddingTop: 12,
              }}
            >
              <span style={{ fontWeight: 500 }}>Registro de actividad</span>
              {v.activity?.map((a: any) => (
                <div
                  key={a.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px minmax(0,1fr)",
                    gap: 10,
                    fontSize: 14,
                    padding: "5px 0",
                    borderTop: "1px solid #F0ECE6",
                  }}
                >
                  <span style={{ color: "#5E5750" }}>{a.when}</span>
                  <span>{a.text}</span>
                </div>
              ))}
              {v.noActivity ? (
                <span style={{ fontSize: 14, color: "#5E5750" }}>Sin actividad registrada.</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </FormModal>
    </>
  );
}
