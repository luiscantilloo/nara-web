"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { adminPathForView } from "@/modules/admin/routes";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { DEFAULT_PATIENT_MODULES } from "@/lib/db/patientModules";

const ROLES = ["Administrador", "Experto de campo", "Clínico", "Paciente", "Observador"];
const PAGE_SIZE = 5;
const GENERO_OPTS = ["Femenino", "Masculino", "No binario", "Otro", "Prefiere no decir"];
const CIVIL_OPTS = ["Soltero/a", "Casado/a", "Unión libre", "Separado/a", "Divorciado/a", "Viudo/a"];
const ESTRATO_OPTS = ["1", "2", "3", "4", "5", "6"];

/** Caminos de alta de paciente desde admin (importación queda fuera por ahora). */
type PatientPath = "campo" | "manual";

type FormState = {
  id: string | null;
  name: string;
  firstName?: string;
  lastName?: string;
  contact: string;
  password?: string;
  role: string;
  terr: string;
  org: string;
  modules: string[];
  patientModules: string[];
  personId?: string;
  /** campo = persona ya registrada por experto; manual = ficha igual a Nueva persona */
  patientPath?: PatientPath;
  birthDate?: string;
  age?: string;
  phone?: string;
  place?: string;
  genero?: string;
  estadoCivil?: string;
  estrato?: string;
  status?: string;
  derived?: boolean;
};

function ageFromBirth(iso: string): number {
  if (!iso) return 0;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return Math.max(0, age);
}

function emptyPatientFicha(): Partial<FormState> {
  return {
    patientPath: "campo",
    personId: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    age: "",
    phone: "",
    place: "",
    genero: "",
    estadoCivil: "",
    estrato: "",
    contact: "",
    terr: "",
  };
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function joinName(firstName: string, lastName: string, fallback = ""): string {
  const n = [firstName, lastName].map((x) => String(x || "").trim()).filter(Boolean).join(" ");
  return n || fallback;
}

/** Departamentos del Eje (no son territorios asignables a un experto). */
const DEPT_NAMES = new Set([
  "quindío",
  "quindio",
  "risaralda",
  "caldas",
  "valle del cauca",
  "valle",
]);

function territoryNames(A: any, S: any): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const rows = [
    ...((S.territories || []) as { name?: string; dep?: string }[]),
    ...((A.TERRS || []) as { name?: string; dep?: string }[]),
  ];
  for (const t of rows) {
    const n = String(t?.name || "").trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key) || DEPT_NAMES.has(key)) continue;
    // Si el “territorio” es solo el departamento (name === dep), omitir.
    const dep = String(t?.dep || "").trim().toLowerCase();
    if (dep && key === dep) continue;
    seen.add(key);
    out.push(n);
  }
  return out.sort((a, b) => a.localeCompare(b, "es"));
}

type UiState = {
  zoom: number;
  agentOpen: boolean;
  msg: string;
  rf: string;
  q: string;
  page: number;
  sel: string | null;
  f: FormState | null;
  err: string;
  pendingAsk: string;
};

const INITIAL: UiState = {
  zoom: 1,
  agentOpen: false,
  msg: "",
  rf: "",
  q: "",
  page: 0,
  sel: null,
  f: null,
  err: "",
  pendingAsk: "",
};

