"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { adminPathForView } from "@/modules/admin/routes";
import { useNaraStore } from "@/providers/nara-provider";
import {
  DEFAULT_PATIENT_MODULES,
  PATIENT_APP_MODULES,
} from "@/lib/db/patientModules";

const ROLES = ["Administrador", "Experto de campo", "Clínico", "Paciente", "Observador"];
const PAGE_SIZE = 5;

type FormState = {
  id: string | null;
  name: string;
  contact: string;
  password?: string;
  role: string;
  terr: string;
  org: string;
  modules: string[];
  patientModules: string[];
  status?: string;
  derived?: boolean;
};

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
    const setF = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setState({ f: Object.assign({}, f, { [k]: e.target.value }), err: "" });
    const open = (u: any) =>
      setState({
        sel: u.id,
        err: "",
        f: {
          id: u.id,
          name: u.name,
          contact: u.email || u.contact || "",
          password: "",
          role: u.role,
          terr: u.terr,
          org: u.org,
          modules: (u.modules || A.OBS_DEFAULT_MODULES || []).slice(),
          patientModules: (u.patientModules || u.modulesEnabled || DEFAULT_PATIENT_MODULES).slice(),
          status: u.status,
          derived: u.derived,
        },
      });
    const allTerrNames = Array.from(
      new Set(
        (A.TERRS || [])
          .map((t: any) => t.name)
          .concat((S.territories || []).map((t: any) => t.name))
          .concat(["Quindío", "Risaralda", "Caldas"])
          .filter(Boolean),
      ),
    );
    const isExpertoCampo = f?.role === "Experto de campo";
    const terrOpts = isExpertoCampo
      ? allTerrNames
      : Array.from(new Set(["Todos"].concat(allTerrNames)));

    const save = async () => {
      if (!f) return;
      if (!f.name.trim() || !f.contact.trim()) return setState({ err: "Escriba el nombre y el correo." });
      if (!/@/.test(f.contact))
        return setState({ err: "Use un correo válido (ej. nombre@nara.com) para el acceso." });
      if (!isEdit && !(f.password || "").trim())
        return setState({ err: "Defina una contraseña para el nuevo usuario." });
      if ((f.password || "").trim() && (f.password || "").trim().length < 8)
        return setState({ err: "La contraseña debe tener al menos 8 caracteres." });
      if (f.role === "Observador" && !f.org.trim())
        return setState({ err: "Escriba la organización del observador." });
      if (f.role === "Paciente" && !(f.patientModules || []).length)
        return setState({ err: "Active al menos un módulo para la app del paciente." });
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

      const payload: any = {
        id: f.id || undefined,
        name: f.name.trim(),
        contact: f.contact.trim(),
        email: f.contact.trim(),
        password: (f.password || "").trim() || undefined,
        role: f.role,
        terr: f.terr,
        org: f.role === "Observador" ? f.org.trim() : "Programa NARA",
        modules: f.role === "Observador" ? (A.OBS_DEFAULT_MODULES || []).slice() : undefined,
        patientModules: f.role === "Paciente" ? (f.patientModules || []).slice() : undefined,
        status: f.status || "Activo",
      };

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
            contact: "",
            password: "",
            role: "Observador",
            terr: "Todos",
            org: "",
            modules: (A.OBS_DEFAULT_MODULES || []).slice(),
            patientModules: DEFAULT_PATIENT_MODULES.slice(),
          },
        }),
      noForm: !f,
      hasForm: !!f,
      formTitle: isEdit && f ? f.name : "Nuevo usuario",
      closeForm: () => setState({ f: null, sel: null, err: "" }),
      f: f || ({} as FormState),
      fSet: {
        name: setF("name"),
        contact: setF("contact"),
        password: setF("password"),
        role: (e: ChangeEvent<HTMLSelectElement>) => {
          const role = e.target.value;
          const next: FormState = Object.assign({}, f, {
            role,
            patientModules:
              role === "Paciente"
                ? f?.patientModules?.length
                  ? f.patientModules
                  : DEFAULT_PATIENT_MODULES.slice()
                : f?.patientModules || DEFAULT_PATIENT_MODULES.slice(),
          }) as FormState;
          if (role === "Observador") {
            next.modules = (A.OBS_DEFAULT_MODULES || []).slice();
            if (!next.terr) next.terr = "Todos";
          }
          if (role === "Experto de campo") {
            const names = Array.from(
              new Set(
                (A.TERRS || [])
                  .map((t: any) => t.name)
                  .concat((S.territories || []).map((t: any) => t.name))
                  .filter(Boolean),
              ),
            );
            if (!next.terr || /^todos$/i.test(next.terr) || !names.includes(next.terr)) {
              next.terr = names[0] || "";
            }
          }
          setState({ f: next, err: "" });
        },
        terr: setF("terr"),
        org: setF("org"),
      },
      terrOpts,
      isObs: !!f && f.role === "Observador",
      isPaciente: !!f && f.role === "Paciente",
      patientMods: PATIENT_APP_MODULES.map((m) => {
        const list = (f && f.patientModules) || DEFAULT_PATIENT_MODULES;
        const on = list.includes(m.id);
        return {
          key: m.id,
          name: m.name,
          desc: m.desc,
          swBg: on ? C.verde : "#C4BDB3",
          x: on ? "21px" : "3px",
          toggle: () =>
            setState({
              f: Object.assign({}, f, {
                patientModules: on ? list.filter((x) => x !== m.id) : list.concat([m.id]),
              }),
              err: "",
            }),
        };
      }),
      hasErr: !!st.err,
      err: st.err,
      clearErr: () => setState({ err: "" }),
      save,
      saveLabel: isEdit ? "Guardar cambios" : "Crear y enviar acceso",
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
  }, [A, router, setState, st]);

  return { v };
}
