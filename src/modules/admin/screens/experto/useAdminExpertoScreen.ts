"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";

export function useAdminExpertoScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = (searchParams.get("e") || "").trim();
  const [tick, setTick] = useState(0);
  const [agentOpen, setAgentOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);

  useEffect(() => {
    store.requireSession(["admin"]);
  }, [store]);

  useEffect(() => {
    if (!name) {
      router.replace("/equipos");
      return;
    }
    const S = store.get();
    const found = store.experts(S).find((e: { name: string }) => e.name === name);
    if (!found) router.replace("/equipos");
  }, [name, router, store, tick]);

  const v = useMemo(() => {
    void tick;
    const S = store.get();
    const C = store.C;
    if (!name) return null;
    const e = store.experts(S).find((x: { name: string }) => x.name === name);
    if (!e) return null;

    const eov = (S.expertOv || {})[name] || {};
    const terr = eov.terr || e.terr || "—";
    const exKey =
      e.id === "andres" || name === "Andrés Ocampo"
        ? "andres"
        : e.id === "mj" || name === "María José Vélez"
          ? "mj"
          : null;
    const q = exKey ? store.quotas(S, exKey) : { today: e.today || 0, todayT: e.target || 9, week: e.week || 0, weekT: 45 };
    const flags = (S.flags || []).filter((f: { expertName?: string; expert?: string }) => f.expertName === name || f.expert === e.id);
    const pending = flags.filter((f: { status: string }) => f.status === "pending").length;
    const people = store.people(S).filter((p: { expert?: string }) => p.expert === name);
    const active = eov.active !== false && e.active !== false;
    const training = e.training || "Pendiente";
    const isNew = !!e.isNew || training === "Pendiente";

    let status = "Al día";
    let sc = C.alDia;
    if (!active) {
      status = "Desactivado";
      sc = "#8C857C";
    } else if (pending) {
      status = "Revisar";
      sc = C.revisar;
    } else if (isNew) {
      status = "Capacitación pendiente";
      sc = "#8C857C";
    } else if ((q.week || 0) < 34) {
      status = "Bajo meta";
      sc = C.bajoMeta;
    }

    const terrNames = (S.territories || []).map((t: { name: string }) => t.name);

    return {
      name,
      phone: e.phone || "—",
      terr,
      status,
      sc,
      active,
      training,
      tablet: e.tablet || null,
      agentOpen,
      drawerW: typeof window !== "undefined" && window.innerWidth < 720 ? "100%" : "480px",
      openAgent: () => setAgentOpen(true),
      closeAgent: () => setAgentOpen(false),
      pendingAsk: "",
      back: () => router.push("/equipos"),
      msg,
      clearMsg: () => setMsg(""),
      kpis: [
        { label: "Visitas hoy", val: String(q.today || 0) + " / " + (q.todayT || e.target || 9), sub: "Meta diaria" },
        { label: "Semana", val: String(q.week || 0) + " / " + (q.weekT || 45), sub: "Visitas validadas" },
        { label: "Alertas QC", val: String(pending), sub: flags.length ? flags.length + " en total" : "Sin marcas" },
        { label: "Personas", val: String(people.length), sub: "Asignadas a este experto" },
      ],
      people: people.slice(0, 50).map((p: { code?: string; name: string; place?: string; status?: string; profile?: string }) => ({
        code: p.code || "—",
        name: p.name,
        place: p.place || "—",
        status: p.status || "—",
        profile: p.profile || "—",
        open: () => p.code && router.push("/admin/persona?c=" + encodeURIComponent(p.code)),
      })),
      noPeople: people.length === 0,
      flags: flags.slice(0, 20).map((f: { id?: string; when?: string; person?: string; reasons?: string[]; status: string }) => ({
        key: f.id || f.person + f.when,
        when: f.when || "—",
        person: f.person || "—",
        reasons: f.reasons || [],
        status: f.status === "pending" ? "Pendiente" : f.status === "approved" ? "Aprobada" : "Rechazada",
      })),
      noFlags: flags.length === 0,
      terrNames,
      setTerr: (terrName: string) => {
        store.set((s) => {
          const x = (s.experts || []).find((y: { name: string }) => y.name === name);
          if (x) x.terr = terrName;
          s.expertOv = s.expertOv || {};
          s.expertOv[name] = Object.assign({}, s.expertOv[name], { terr: terrName });
          store.logActivity(s, (store.session()?.id || "admin"), "Cambió el territorio de " + name + " a " + terrName);
        });
        setMsg("Territorio actualizado a " + terrName + ".");
      },
      toggleActive: () => {
        const nextActive = !active;
        store.set((s) => {
          s.expertOv = s.expertOv || {};
          s.expertOv[name] = Object.assign({}, s.expertOv[name], { active: nextActive });
          const x = (s.experts || []).find((y: { name: string }) => y.name === name);
          if (x) x.active = nextActive;
          store.logActivity(s, (store.session()?.id || "admin"), (nextActive ? "Activó" : "Desactivó") + " a " + name);
        });
        setMsg(nextActive ? "Experto activado." : "Experto desactivado.");
      },
      completeTraining: () => {
        store.set((s) => {
          const x = (s.experts || []).find((y: { name: string }) => y.name === name);
          if (x) {
            x.training = "Completa · 16 h";
            x.isNew = false;
          }
          store.logActivity(s, (store.session()?.id || "admin"), "Marcó capacitación completa de " + name);
        });
        setMsg("Capacitación marcada como completa.");
      },
      assignTablet: () => {
        store.set((s) => {
          const x = (s.experts || []).find((y: { name: string }) => y.name === name);
          if (x && !x.tablet) {
            const n = (s.experts || []).filter((z: { tablet?: string | boolean }) => z.tablet).length + 1;
            x.tablet = "TB-" + String(n).padStart(3, "0");
          }
          store.logActivity(s, (store.session()?.id || "admin"), "Asignó tablet a " + name);
        });
        setMsg("Tablet asignada.");
      },
      goAssets: () => router.push("/activos"),
      goTeam: () => router.push("/equipos"),
    };
  }, [agentOpen, msg, name, router, store, tick]);

  return { v };
}
