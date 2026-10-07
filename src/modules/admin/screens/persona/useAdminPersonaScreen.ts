"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";
import {
  DEFAULT_PATIENT_MODULES,
  PATIENT_APP_MODULES,
  type PatientModuleId,
} from "@/lib/db/patientModules";

export function useAdminPersonaScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = String(searchParams.get("c") || "").trim();
  const [agentOpen, setAgentOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const u = store.session() as { role?: string; roleId?: string } | null;
    if (!u || (u.roleId !== "admin" && !/Admin/i.test(u.role || ""))) {
      router.replace("/ingreso");
    }
  }, [store, router]);

  useEffect(() => {
    if (!code) return;
    // Forzar relectura cuando llega gente de Mongo
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, [code]);

  // Asegurar ficha clínica en store (módulos vienen de /api/patients)
  useEffect(() => {
    const S = store.get();
    const people = (S.people || []) as { id?: string; code?: string }[];
    const person =
      people.find((p) => String(p.code || "") === code) ||
      people.find((p) => String(p.id || "") === code) ||
      null;
    const pid = person?.id;
    if (!pid) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/patients", { credentials: "same-origin" });
        const data = (await res.json()) as {
          ok?: boolean;
          patients?: Array<Record<string, unknown> & { id: string }>;
        };
        if (cancelled || !res.ok || !data.ok || !Array.isArray(data.patients)) return;
        const row = data.patients.find((p) => p.id === pid);
        if (!row) return;
        store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
          s.patients = s.patients || {};
          s.patients[pid] = { ...(s.patients[pid] || {}), ...row };
        });
        setTick((t) => t + 1);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, store]);

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
    const profile = String(person?.profile || patient?.profile || "P01");
    const parsed = store.parseCode(profile);
    const risk = store.RISK[parsed.r] || store.RISK[0];
    const dig = store.DIG[parsed.d] || store.DIG[0];
    const week = Number(person?.week || 0);
    const weeks = Number(person?.weeks || 13);
    const pct = weeks ? Math.round((week / weeks) * 100) : 0;

    const enabled: PatientModuleId[] = Array.isArray(patient?.modulesEnabled)
      ? patient.modulesEnabled
      : DEFAULT_PATIENT_MODULES.slice();
    const visible: PatientModuleId[] = Array.isArray(patient?.modulesVisible)
      ? patient.modulesVisible.filter((m: string) => enabled.includes(m as PatientModuleId))
      : enabled.slice();

    const toggleModule = async (modId: PatientModuleId) => {
      if (!id || saving) return;
      const next = enabled.includes(modId)
        ? enabled.filter((m) => m !== modId)
        : enabled.concat([modId]);
      if (!next.length) {
        setErr("Deje al menos un módulo activo.");
        return;
      }
      setSaving(true);
      setErr("");
      try {
        const res = await fetch("/api/patients/modules", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: id, modulesEnabled: next }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setErr(data.error || "No se pudieron guardar los módulos.");
          return;
        }
        store.set((s: any) => {
          s.patients = s.patients || {};
          const prev = s.patients[id] || patient || { id, name: person?.name || id };
          s.patients[id] = {
            ...prev,
            modulesEnabled: data.modulesEnabled,
            modulesVisible: data.modulesVisible,
          };
        });
        setMsg(
          "Módulos guardados. En la app del paciente (tras recargar) solo verá lo que quedó en verde.",
        );
        setTick((t) => t + 1);
      } catch {
        setErr("No se pudo conectar con la base de datos.");
      } finally {
        setSaving(false);
      }
    };

    return {
      ready: true,
      missing: false,
      code: person?.code || code,
      id,
      name: patient?.name || person?.name || "Persona",
      showName: !!patient?.name,
      age: person?.age ?? patient?.age ?? "—",
      terr: person?.terr || patient?.terr || "Sin territorio",
      place: person?.place || patient?.place || "—",
      phone: patient?.phone || person?.phone || "—",
      email: patient?.email || person?.email || "—",
      expert: person?.expert || patient?.expert || "Sin experto",
      clin: person?.clin || patient?.clin || "Sin clínico",
      status: person?.status || patient?.signal || "Activa",
      profile,
      riskLabel: risk.k,
      riskColor: risk.c,
      digLabel: dig.k,
      week,
      weeks,
      pct: pct + "%",
      prog: `Semana ${week} de ${weeks}`,
      source: patient?.source || person?.source || "",
      sexo: patient?.sexo || "",
      genero: patient?.genero || "",
      estadoCivil: patient?.estadoCivil || "",
      estrato: patient?.estrato || "",
      modules: PATIENT_APP_MODULES.map((m) => {
        const on = enabled.includes(m.id);
        const patientHid = on && !visible.includes(m.id);
        return {
          key: m.id,
          name: m.name,
          desc: m.desc,
          on,
          patientHid,
          swBg: on ? "#2F6F4E" : "#C4BDB3",
          x: on ? "21px" : "3px",
          toggle: () => void toggleModule(m.id),
        };
      }),
      saving,
      agentOpen,
      openAgent: () => setAgentOpen(true),
      closeAgent: () => setAgentOpen(false),
      back: () => router.push("/personas"),
      msg,
      err,
      clearMsg: () => setMsg(""),
      clearErr: () => setErr(""),
    };
  }, [store, code, tick, agentOpen, msg, err, saving, router]);

  return { v };
}
