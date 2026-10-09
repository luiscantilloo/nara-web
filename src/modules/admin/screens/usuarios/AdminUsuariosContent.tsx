"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormModal } from "@/components/shared/form-modal/FormModal";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { PhoneInput } from "@/components/shared/phone-input/PhoneInput";
import { ix } from "../inlineStyle";

function UsuariosPager({ v }: { v: Record<string, any> }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-texto-secundario">{v.pageLabel}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!v.canPrev}
          onClick={() => v.prevPage?.()}
          className="h-9 cursor-pointer rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-sm text-nara-tinta disabled:cursor-default disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="min-w-[4.5rem] text-center text-sm font-medium text-nara-tinta">
          {v.page + 1} / {v.totalPages}
        </span>
        <button
          type="button"
          disabled={!v.canNext}
          onClick={() => v.nextPage?.()}
          className="h-9 cursor-pointer rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-sm text-nara-tinta disabled:cursor-default disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

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
                <span className="truncate font-medium text-nara-tinta">
                  {u.role === "Observador" ? u.org || u.name : u.name}
                </span>
                {u.role === "Observador" && u.mods ? (
                  <span className="truncate text-xs text-texto-secundario">{u.mods}</span>
                ) : (
                  <span className="truncate text-xs text-texto-secundario">{u.contact}</span>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-nara-tinta">
                <span
                  className="size-2 rounded-full"
                  style={{ background: u.sc }}
                />
                {u.status}
              </span>
            </div>
            {u.role !== "Observador" ? (
              <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                <span className="text-nara-tinta">{u.role}</span>
                {u.mods ? (
                  <span className="text-xs text-texto-secundario">{u.mods}</span>
                ) : null}
              </div>
            ) : null}
            {u.role !== "Observador" ? (
              <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-sm text-texto-secundario">
                <span className="min-w-0 break-words">{u.org}</span>
                {u.terr ? <span className="min-w-0 break-words">{u.terr}</span> : null}
              </div>
            ) : null}
          </button>
        ))}
        {v.noUsers ? (
          <div className="rounded-2xl border border-linea bg-nara-blanco px-5 py-5 text-[15px] text-texto-secundario">
            Ningún usuario coincide con la búsqueda.
          </div>
        ) : null}
        {!v.noUsers ? <UsuariosPager v={v} /> : null}
      </div>

      {/* Desktop: tabla + tip */}
      <div className="nara-split-panel hidden md:grid">
        <div className="flex min-w-0 flex-col gap-3">
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
                    <span style={{ fontWeight: 500 }}>
                      {u.role === "Observador" ? u.org || u.name : u.name}
                    </span>
                    <span style={{ fontSize: 12, color: "#5E5750" }}>
                      {u.role === "Observador" ? u.mods || u.contact : u.contact}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span>{u.role}</span>
                    {u.role !== "Observador" && u.mods ? (
                      <span style={{ fontSize: 12, color: "#5E5750" }}>{u.mods}</span>
                    ) : null}
                  </div>
                  <span style={{ minWidth: 0 }}>{u.role === "Observador" ? u.terr : u.org}</span>
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
          {!v.noUsers ? <UsuariosPager v={v} /> : null}
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
        description={String(v.formDesc || "Quién entra a NARA, con qué rol y qué puede ver.")}
        size={(v.formSize as "sm" | "md" | "lg") || "md"}
        footer={(
          <>
            <button
              type="button"
              onClick={() => v.save()}
              className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-[18px] font-texto text-[15px] font-medium text-nara-tinta"
            >
              {v.saveLabel}
            </button>
            {v.isEdit ? (
              <button
                type="button"
                onClick={() => v.toggleStatus()}
                className="h-11 cursor-pointer rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] text-nara-tinta"
              >
                {v.statusLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => v.closeForm()}
              className="h-11 cursor-pointer rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] text-nara-tinta"
            >
              Cancelar
            </button>
          </>
        )}
      >
        <div className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
            Rol
            <select
              value={v.f.role ?? ""}
              onChange={v.fSet.role}
              className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] font-normal text-nara-tinta"
            >
              <option>Administrador</option>
              <option>Experto de campo</option>
              <option>Clínico</option>
              <option>Paciente</option>
              <option>Observador</option>
            </select>
          </label>

          {v.isPaciente && !v.isEdit ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-nara-tinta">Cómo crear al paciente</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => v.setPatientPath?.("campo")}
                  className={`cursor-pointer rounded-[12px] border-[1.5px] px-3 py-3 text-left font-texto text-sm ${
                    v.patientPath === "campo"
                      ? "border-nara-tinta bg-nara-crema"
                      : "border-linea bg-nara-blanco"
                  }`}
                >
                  <span className="block font-medium text-nara-tinta">Desde campo</span>
                  <span className="mt-0.5 block text-xs text-texto-secundario">
                    Persona ya registrada por el experto
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => v.setPatientPath?.("manual")}
                  className={`cursor-pointer rounded-[12px] border-[1.5px] px-3 py-3 text-left font-texto text-sm ${
                    v.patientPath === "manual"
                      ? "border-nara-tinta bg-nara-crema"
                      : "border-linea bg-nara-blanco"
                  }`}
                >
                  <span className="block font-medium text-nara-tinta">Manual</span>
                  <span className="mt-0.5 block text-xs text-texto-secundario">
                    Misma ficha que Nueva persona · sin evaluación
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {v.isCampoPatient ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
              Persona
              <select
                value={v.personId ?? ""}
                onChange={v.pickPerson}
                className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] font-normal text-nara-tinta"
              >
                <option value="">Seleccione la persona…</option>
                {v.personOpts?.map((o: { id: string; label: string }) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              {!v.personOpts?.length ? (
                <span className="text-xs font-normal text-texto-secundario">
                  No hay personas pendientes de credenciales.
                </span>
              ) : null}
            </label>
          ) : null}

          {v.isManualPatient ? (
            <>
              <section className="flex flex-col gap-3">
                <h3 className="font-titulos text-base font-semibold text-nara-tinta">Identidad</h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Nombre
                    <input
                      value={v.f.firstName ?? ""}
                      onChange={v.fSet.firstName}
                      placeholder="Nombre"
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Apellido
                    <input
                      value={v.f.lastName ?? ""}
                      onChange={v.fSet.lastName}
                      placeholder="Apellidos"
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Fecha de nacimiento
                    <input
                      type="date"
                      value={v.f.birthDate ?? ""}
                      onChange={v.fSet.birthDate}
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Edad
                    <input
                      value={v.f.age ?? ""}
                      readOnly
                      placeholder="Se calcula sola"
                      className="box-border h-[42px] w-full cursor-default rounded-[9px] border-[1.5px] border-linea bg-nara-crema px-3 font-texto text-[15px] font-normal text-nara-tinta"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Género
                    <select
                      value={v.f.genero ?? ""}
                      onChange={v.fSet.genero}
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] font-normal text-nara-tinta"
                    >
                      <option value="">Seleccione…</option>
                      {(v.generoOpts || []).map((o: string) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Estado civil
                    <select
                      value={v.f.estadoCivil ?? ""}
                      onChange={v.fSet.estadoCivil}
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] font-normal text-nara-tinta"
                    >
                      <option value="">Seleccione…</option>
                      {(v.civilOpts || []).map((o: string) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
              <section className="flex flex-col gap-3">
                <h3 className="font-titulos text-base font-semibold text-nara-tinta">Contacto</h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Teléfono
                    <PhoneInput
                      value={v.f.phone ?? ""}
                      onChange={v.fSet.phone}
                      placeholder="3xx xxx xxxx"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Correo
                    <input
                      type="email"
                      value={v.f.contact ?? ""}
                      onChange={v.fSet.contact}
                      placeholder="correo@ejemplo.com"
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                    />
                  </label>
                </div>
              </section>
              <section className="flex flex-col gap-3">
                <h3 className="font-titulos text-base font-semibold text-nara-tinta">Ubicación</h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Territorio
                    <select
                      value={v.f.terr ?? ""}
                      onChange={v.fSet.terr}
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] font-normal text-nara-tinta"
                    >
                      <option value="">Seleccione…</option>
                      {v.terrOpts?.map((o: string, i: number) => (
                        <option key={`${o}-${i}`} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Vereda o barrio
                    <input
                      value={v.f.place ?? ""}
                      onChange={v.fSet.place}
                      placeholder="Ej.: Vereda Cocora"
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                    Estrato
                    <select
                      value={v.f.estrato ?? ""}
                      onChange={v.fSet.estrato}
                      className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] font-normal text-nara-tinta"
                    >
                      <option value="">Seleccione…</option>
                      {(v.estratoOpts || []).map((o: string) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            </>
          ) : null}

          {v.isCampoPatient || (v.isPaciente && v.isEdit) ? (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                  Nombre
                  <input
                    value={v.f.firstName ?? ""}
                    onChange={v.fSet.firstName}
                    readOnly={!!v.fieldsReadonly}
                    placeholder="Nombre"
                    className={`box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea px-3 font-texto text-[15px] font-normal text-nara-tinta ${
                      v.fieldsReadonly ? "bg-nara-crema" : "bg-nara-blanco"
                    }`}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                  Apellido
                  <input
                    value={v.f.lastName ?? ""}
                    onChange={v.fSet.lastName}
                    readOnly={!!v.fieldsReadonly}
                    placeholder="Apellidos"
                    className={`box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea px-3 font-texto text-[15px] font-normal text-nara-tinta ${
                      v.fieldsReadonly ? "bg-nara-crema" : "bg-nara-blanco"
                    }`}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                Correo
                <input
                  type="email"
                  value={v.f.contact ?? ""}
                  onChange={v.fSet.contact}
                  readOnly={!v.emailEditable}
                  placeholder="nombre@nara.com"
                  className={`box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea px-3 font-texto text-[15px] font-normal text-nara-tinta ${
                    v.emailEditable ? "bg-nara-blanco" : "bg-nara-crema"
                  }`}
                />
                {v.fieldsReadonly && v.emailEditable ? (
                  <span className="text-xs font-normal text-texto-secundario">
                    Esta persona no tiene correo en la ficha; escríbalo para el acceso.
                  </span>
                ) : null}
              </label>
            </>
          ) : null}

          {!v.isPaciente ? (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                Nombre
                <input
                  value={v.f.name ?? ""}
                  onChange={v.fSet.name}
                  className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                Correo
                <input
                  type="email"
                  value={v.f.contact ?? ""}
                  onChange={v.fSet.contact}
                  placeholder="nombre@nara.com"
                  className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                />
              </label>
            </>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
            Contraseña
            {v.isPaciente ? (
              <div className="relative">
                <input
                  type="text"
                  value={v.f.password ?? ""}
                  onChange={v.fSet.password}
                  placeholder={v.isEdit ? "Dejar vacío para no cambiarla" : "Mínimo 8 caracteres"}
                  autoComplete="new-password"
                  className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco py-0 pl-3 pr-[5.5rem] font-texto text-[15px] font-normal text-nara-tinta"
                />
                <button
                  type="button"
                  onClick={() => v.genPassword?.()}
                  className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 cursor-pointer rounded-lg border-none bg-nara-crema px-2.5 font-texto text-xs font-medium text-nara-tinta"
                >
                  Generar
                </button>
              </div>
            ) : (
              <input
                type="password"
                value={v.f.password ?? ""}
                onChange={v.fSet.password}
                placeholder={v.isEdit ? "Dejar vacío para no cambiarla" : "Mínimo 8 caracteres"}
                autoComplete="new-password"
                className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
              />
            )}
            <span className="text-xs font-normal text-texto-secundario">
              {v.isEdit
                ? "Solo complete si quiere cambiar la contraseña."
                : "Esta contraseña se usa en Ingreso (correo + clave)."}
            </span>
          </label>

          {!v.isPaciente ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
              Territorio
              <select
                value={v.f.terr ?? ""}
                onChange={v.fSet.terr}
                className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] font-normal text-nara-tinta"
              >
                {v.terrOpts?.map((o: string, i: number) => (
                  <option key={`${o}-${i}`} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {v.isObs ? (
            <div className="flex flex-col gap-3 border-t border-linea pt-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-nara-tinta">
                Organización
                <input
                  value={v.f.org ?? ""}
                  onChange={v.fSet.org}
                  placeholder="Nombre de la organización"
                  className="box-border h-[42px] w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] font-normal text-nara-tinta"
                />
              </label>
              <span className="text-[13px] leading-snug text-texto-secundario">
                Observador es un solo rol. Por ahora la app muestra topbar y TEO; las vistas se armarán después.
              </span>
            </div>
          ) : null}

          {v.isEdit ? (
            <div className="flex flex-col gap-1.5 border-t border-linea pt-3">
              <span className="text-sm font-medium text-nara-tinta">Registro de actividad</span>
              {v.activity?.map((a: any) => (
                <div
                  key={a.key}
                  className="grid grid-cols-[110px_minmax(0,1fr)] gap-2.5 border-t border-[#F0ECE6] py-1 text-sm"
                >
                  <span className="text-texto-secundario">{a.when}</span>
                  <span>{a.text}</span>
                </div>
              ))}
              {v.noActivity ? (
                <span className="text-sm text-texto-secundario">Sin actividad registrada.</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </FormModal>
    </>
  );
}
