"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_INACTIVE_MINUTES,
  patientStateLabel,
  resolveAdminPersonState,
} from "@/lib/clinical/patientStates";
import { useNaraStore } from "@/providers/nara-provider";

export function useAdminPersonaScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = String(searchParams.get("c") || "").trim();
  const [agentOpen, setAgentOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const u = store.session() as { role?: string; roleId?: string } | null;
    if (!u || (u.roleId !== "admin" && !/Admin/i.test(u.role || ""))) {
      router.replace("/ingreso");
    }
  }, [store, router]);

  // Releer UI cuando el sync global actualiza people/patients.
  useEffect(() => store.subscribe(() => setTick((t) => t + 1)), [store]);

  const v = useMemo(() => {
    void tick;
    const S = store.get();
    const people = (S.people || []) as any[];
    const patients = (S.patients || {}) as Record<string, any>;
    const person =
      people.find((p) => String(p.code || "") === code) ||
      people.find((p) => String(p.id || "") === code) ||
      null;

    const patient =
      (person && (patients[person.id] || Object.values(patients).find((x) => x.id === person.id))) ||
      Object.values(patients).find((x) => String(x.code || "") === code) ||
      null;

    if (!person && !patient) {
      return {
        ready: true,
        missing: true,
        code,
        agentOpen,
        openAgent: () => setAgentOpen(true),
        closeAgent: () => setAgentOpen(false),
        back: () => router.push("/personas"),
        msg,
        err,
        clearMsg: () => setMsg(""),
        clearErr: () => setErr(""),
      };
    }

    const id = String(person?.id || patient?.id || "");
    const rawProfile = person?.profile ?? patient?.profile;
    const hasProfile = !!(rawProfile && /^P\d+$/i.test(String(rawProfile)));
    const profile = hasProfile ? String(rawProfile) : "Sin perfil";
    const parsed = hasProfile ? store.parseCode(profile) : { r: -1, d: -1 };
    const risk = parsed.r >= 0 ? store.RISK[parsed.r] || store.RISK[0] : null;
    const dig = parsed.d >= 0 ? store.DIG[parsed.d] || store.DIG[0] : null;
    const week = Number(person?.week || patient?.week || 0);
    const weeks = Number(person?.weeks || patient?.weeks || 13);
    const pct = weeks ? Math.round((week / weeks) * 100) : 0;

    // Misma fuente que Rutas → Servicios por perfil: solo los activos de la ruta.
    const ctx = (patient?.ctx || person?.ctx || { dano: 0, perdida: 0 }) as {
      dano?: number;
      perdida?: number;
    };
    const pathServices = hasProfile
      ? (store.pathList(parsed.r, parsed.d, null, ctx) as Array<{
          id: string;
          name: string;
          freq: string;
          channel?: string;
          main?: boolean;
        }>)
      : [];

    const splitName = (full: string) => {
      const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return { firstName: "", lastName: "" };
      if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
      return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
    };
    const fullName = String(person?.name || patient?.name || "").trim();
    const fromSplit = splitName(fullName);
    const firstName = String(
      person?.firstName || patient?.firstName || fromSplit.firstName || "",
    ).trim();
    const lastName = String(
      person?.lastName || patient?.lastName || fromSplit.lastName || "",
    ).trim();
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") || fullName || "Persona";

    return {
      ready: true,
      missing: false,
      code: person?.code || patient?.code || code,
      id,
      name: displayName,
      firstName,
      lastName,
      showName: !!(firstName || lastName || fullName),
      age: person?.age ?? patient?.age ?? "—",
      birthDate: person?.birthDate || patient?.birthDate || "",
      terr: person?.terr || patient?.terr || "Sin territorio",
      place: person?.place || patient?.place || "—",
      phone: person?.phone || patient?.phone || "—",
      email: person?.email || patient?.email || "—",
      expert: (() => {
        const named = person?.expert || patient?.expert || "";
        if (named) return named;
        const terr = person?.terr || patient?.terr || "";
        if (!terr) return "Sin experto";
        const ex = (store.experts ? store.experts(S) : S.experts || []).find(
          (e: { terr?: string; active?: boolean; name?: string }) =>
            e.terr === terr && e.active !== false,
        );
        return ex?.name || "Sin experto";
      })(),
      clin: person?.clin || patient?.clin || "Sin clínico",
      status: (() => {
        const accounts = S.accounts || [];
        const account =
          accounts.find(
            (a: { id?: string; email?: string; roleId?: string; role?: string }) => {
              const isPatient =
                a.roleId === "paciente" || /Paciente/i.test(a.role || "");
              if (!isPatient) return false;
              return (
                (person?.accountId && a.id === person.accountId) ||
                (patient?.accountId && a.id === patient.accountId) ||
                (person?.email && a.email === person.email) ||
                (patient?.email && a.email === patient.email)
              );
            },
          ) || null;
        const prog =
          (store.courseProgress &&
            (store.courseProgress(S, id) ||
              store.courseProgress(S, person?.code || code))) ||
          null;
        let inactiveMinutes = DEFAULT_INACTIVE_MINUTES;
        if (hasProfile) {
          try {
            const { r, d } = store.parseCode(rawProfile);
            const path =
              (S.pathOverrides && S.pathOverrides[rawProfile]) ||
              store.defaultPath(r, d);
            const m = Number(path?.inactiveMinutes);
            if (Number.isFinite(m) && m > 0) inactiveMinutes = m;
          } catch {
            /* default */
          }
        }
        return patientStateLabel(
          resolveAdminPersonState(
            {
              status: person?.status || patient?.status || patient?.signal,
              profile: rawProfile,
              pendingEval: person?.pendingEval === true || patient?.pendingEval === true,
              week,
              weeks,
              id,
              code: person?.code || patient?.code || code,
              email: person?.email || patient?.email,
              accountId: person?.accountId || patient?.accountId,
              finalEvalAt: person?.finalEvalAt ?? patient?.finalEvalAt,
              inactiveLock:
                person?.inactiveLock === true || patient?.inactiveLock === true,
              activeAt: person?.activeAt ?? patient?.activeAt,
            },
            {
              account,
              inactiveMinutes,
              courseDone: prog ? Number(prog.done) || 0 : null,
              courseWeeks: prog?.c?.weeks != null ? Number(prog.c.weeks) : null,
            },
          ),
        );
      })(),
      profile,
      hasProfile,
      riskLabel: risk?.k || "—",
      riskColor: risk?.c || "#C4BDB3",
      digLabel: dig?.k || "—",
      week,
      weeks,
      pct: pct + "%",
      prog: `Semana ${week} de ${weeks}`,
      source: person?.source || patient?.source || "",
      sexo: person?.sexo || patient?.sexo || "",
      genero: person?.genero || patient?.genero || "",
      estadoCivil: person?.estadoCivil || patient?.estadoCivil || "",
      estrato: person?.estrato || patient?.estrato || "",
      modules: (() => {
        const enabled = new Set(
          Array.isArray(patient?.modulesEnabled)
            ? patient.modulesEnabled.map(String)
            : pathServices.map((s) => s.id),
        );
        // Mostrar servicios de la ruta; el switch refleja si están en la app (modulesEnabled).
        return pathServices.map((s) => {
          const on = enabled.has(s.id);
          return {
            key: s.id,
            name: s.name + (s.main ? " · servicio principal" : ""),
            desc: [s.freq, s.channel].filter(Boolean).join(" · ") +
              (on ? " · activo en la app" : " · en ruta, no habilitado en la app"),
            on,
            patientHid: !on,
            swBg: on ? "#2F6F4E" : "#C4BDB3",
            x: on ? "21px" : "3px",
          };
        });
      })(),
      agentOpen,
      openAgent: () => setAgentOpen(true),
      closeAgent: () => setAgentOpen(false),
      back: () => router.push("/personas"),
      msg,
      err,
      clearMsg: () => setMsg(""),
      clearErr: () => setErr(""),
    };
  }, [store, code, tick, agentOpen, msg, err, router]);

  return { v };
}