function genPassword(len = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

function allUsers(A: any, S: any) {
  const acc = S.accounts.slice();
  const names = new Set(acc.map((a: any) => a.name));
  A.experts(S).forEach((e: any) => {
    if (!names.has(e.name)) {
      acc.push({
        id: e.id,
        name: e.name,
        contact: e.phone,
        role: "Experto de campo",
        org: "Programa NARA",
        terr: e.terr,
        status: e.active === false ? "Inactivo" : "Activo",
        derived: true,
      });
    }
  });
  return acc.map((a: any) => {
    const e = A.experts(S).find((x: any) => x.name === a.name);
    return e
      ? Object.assign({}, a, {
          terr: e.terr,
          status: e.active === false ? "Inactivo" : a.status,
        })
      : a;
  });
}

export function useAdminUsuariosScreen() {
  const A = useNaraStore();
  const live = useNaraLive();
  const router = useRouter();
  const [st, setSt] = useState<UiState>({ ...INITIAL });

  const setState = useCallback((patch: Partial<UiState> | ((s: UiState) => UiState)) => {
    setSt((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const u = A.session() as { role?: string; roleId?: string } | null;
    if (!u || (u.roleId !== "admin" && !/Admin/i.test(u.role || ""))) {
      router.replace("/ingreso");
    }
  }, [A, router]);

  const v = useMemo(() => {
    const S = A.get();
    const C = A.C;
    const z = st.zoom || 1;
    const all = allUsers(A, S);
    const q = st.q.trim().toLowerCase();
    const list = all.filter(
      (u: any) =>
        (!st.rf || u.role === st.rf) &&
        (!q || (u.name + " " + u.org).toLowerCase().includes(q)),
    );
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const page = Math.min(Math.max(0, st.page || 0), totalPages - 1);
    const pageStart = page * PAGE_SIZE;
    const pageList = list.slice(pageStart, pageStart + PAGE_SIZE);
    const f = st.f;
    const isEdit = !!(f && f.id);
    const isPaciente = !!f && f.role === "Paciente";
    const patientPath: PatientPath =
      f?.patientPath === "manual" ? "manual" : "campo";
    const isManualPatient = isPaciente && !isEdit && patientPath === "manual";
    const isCampoPatient = isPaciente && !isEdit && patientPath === "campo";
    const setF = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      const next = Object.assign({}, f, { [k]: value }) as FormState;
      if (k === "birthDate") {
        next.age = value ? String(ageFromBirth(value)) : "";
      }
      setState({ f: next, err: "" });
    };
    const open = (u: any) => {
      const { firstName, lastName } = splitFullName(u.name || "");
      setState({
        sel: u.id,
        err: "",
        f: {
          id: u.id,
          name: u.name,
          firstName: u.firstName || firstName,
          lastName: u.lastName || lastName,
          contact: u.email || u.contact || "",
          password: "",
          role: u.role,
          terr: u.terr,
          org: u.org,
          modules: (u.modules || A.OBS_DEFAULT_MODULES || []).slice(),
          patientModules: (u.patientModules || u.modulesEnabled || DEFAULT_PATIENT_MODULES).slice(),
          personId: u.personId || u.patientId || "",
          patientPath: "campo",
          status: u.status,
          derived: u.derived,
        },
      });
    };
    const allTerrNames = territoryNames(A, S);
    const isExpertoCampo = f?.role === "Experto de campo";
    const terrOpts = isExpertoCampo
      ? allTerrNames
      : Array.from(new Set(["Todos"].concat(allTerrNames)));

    const accountEmails = new Set(
      (S.accounts || [])
        .filter((a: any) => /paciente/i.test(String(a.role || a.roleId || "")))
        .map((a: any) => String(a.email || a.contact || "").trim().toLowerCase())
        .filter(Boolean),
    );
    const accountPersonIds = new Set(
      (S.accounts || [])
        .map((a: any) => String(a.personId || a.patientId || "").trim())
        .filter(Boolean),
    );
    const peopleList = A.people ? A.people(S) : S.people || [];
    const personOpts = peopleList
      .filter((p: any) => {
        const pid = String(p.id || p.code || "");
        if (!pid || !p.name) return false;
        if (isEdit && f?.personId && (pid === f.personId || p.code === f.personId)) return true;
        if (accountPersonIds.has(pid) || (p.code && accountPersonIds.has(String(p.code)))) return false;
        const em = String(p.email || "").trim().toLowerCase();
        if (em && accountEmails.has(em)) return false;
        return true;
      })
      .map((p: any) => {
        const split = splitFullName(p.name || "");
        const firstName = String(p.firstName || split.firstName);
        const lastName = String(p.lastName || split.lastName);
        return {
          id: String(p.id || p.code),
          label: `${p.name}${p.code ? ` · ${p.code}` : ""}${p.place ? ` · ${p.place}` : ""}`,
          name: String(p.name || ""),
          firstName,
          lastName,
          email: String(p.email || "").trim(),
          terr: String(p.terr || "Todos"),
          phone: String(p.phone || ""),
          clin: String(p.clin || ""),
        };
      })
      .sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name, "es"),
      );

    const pickPerson = (personId: string) => {
      const p = personOpts.find((x: { id: string }) => x.id === personId);
      if (!p || !f) return;
      setState({
        f: Object.assign({}, f, {
          patientPath: "campo" as PatientPath,
          personId: p.id,
          name: p.name,
          firstName: p.firstName,
          lastName: p.lastName,
          contact: p.email,
          terr: p.terr || f.terr || "",
          role: "Paciente",
          org: "Programa NARA",
          patientModules: DEFAULT_PATIENT_MODULES.slice(),
        }),
        err: "",
      });
    };

    const setPatientPath = (path: PatientPath) => {
      if (!f) return;
      const names = territoryNames(A, S);
      if (path === "manual") {
        setState({
          f: Object.assign({}, f, emptyPatientFicha(), {
            patientPath: "manual" as PatientPath,
            role: "Paciente",
            org: "Programa NARA",
            patientModules: DEFAULT_PATIENT_MODULES.slice(),
            terr: names[0] || f.terr || "",
            password: f.password || "",
          }),
          err: "",
        });
        return;
      }
      setState({
        f: Object.assign({}, f, emptyPatientFicha(), {
          patientPath: "campo" as PatientPath,
          role: "Paciente",
          org: "Programa NARA",
          patientModules: DEFAULT_PATIENT_MODULES.slice(),
          password: f.password || "",
        }),
        err: "",
      });
    };

    const save = async () => {
      if (!f) return;
      const path: PatientPath = f.patientPath === "manual" ? "manual" : "campo";
      if (f.role === "Paciente" && !isEdit && path === "campo" && !String(f.personId || "").trim()) {
        return setState({ err: "Seleccione la persona a la que se le crean las credenciales." });
      }
      const fullName =
        f.role === "Paciente"
          ? joinName(String(f.firstName || ""), String(f.lastName || ""), f.name)
          : f.name.trim();
      if (f.role === "Paciente" && (!String(f.firstName || "").trim() || !String(f.lastName || "").trim())) {
        return setState({ err: "La persona debe tener nombre y apellido." });
      }
      if (f.role === "Paciente" && !isEdit && path === "manual") {
        const missing: string[] = [];
        if (!String(f.firstName || "").trim()) missing.push("nombre");
        if (!String(f.lastName || "").trim()) missing.push("apellido");
        if (!String(f.birthDate || "").trim()) missing.push("fecha de nacimiento");
        if (!String(f.place || "").trim()) missing.push("vereda o barrio");
        if (!String(f.terr || "").trim() || /^todos$/i.test(String(f.terr))) {
          missing.push("territorio");
        }
        if (!String(f.contact || "").trim()) missing.push("correo");
        if (missing.length) {
          return setState({
            err:
              missing.length === 1
                ? "Falta el dato: " + missing[0] + "."
                : "Faltan datos: " + missing.join(", ") + ".",
          });
        }
      }
      if (!fullName || !f.contact.trim()) {
        return setState({
          err: f.role === "Paciente"
            ? "La persona debe tener nombre, apellido y correo. Complete el correo si falta."
            : "Escriba el nombre y el correo.",
        });
      }
      if (!/@/.test(f.contact))
        return setState({ err: "Use un correo válido (ej. nombre@nara.com) para el acceso." });
      if (!isEdit && !(f.password || "").trim())
        return setState({ err: "Defina una contraseña para el nuevo usuario." });
      if ((f.password || "").trim() && (f.password || "").trim().length < 8)
        return setState({ err: "La contraseña debe tener al menos 8 caracteres." });
      if (f.role === "Observador" && !f.org.trim())
        return setState({ err: "Escriba la organización del observador." });
      if (f.role === "Experto de campo") {
        const oneTerr = String(f.terr || "")
          .split(/\s*[,;/|]\s*|\s+y\s+/i)
          .map((x) => x.trim())
          .filter(Boolean)[0];
        if (!oneTerr || /^todos$/i.test(oneTerr)) {
          return setState({ err: "El experto de campo debe tener un único territorio asignado." });
        }
        f.terr = oneTerr;
      }

      const birthDate = String(f.birthDate || "").trim();
      const age = birthDate ? ageFromBirth(birthDate) : Number(f.age) || 0;
      const place = String(f.place || "").trim();
      const payload: any = {
        id: f.id || undefined,
        name: fullName,
        firstName: f.role === "Paciente" ? String(f.firstName || "").trim() : undefined,
        lastName: f.role === "Paciente" ? String(f.lastName || "").trim() : undefined,
        contact: f.contact.trim(),
        email: f.contact.trim(),
        password: (f.password || "").trim() || undefined,
        role: f.role,
        terr: f.terr,
        org: f.role === "Observador" ? f.org.trim() : "Programa NARA",
        modules: f.role === "Observador" ? (A.OBS_DEFAULT_MODULES || []).slice() : undefined,
        patientModules: f.role === "Paciente" ? DEFAULT_PATIENT_MODULES.slice() : undefined,
        personId:
          f.role === "Paciente" && path === "campo"
            ? String(f.personId || "").trim() || undefined
            : undefined,
        patientId:
          f.role === "Paciente" && path === "campo"
            ? String(f.personId || "").trim() || undefined
            : undefined,
        status: f.status || "Activo",
      };

      if (f.role === "Paciente" && !isEdit) {
        payload.origin = path === "manual" ? "manual" : "admin";
        payload.source = path === "manual" ? "admin-manual" : "admin-campo";
        if (path === "manual") {
          // Alta admin/manual: nace sin evaluación. Campo: respeta estado de la ficha.
          payload.patientStatus = "Sin evaluación";
          payload.birthDate = birthDate;
          payload.age = age;
          payload.place = place;
          payload.phone = String(f.phone || "").trim();
          payload.genero = String(f.genero || "").trim();
          payload.estadoCivil = String(f.estadoCivil || "").trim();
          payload.estrato = String(f.estrato || "").trim();
          payload.rural = /vereda/i.test(place);
        }
      }

      try {
        const res = await fetch("/api/accounts", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) return setState({ err: data.error || "No se pudo guardar el usuario." });

        const acc = data.account;
        const person = data.person || null;
        const terrForExpert = String(person?.terr || f.terr || "").trim();
        const expertFromTerr = terrForExpert
          ? (A.experts ? A.experts(A.get()) : A.get().experts || []).find(
              (e: any) => e.terr === terrForExpert && e.active !== false,
            )
          : null;
        A.set((s: any) => {
          const list = Array.isArray(s.accounts) ? s.accounts.slice() : [];
          const i = list.findIndex((x: any) => x.id === acc.id);
          if (i >= 0) list[i] = { ...list[i], ...acc };
          else list.push({ ...acc, created: true });
          s.accounts = list;
          if (acc.role === "Experto de campo") {
            s.expertOv = s.expertOv || {};
            s.expertOv[acc.name] = Object.assign({}, s.expertOv[acc.name], {
              terr: acc.terr,
              phone: acc.contact,
            });
          }
          const linkId =
            person?.id || payload.personId || acc.personId || acc.patientId;
          if (linkId) {
            s.people = Array.isArray(s.people) ? s.people : [];
            let pe = s.people.find(
              (p: any) => p.id === linkId || p.code === linkId || p.code === person?.code,
            );
            const expertName =
              String(person?.expert || "") ||
              String(expertFromTerr?.name || "") ||
              "";
            const expertId =
              String(person?.expertId || "") ||
              String(expertFromTerr?.id || expertFromTerr?.accountId || "") ||
              "";
            const personCode = String(person?.code || pe?.code || "");
            const clinName = String(person?.clin || pe?.clin || "");
            if (!pe) {
              pe = {
                id: linkId,
                code: personCode,
                name: fullName,
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone || "",
                birthDate: birthDate || person?.birthDate || "",
                age: age || person?.age || 0,
                place: place || person?.place || "",
                terr: terrForExpert,
                rural: payload.rural ?? person?.rural ?? false,
                genero: payload.genero || "",
                estadoCivil: payload.estadoCivil || "",
                estrato: payload.estrato || "",
                status: String(person?.status || "Sin evaluación"),
                profile: person?.profile ?? null,
                accountId: acc.id,
                expert: expertName,
                expertId,
                clin: clinName,
                source: payload.source || "admin",
                week: 0,
                weeks: 13,
              };
              s.people.push(pe);
            } else {
              Object.assign(pe, {
                accountId: acc.id,
                email: pe.email || payload.email,
                ...(personCode ? { code: personCode } : {}),
                ...(expertName ? { expert: expertName } : {}),
                ...(expertId ? { expertId } : {}),
                ...(clinName ? { clin: clinName } : {}),
                ...(terrForExpert ? { terr: terrForExpert } : {}),
              });
              if (path === "manual") {
                Object.assign(pe, {
                  name: fullName,
                  firstName: payload.firstName,
                  lastName: payload.lastName,
                  status: pe.status || "Sin evaluación",
                });
              }
            }
          }
          A.logActivity(s, A.session()?.id || "admin", (isEdit ? "Editó" : "Creó") + " el usuario " + acc.name);
        });

        setState({
          f: null,
          sel: null,
          err: "",
          msg: isEdit
            ? "Cambios guardados para " + acc.name + " en MongoDB."
            : "Usuario " +
              acc.name +
              " creado en MongoDB. Puede ingresar con " +
              acc.email +
              (payload.password ? " y la contraseña que definió." : "."),
        });
      } catch {
        setState({ err: "No se pudo conectar con la base de datos." });
      }
    };

    const act = f && isEdit ? S.activity.filter((a: any) => a.uid === f.id) : [];
    const personLocked = isCampoPatient && !!String(f?.personId || "").trim();
    const emailFromPerson = personLocked && !!String(f?.contact || "").trim();

    return {
      zoom: z,
      agentOpen: st.agentOpen,
      openAgent: () => setState({ agentOpen: true }),
      closeAgent: () => setState({ agentOpen: false, pendingAsk: "" }),
      pendingAsk: st.pendingAsk || "",
      ovW: window.innerWidth / z + "px",
      ovH: window.innerHeight / z + "px",
      drawerW: window.innerWidth < 720 ? window.innerWidth / z + "px" : "480px",
      agentAction: (a: string, p: any) => {
        if (a === "report") router.push("/informe?id=" + p + "&back=/usuarios");
        if (a === "detail") router.push(adminPathForView(p.target));
      },
      hasMsg: !!st.msg,
      msg: st.msg,
      clearMsg: () => setState({ msg: "" }),
      roleChips: ([["", "Todos"]] as [string, string][])
        .concat(ROLES.map((r) => [r, r] as [string, string]))
        .map(([val, label]) => ({
          key: val || "all",
          label,
          n: val ? all.filter((u: any) => u.role === val).length : all.length,
          bd: st.rf === val ? C.verde : C.lineas,
          bg: st.rf === val ? "#FFF4CC" : "#fff",
          go: () => setState({ rf: val, page: 0 }),
        })),
      q: st.q,
      setQ: (e: ChangeEvent<HTMLInputElement>) => setState({ q: e.target.value, page: 0 }),
      users: pageList.map((u: any) => ({
        key: u.id,
        name: u.name + (u.lead ? " · líder clínica" : ""),
        contact: u.contact || "",
        role: u.role,
        mods: "",
        org: u.org,
        terr: u.terr,
        status: u.status,
        sc: u.status === "Activo" ? C.alDia : "#8C857C",
        bg: st.sel === u.id ? "#FFF4CC" : "#fff",
        pick: () => open(u),
      })),
      noUsers: !list.length,
      page,
      totalPages,
      pageLabel:
        list.length === 0
          ? "0 usuarios"
          : `${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, list.length)} de ${list.length}`,
      canPrev: page > 0,
      canNext: page < totalPages - 1,
      prevPage: () => setState({ page: Math.max(0, page - 1) }),
      nextPage: () => setState({ page: Math.min(totalPages - 1, page + 1) }),
      goPage: (n: number) => setState({ page: Math.min(Math.max(0, n), totalPages - 1) }),
      newUser: () =>
        setState({
          sel: null,
          err: "",
          f: {
            id: null,
            name: "",
            firstName: "",
            lastName: "",
            contact: "",
            password: "",
            role: "Observador",
            terr: "Todos",
            org: "",
            modules: (A.OBS_DEFAULT_MODULES || []).slice(),
            patientModules: DEFAULT_PATIENT_MODULES.slice(),
            ...emptyPatientFicha(),
          },
        }),
      noForm: !f,
      hasForm: !!f,
      formTitle: isEdit && f ? f.name : "Nuevo usuario",
      formDesc: isPaciente && !isEdit
        ? isManualPatient
          ? "Alta manual: mismos datos que Nueva persona en campo. Estado inicial: sin evaluación."
          : "Persona ya registrada en campo. Solo define la contraseña de acceso."
        : "Quién entra a NARA, con qué rol y qué puede ver.",
      formSize: isManualPatient ? "lg" : "md",
      closeForm: () => setState({ f: null, sel: null, err: "" }),
      f: f || ({} as FormState),
      fSet: {
        name: setF("name"),
        firstName: setF("firstName"),
        lastName: setF("lastName"),
        contact: setF("contact"),
        password: setF("password"),
        birthDate: setF("birthDate"),
        phone: setF("phone"),
        place: setF("place"),
        genero: setF("genero"),
        estadoCivil: setF("estadoCivil"),
        estrato: setF("estrato"),
        role: (e: ChangeEvent<HTMLSelectElement>) => {
          const role = e.target.value;
          const next: FormState = Object.assign({}, f, {
            role,
            personId: role === "Paciente" ? f?.personId || "" : "",
            patientPath: role === "Paciente" ? (f?.patientPath || "campo") : undefined,
            patientModules: DEFAULT_PATIENT_MODULES.slice(),
          }) as FormState;
          if (role === "Paciente") {
            Object.assign(next, emptyPatientFicha(), {
              role: "Paciente",
              patientPath: "campo" as PatientPath,
              password: f?.password || "",
              patientModules: DEFAULT_PATIENT_MODULES.slice(),
            });
          }
          if (role === "Observador") {
            next.modules = (A.OBS_DEFAULT_MODULES || []).slice();
            if (!next.terr) next.terr = "Todos";
          }
          if (role === "Experto de campo") {
            const names = territoryNames(A, S);
            if (!next.terr || /^todos$/i.test(next.terr) || !names.includes(next.terr)) {
              next.terr = names[0] || "";
            }
          }
          if (role !== "Paciente") {
            next.personId = "";
            next.patientPath = undefined;
          }
          setState({ f: next, err: "" });
        },
        terr: setF("terr"),
        org: setF("org"),
      },
      terrOpts: isManualPatient || isExpertoCampo ? allTerrNames : terrOpts,
      generoOpts: GENERO_OPTS,
      civilOpts: CIVIL_OPTS,
      estratoOpts: ESTRATO_OPTS,
      isObs: !!f && f.role === "Observador",
      isPaciente,
      isManualPatient,
      isCampoPatient,
      patientPath,
      setPatientPath,
      personOpts,
      personId: f?.personId || "",
      pickPerson: (e: ChangeEvent<HTMLSelectElement>) => pickPerson(e.target.value),
      personLocked,
      fieldsReadonly: personLocked,
      emailEditable: isCampoPatient ? !emailFromPerson : true,
      genPassword: () => {
        if (!f) return;
        setState({ f: Object.assign({}, f, { password: genPassword(10) }), err: "" });
      },
      hasErr: !!st.err,
      err: st.err,
      clearErr: () => setState({ err: "" }),
      save,
      saveLabel: isEdit ? "Guardar cambios" : "Crear",
      isEdit,
      statusLabel: f && f.status === "Activo" ? "Desactivar usuario" : "Activar usuario",
      toggleStatus: async () => {
        if (!f || !f.id) return;
        const nv = f.status === "Activo" ? "Inactivo" : "Activo";
        try {
          const res = await fetch("/api/accounts", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: f.id,
              name: f.name,
              contact: f.contact,
              email: f.contact,
              role: f.role,
              terr: f.terr,
              org: f.org,
              modules: f.modules,
              status: nv,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setState({ err: data.error || "No se pudo cambiar el estado." });
            return;
          }
          const acc = data.account;
          A.set((s: any) => {
            const list = Array.isArray(s.accounts) ? s.accounts.slice() : [];
            const i = list.findIndex((x: any) => x.id === acc.id);
            if (i >= 0) list[i] = { ...list[i], ...acc };
            else list.push(acc);
            s.accounts = list;
            if (acc.role === "Experto de campo" || acc.roleId === "experto") {
              s.expertOv = s.expertOv || {};
              s.expertOv[acc.name] = Object.assign({}, s.expertOv[acc.name], {
                active: nv === "Activo",
              });
            }
            A.logActivity(
              s,
              A.session()?.id || "admin",
              (nv === "Activo" ? "Activó" : "Desactivó") + " a " + acc.name,
            );
          });
          setState({
            f: Object.assign({}, f, { status: nv }),
            err: "",
            msg: f.name + (nv === "Activo" ? " puede ingresar." : " ya no puede ingresar."),
          });
        } catch {
          setState({ err: "No se pudo conectar con la base de datos." });
        }
      },
      activity: act.map((a: any, i: number) => ({
        key: a.at + "-" + i,
        when: A.agoText(a.at),
        text: a.text,
      })),
      noActivity: !act.length,
    };
  }, [A, router, setState, st, live]);

  return { v };
}
