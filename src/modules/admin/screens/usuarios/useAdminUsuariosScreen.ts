"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { adminPathForView } from "@/modules/admin/routes";
import { useNaraStore } from "@/providers/nara-provider";

const ROLES = ["Administrador", "Experto de campo", "Clínico", "Observador"];

type FormState = {
  id: string | null;
  name: string;
  contact: string;
  role: string;
  terr: string;
  org: string;
  orgType: string;
  modules: string[];
  ethics: string;
  status?: string;
  derived?: boolean;
};

type UiState = {
  zoom: number;
  agentOpen: boolean;
  msg: string;
  rf: string;
  q: string;
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
    const u = A.session();
    if (!u || u.id !== "paula") {
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
    const f = st.f;
    const isEdit = !!(f && f.id);
    const setF = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setState({ f: Object.assign({}, f, { [k]: e.target.value }), err: "" });
    const MN = A.OBS_MODULES.reduce((a: Record<string, string>, m: any) => {
      a[m.id] = m.name;
      return a;
    }, {});
    const open = (u: any) =>
      setState({
        sel: u.id,
        err: "",
        f: {
          id: u.id,
          name: u.name,
          contact: u.contact || "",
          role: u.role,
          terr: u.terr,
          org: u.org,
          orgType: u.orgType || "Financiador",
          modules: (u.modules || []).slice(),
          ethics: u.ethics || "",
          status: u.status,
          derived: u.derived,
        },
      });
    const mods = (f && f.modules) || [];
    const needEthics = mods.includes("datos");
    const tplMatch = (k: string) =>
      JSON.stringify(A.OBS_TEMPLATES[k].slice().sort()) === JSON.stringify(mods.slice().sort());
    const terrOpts = Array.from(
      new Set(
        ["Todos"]
          .concat(A.TERRS.map((t: any) => t.name))
          .concat((S.territories || []).map((t: any) => t.name))
          .concat(["Quindío", "Risaralda", "Caldas"])
          .filter(Boolean),
      ),
    );

    const save = () => {
      if (!f) return;
      if (!f.name.trim() || !f.contact.trim()) return setState({ err: "Escriba el nombre y un correo o celular." });
      if (!/@/.test(f.contact) && f.contact.replace(/\D/g, "").length < 10)
        return setState({ err: "El correo no es válido o el celular no tiene 10 dígitos." });
      if (f.role === "Observador" && !mods.length)
        return setState({ err: "Active al menos un módulo para el observador." });
      if (f.role === "Observador" && !f.org.trim())
        return setState({ err: "Escriba la organización del observador." });
      if (needEthics && f.role === "Observador" && !/\w{2,}-?\d/.test(f.ethics || ""))
        return setState({ err: "Datos seudonimizados exige el número de aprobación ética." });
      const rec: any = {
        name: f.name.trim(),
        contact: f.contact.trim(),
        role: f.role,
        terr: f.terr,
        org: f.role === "Observador" ? f.org.trim() : "Programa NARA",
        orgType: f.role === "Observador" ? f.orgType : undefined,
        modules: f.role === "Observador" ? mods.slice() : undefined,
        ethics: needEthics ? f.ethics : undefined,
      };
      let id = f.id;
      A.set((s: any) => {
        if (id) {
          let a = s.accounts.find((x: any) => x.id === id);
          if (!a) {
            a = { id, status: "Activo" };
            s.accounts.push(a);
          }
          Object.assign(a, rec);
          if (rec.role === "Experto de campo")
            s.expertOv[rec.name] = Object.assign({}, s.expertOv[rec.name], {
              terr: rec.terr,
              phone: rec.contact,
            });
          A.logActivity(s, "paula", "Editó el usuario " + rec.name);
          if (rec.role === "Observador" && s.notifs[id])
            A.pushNotif(
              s,
              id,
              "Sus permisos cambiaron: " + mods.map((m: string) => MN[m]).join(", "),
              "/observador",
            );
        } else {
          id = "u" + Date.now();
          s.accounts.push(Object.assign({ id, status: "Activo", created: true }, rec));
          s.notifs[id] = [];
          A.logActivity(s, "paula", "Creó el usuario " + rec.name + " (" + rec.role + ")");
          A.logActivity(s, id, "Cuenta creada · acceso enviado");
        }
      });
      setState({
        f: null,
        sel: null,
        msg: isEdit
          ? "Cambios guardados para " + rec.name + "."
          : "Usuario creado. Se envió el acceso a " +
            rec.contact +
            (rec.role === "Observador"
              ? ". Verá solo: " + mods.map((m: string) => MN[m]).join(", ") + "."
              : "."),
      });
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
          go: () => setState({ rf: val }),
        })),
      q: st.q,
      setQ: (e: ChangeEvent<HTMLInputElement>) => setState({ q: e.target.value }),
      users: list.map((u: any) => ({
        key: u.id,
        name: u.name + (u.lead ? " · líder clínica" : ""),
        contact: u.contact || "",
        role: u.role,
        mods: u.role === "Observador" ? (u.modules || []).map((m: string) => MN[m]).join(" · ") : "",
        org: u.org,
        terr: u.terr,
        status: u.status,
        sc: u.status === "Activo" ? C.alDia : "#8C857C",
        bg: st.sel === u.id ? "#FFF4CC" : "#fff",
        pick: () => open(u),
      })),
      noUsers: !list.length,
      newUser: () =>
        setState({
          sel: null,
          err: "",
          f: {
            id: null,
            name: "",
            contact: "",
            role: "Observador",
            terr: "Todos",
            org: "",
            orgType: "Financiador",
            modules: A.OBS_TEMPLATES["Financiador"].slice(),
            ethics: "",
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
        role: setF("role"),
        terr: setF("terr"),
        org: setF("org"),
        orgType: (e: ChangeEvent<HTMLSelectElement>) => {
          const val = e.target.value;
          setState({
            f: Object.assign({}, f, {
              orgType: val,
              modules: A.OBS_TEMPLATES[val] ? A.OBS_TEMPLATES[val].slice() : mods,
            }),
          });
        },
        ethics: setF("ethics"),
      },
      terrOpts,
      isObs: !!f && f.role === "Observador",
      tpls: Object.keys(A.OBS_TEMPLATES).map((k) => ({
        key: k,
        label: k,
        bd: tplMatch(k) ? C.verde : C.lineas,
        bg: tplMatch(k) ? "#FFF4CC" : "#fff",
        go: () =>
          setState({
            f: Object.assign({}, f, { modules: A.OBS_TEMPLATES[k].slice(), orgType: k }),
            err: "",
          }),
      })),
      mods: A.OBS_MODULES.map((m: any) => {
        const on = mods.includes(m.id);
        return {
          key: m.id,
          name: m.name,
          desc: m.desc,
          swBg: on ? C.verde : "#C4BDB3",
          x: on ? "21px" : "3px",
          toggle: () =>
            setState({
              f: Object.assign({}, f, {
                modules: on ? mods.filter((x: string) => x !== m.id) : mods.concat([m.id]),
              }),
              err: "",
            }),
        };
      }),
      needEthics,
      ethicsBd: needEthics && !(f && f.ethics) ? C.revisar : C.lineas,
      hasErr: !!st.err,
      err: st.err,
      clearErr: () => setState({ err: "" }),
      save,
      saveLabel: isEdit ? "Guardar cambios" : "Crear y enviar acceso",
      isEdit,
      statusLabel: f && f.status === "Activo" ? "Desactivar usuario" : "Activar usuario",
      toggleStatus: () => {
        if (!f || !f.id) return;
        const nv = f.status === "Activo" ? "Inactivo" : "Activo";
        A.set((s: any) => {
          let a = s.accounts.find((x: any) => x.id === f.id);
          if (!a) {
            a = {
              id: f.id,
              name: f.name,
              contact: f.contact,
              role: f.role,
              org: f.org,
              terr: f.terr,
            };
            s.accounts.push(a);
          }
          a.status = nv;
          if (f.role === "Experto de campo")
            s.expertOv[f.name] = Object.assign({}, s.expertOv[f.name], { active: nv === "Activo" });
          A.logActivity(s, "paula", (nv === "Activo" ? "Activó" : "Desactivó") + " a " + f.name);
        });
        setState({
          f: Object.assign({}, f, { status: nv }),
          msg: f.name + (nv === "Activo" ? " puede ingresar." : " ya no puede ingresar."),
        });
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
