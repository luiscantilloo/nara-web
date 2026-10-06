"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";

export function useAdminTerritorioScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = (searchParams.get("t") || "").trim();
  const [tick, setTick] = useState(0);
  const [agentOpen, setAgentOpen] = useState(false);
  const [crisisLine, setCrisisLine] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);

  useEffect(() => {
    const u = store.requireSession(["paula"]);
    if (!u) return;
  }, [store]);

  const v = useMemo(() => {
    void tick;
    const S = store.get();
    const C = store.C;
    if (!name) return null;
    const t = store.terrInfo(S, name);
    if (!t) return null;

    const ov = (S.terrOv || {})[name] || {};
    const exps = store.experts(S).filter((e: { terr?: string; active?: boolean }) => e.terr === name && e.active !== false);
    const people = store.people(S).filter((p: { terr?: string }) => p.terr === name);
    const map = store.placeMap(S, name);
    const paused = !!ov.paused;
    const cap = t.cap || 0;
    const goal = t.goal || 0;
    const pct = goal ? Math.round((cap / goal) * 100) : 0;
    let status = "En curso";
    let sc = C.alDia;
    if (!cap) {
      status = "Sin iniciar";
      sc = "#8C857C";
    } else if (goal && cap / goal < 0.3) {
      status = "Captación lenta";
      sc = C.bajoMeta;
    } else if ((t.rural || 0) < (t.ruralG || 0) - 2) {
      status = "Bajo cuota rural";
      sc = C.revisar;
    }
    if (paused) {
      status = "En pausa";
      sc = "#8C857C";
    }

    const content: string[] = ov.content || t.content || [];
    const instsList: string[] = Array.isArray(t.insts)
      ? t.insts
      : typeof t.insts === "number" && t.insts > 0
        ? [t.insts + (t.insts === 1 ? " institución configurada" : " instituciones configuradas")]
        : [];

    return {
      name,
      dep: t.dep || "—",
      level: t.level || "—",
      status,
      sc,
      paused,
      agentOpen,
      drawerW: typeof window !== "undefined" && window.innerWidth < 720 ? "100%" : "480px",
      openAgent: () => setAgentOpen(true),
      closeAgent: () => setAgentOpen(false),
      pendingAsk: "",
      back: () => router.push("/territorios"),
      kpis: [
        { label: "Captación", val: cap.toLocaleString("es-CO") + " / " + goal.toLocaleString("es-CO"), sub: pct + " % de la meta" },
        { label: "Rural", val: cap ? (t.rural || 0) + " %" : "—", sub: "Meta " + (t.ruralG || 0) + " %" },
        { label: "60+", val: String(t.sixty || 0) + (cap ? " %" : ""), sub: "Meta " + (t.sixtyG || 0) + " %" },
        { label: "Manillas disponibles", val: String((t.brAv || 0) + (ov.extraBr || 0)), sub: (t.brD || 0) + " entregadas · " + (t.brA || 0) + " asignadas" },
        { label: "Expertos", val: String(exps.length), sub: people.length + " personas en el territorio" },
      ],
      content,
      insts: instsList,
      experts: exps.map((e: { name: string; today?: number; week?: number; phone?: string; training?: string }) => ({
        name: e.name,
        today: e.today || 0,
        week: e.week || 0,
        phone: e.phone || "—",
        training: e.training || "—",
        open: () => router.push("/admin/experto?e=" + encodeURIComponent(e.name)),
      })),
      places: (map?.rows || []).map((r: { name: string; rural: boolean; n: number; goal: number; pct: number; expert: string; alerts: number }) => ({
        name: r.name,
        zone: r.rural ? "Rural" : "Urbano",
        n: r.n,
        goal: r.goal,
        pct: r.pct + "%",
        expert: r.expert,
        alerts: r.alerts,
      })),
      noPlaces: !(map?.rows || []).length,
      placeSummary: map?.summary || "Sin veredas ni barrios registrados",
      crisisLine,
      setCrisisLine: (e: ChangeEvent<HTMLInputElement>) => setCrisisLine(e.target.value),
      msg,
      clearMsg: () => setMsg(""),
      togglePause: () => {
        store.set((s) => {
          s.terrOv = s.terrOv || {};
          s.terrOv[name] = Object.assign({}, s.terrOv[name], { paused: !paused });
          store.logActivity(s, "paula", (paused ? "Reanudó" : "Pausó") + " el territorio " + name);
        });
        setMsg(paused ? "Territorio reanudado." : "Territorio en pausa.");
      },
      saveCrisis: () => {
        store.set((s) => {
          s.terrOv = s.terrOv || {};
          s.terrOv[name] = Object.assign({}, s.terrOv[name], { crisisLine: crisisLine.trim() });
          store.logActivity(s, "paula", "Actualizó la línea de crisis de " + name);
        });
        setMsg("Línea de crisis guardada.");
      },
      assignBands: () => {
        store.set((s) => {
          const x = (s.territories || []).find((y: { name: string }) => y.name === name);
          if (x) {
            x.br = (x.br || 0) + 100;
            x.brA = (x.brA || 0) + 100;
            x.brAv = (x.brAv || 0) + 100;
          }
          s.terrOv = s.terrOv || {};
          s.terrOv[name] = Object.assign({}, s.terrOv[name], { extraBr: ((s.terrOv[name] || {}).extraBr || 0) });
          store.logActivity(s, "paula", "Asignó 100 manillas a " + name);
        });
        setMsg("Se asignaron 100 manillas a " + name + ".");
      },
      goExperts: () => router.push("/equipos"),
      goAssets: () => router.push("/activos"),
      goPeople: () => router.push("/personas"),
    };
  }, [agentOpen, crisisLine, msg, name, router, store, tick]);

  useEffect(() => {
    if (!name) {
      router.replace("/territorios");
      return;
    }
    const S = store.get();
    if (!store.terrInfo(S, name)) {
      router.replace("/territorios");
      return;
    }
    const ov = (S.terrOv || {})[name] || {};
    setCrisisLine(ov.crisisLine || "");
    if (typeof window !== "undefined") {
      (window as unknown as { __naraTerr?: string }).__naraTerr = name;
    }
  }, [name, router, store, tick]);

  return { v };
}
