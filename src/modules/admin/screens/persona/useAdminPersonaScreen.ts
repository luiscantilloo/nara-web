"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    const rawProfile = person?.profile ?? patient?.profile;
    const hasProfile = !!(rawProfile && /^P\d+$/i.test(String(rawProfile)));
    const profile = hasProfile ? String(rawProfile) : "Sin perfil";
    const parsed = hasProfile ? store.parseCode(profile) : { r: -1, d: -1 };
    const risk = parsed.r >= 0 ? store.RISK[parsed.r] || store.RISK[0] : null;
    const dig = parsed.d >= 0 ? store.DIG[parsed.d] || store.DIG[0] : null;
    const week = Number(person?.week || 0);
    const weeks = Number(person?.weeks || 13);
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
      status: person?.status || patient?.signal || "Sin evaluación",
      profile,
      hasProfile,
      riskLabel: risk?.k || "—",
      riskColor: risk?.c || "#C4BDB3",
      digLabel: dig?.k || "—",
      week,
      weeks,
      pct: pct + "%",
      prog: `Semana ${week} de ${weeks}`,
      source: patient?.source || person?.source || "",
      sexo: patient?.sexo || "",
      genero: patient?.genero || "",
      estadoCivil: patient?.estadoCivil || "",
      estrato: patient?.estrato || "",
      modules: pathServices.map((s) => ({
        key: s.id,
        name: s.name + (s.main ? " · servicio principal" : ""),
        desc: [s.freq, s.channel].filter(Boolean).join(" · "),
        on: true,
        patientHid: false,
        swBg: "#2F6F4E",
        x: "21px",
      })),
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
