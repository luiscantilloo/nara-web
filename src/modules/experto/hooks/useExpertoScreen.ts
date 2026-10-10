/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRouteLoading } from "@/components/shared/nara-loading/RouteLoadingProvider";
import { needsClosingEval } from "@/lib/clinical/patientStates";
import { useRequireSession } from "@/hooks/useRequireSession";
import { pauseLiveHydrate } from "@/lib/store/hydrateProgram";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import {
  expertoPathForScreen,
  expertoScreenForPath,
} from "@/modules/experto/routes";

const blank = (n: number) =>
  Array.from({ length: n }, () => ({ v: null as number | null, st: "none" as const }));
const OK_BG = "#FFF4CC";

const GENERO_OPTS = ["Femenino", "Masculino", "No binario", "Otro", "Prefiere no decir"];
const CIVIL_OPTS = ["Soltero/a", "Casado/a", "Unión libre", "Separado/a", "Divorciado/a", "Viudo/a"];
const ESTRATO_OPTS = ["1", "2", "3", "4", "5", "6"];

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

function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

/**
 * H-009 (reporte TRL 2026-10-10): el clínico de la ficha lo resuelve el servidor (la cuenta Clínico activa
 * del territorio). El navegador ya no inventa un nombre por departamento.
 */
function clinForTerr(_terr: string): string {
  return "";
}

function emptyPersonForm(partial: Record<string, string> = {}) {
  return {
    id: "",
    code: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    age: "",
    phone: "",
    email: "",
    place: "",
    terr: "",
    genero: "",
    estadoCivil: "",
    estrato: "",
    expert: "",
    clin: "",
    ...partial,
  };
}

/**
 * Reporte TRL 2026-10-10 (F-02): consentimiento, evaluación y resultado son páginas distintas y cada una
 * monta el hook de nuevo. El borrador de la visita (respuestas, consentimiento, firma) se conserva en
 * sessionStorage por persona mientras dura la visita; se borra al guardarla o al volver a la lista.
 */
const VISITA_KEY = (pid: string) => `nara-visita-${pid}`;
const VISITA_CAMPOS = ["consent", "signed", "ruego", "witness", "mode", "sec", "items", "crisis", "override", "reason", "startTime", "courseSel", "chat", "step", "gps"] as const;
function leerBorradorVisita(pid: string | null): Record<string, unknown> | null {
  if (!pid || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(VISITA_KEY(pid));
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
function guardarBorradorVisita(pid: string | null, st: Record<string, unknown>) {
  if (!pid || typeof window === "undefined") return;
  try {
    const out: Record<string, unknown> = {};
    for (const k of VISITA_CAMPOS) out[k] = st[k];
    window.sessionStorage.setItem(VISITA_KEY(pid), JSON.stringify(out));
  } catch {
    /* sin sessionStorage: la visita sigue en memoria */
  }
}
function borrarBorradorVisita(pid: string | null) {
  if (!pid || typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(VISITA_KEY(pid));
  } catch {
    /* nada que borrar */
  }
}

export function useExpertoScreen() {
  const store = useNaraStore();
  const live = useNaraLive();
  const session = useRequireSession(["experto"]);
  const router = useRouter();
  const pathname = usePathname();
  const { start: startRouteLoading } = useRouteLoading();
  const ex = session?.id || "andres";
  const expertName = session?.name || "Experto de campo";
  const terrName = session?.terr && session.terr !== "—" ? session.terr : "Salento";

  // Buckets operativos por id de experto (ya no solo andres/mj)
  useEffect(() => {
    if (!session?.id) return;
    store.set((s: any) => {
      s.worklists = s.worklists || {};
      if (!Array.isArray(s.worklists[session.id])) s.worklists[session.id] = [];
      s.revisits = s.revisits || {};
      if (!Array.isArray(s.revisits[session.id])) s.revisits[session.id] = [];
      s.groupSessions = s.groupSessions || {};
      if (!Array.isArray(s.groupSessions[session.id])) s.groupSessions[session.id] = [];
      s.notifs = s.notifs || {};
      if (!Array.isArray(s.notifs[session.id])) s.notifs[session.id] = [];
      s.weekBase = s.weekBase || {};
      if (s.weekBase[session.id] == null) s.weekBase[session.id] = 0;
      s.rejected = s.rejected || {};
      if (s.rejected[session.id] == null) s.rejected[session.id] = 0;
      s.pendingSync = s.pendingSync || {};
      if (s.pendingSync[session.id] == null) s.pendingSync[session.id] = 0;
      s.notices = s.notices || {};
      if (!Array.isArray(s.notices[session.id])) s.notices[session.id] = [];
    });
  }, [session?.id, store]);

  const [st, setStateRaw] = useState(() => {
    const inicial = {
    screen: "list",
    pid: null as string | null,
    gps: null as null | { lat?: number; lng?: number; precision?: number; at?: number; error?: string },
    consent: {} as Record<string, boolean>,
    signed: false,
    ruego: false,
    witness: "",
    mode: "form",
    sec: "phq",
    items: { phq: blank(9), dig: blank(6), ctx: blank(2) },
    chat: [] as { who: string; text: string; label?: string }[],
    chatInput: "",
    step: 0,
    thinking: false,
    crisis: false,
    override: "keep",
    reason: "",
    reasonErr: "",
    toast: "",
    nf: emptyPersonForm(),
    newForm: false,
    /** Si hay id, el modal es «Evaluar» sobre persona asignada (no alta nueva). */
    editPid: null as string | null,
    dupOk: false,
    newMsg: "",
    consentMsg: "",
    startTime: "",
    agentOpen: false,
    gTab: {} as Record<string, string>,
    courseSel: undefined as string | undefined,
    er: null as { slug: string; page: number } | null,
    };
    // Al montar una página de la visita, recuperar su borrador (F-02).
    const ruta = expertoScreenForPath(pathname || "/experto");
    const borrador = ruta.pid && ruta.screen ? leerBorradorVisita(ruta.pid) : null;
    return borrador
      ? { ...inicial, ...borrador, screen: ruta.screen as string, pid: ruta.pid as string }
      : inicial;
  });

  // Guardar el borrador mientras se está en consentimiento, evaluación o resultado.
  useEffect(() => {
    if (st.pid && ["consent", "eval", "result"].includes(st.screen)) {
      guardarBorradorVisita(st.pid, st as unknown as Record<string, unknown>);
    }
  }, [st]);

  const pendingPathRef = useRef<string | null>(null);

  const setState = useCallback((u: Record<string, unknown> | ((s: typeof st) => Record<string, unknown>)) => {
    let navAway = false;
    setStateRaw((prev) => {
      const patch = typeof u === "function" ? u(prev) : u;
      const next = { ...prev, ...patch };
      // Fin de la visita (guardada o cancelada): el borrador ya no hace falta.
      if (next.screen === "list" && prev.pid) borrarBorradorVisita(prev.pid);
      const screenChanged =
        patch.screen !== undefined ||
        patch.newForm !== undefined ||
        (patch.pid !== undefined &&
          (next.screen === "consent" ||
            next.screen === "eval" ||
            next.screen === "result"));
      if (screenChanged) {
        const path = expertoPathForScreen(next.screen, {
          pid: next.pid,
          newForm: next.newForm,
        });
        if (path !== pathname) {
          pendingPathRef.current = path;
          navAway = true;
        }
      }
      return next;
    });
    // Loading en el mismo turno (flushSync) para no ver la pantalla nueva sin overlay.
    if (navAway) startRouteLoading();
  }, [pathname, startRouteLoading]);

  // H-008 (reporte TRL 2026-10-10, SPEC-006): la evidencia de la visita usa la posición real del navegador.
  useEffect(() => {
    if (st.screen !== 'consent' || !st.pid || st.gps) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStateRaw((prev: any) => ({ ...prev, gps: { error: 'el dispositivo no da ubicación' } }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setStateRaw((prev: any) => ({ ...prev, gps: { lat: pos.coords.latitude, lng: pos.coords.longitude, precision: Math.round(pos.coords.accuracy), at: Date.now() } })),
      (err) => setStateRaw((prev: any) => ({ ...prev, gps: { error: err.code === 1 ? 'permiso de ubicación negado' : 'no se pudo obtener' } })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [st.screen, st.pid, st.gps]);

  useEffect(() => {
    const path = pendingPathRef.current;
    if (!path) return;
    pendingPathRef.current = null;
    if (path !== pathname) router.push(path);
  }, [st.screen, st.pid, st.newForm, pathname, router]);

  // URL → estado (deep link / back-forward).
  // No recrear el formulario: el layout mantiene el estado; aquí solo alineamos la vista.
  useEffect(() => {
    const parsed = expertoScreenForPath(pathname || "/experto");
    setStateRaw((prev) => {
      if (parsed.newForm) {
        if (prev.newForm && prev.screen === "list") return prev;
        // Conservar nf / editPid si ya se cargaron al pulsar Evaluar.
        return { ...prev, screen: "list", newForm: true };
      }
      if (parsed.pid && parsed.screen) {
        if (
          prev.screen === parsed.screen &&
          prev.pid === parsed.pid &&
          !prev.newForm
        ) {
          return prev;
        }
        return {
          ...prev,
          screen: parsed.screen,
          pid: parsed.pid,
          newForm: false,
          // No tocar items/consent: vienen del setState de la visita.
        };
      }
      if (prev.screen === "list" && !prev.newForm && !prev.pid) return prev;
      // Volver a lista solo si la URL es /experto (no pisar estado al montar visita)
      if ((pathname || "").replace(/\/$/, "") === "/experto") {
        return {
          ...prev,
          screen: "list",
          newForm: false,
          pid: null,
          editPid: null,
        };
      }
      return prev;
    });
  }, [pathname]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visitStartRef = useRef(Date.now());
  const shortRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Último nf escrito: evita validar con un cierre de React obsoleto al pulsar «Empezar visita». */
  const nfRef = useRef(st.nf);
  const editPidRef = useRef(st.editPid);
  nfRef.current = st.nf;
  editPidRef.current = st.editPid;

  const sigInit = useCallback(
    (el: HTMLCanvasElement | null) => {
      if (!el || (el as HTMLCanvasElement & { _init?: boolean })._init) return;
      (el as HTMLCanvasElement & { _init?: boolean })._init = true;
      canvasRef.current = el;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#161413";
      let down = false;
      const pos = (ev: PointerEvent) => {
        const r = el.getBoundingClientRect();
        return [
          ((ev.clientX - r.left) * el.width) / r.width,
          ((ev.clientY - r.top) * el.height) / r.height,
        ];
      };
      el.addEventListener("pointerdown", (ev) => {
        down = true;
        const [x, y] = pos(ev);
        ctx.beginPath();
        ctx.moveTo(x, y);
        el.setPointerCapture(ev.pointerId);
      });
      el.addEventListener("pointermove", (ev) => {
        if (!down) return;
        const [x, y] = pos(ev);
        ctx.lineTo(x, y);
        ctx.stroke();
        setStateRaw((s) => (s.signed ? s : { ...s, signed: true }));
      });
      el.addEventListener("pointerup", () => {
        down = false;
      });
    },
    [],
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [st.screen]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = 1e6;
  }, [st.chat.length]);


const SCRIPT = [
  { note: 'Dice que casi no duerme desde el sismo; se despierta a las 3 de la mañana con miedo a que vuelva a temblar. Se le agrietó la cocina.',
    drafts: [['phq', 2, 3], ['ctx', 0, 1]],
    reply: 'Anoté como borrador:\n· Pregunta 3 (sueño): Casi todos los días\n· Daño en la vivienda: Parcial\n\nSiguiente: pregunte por el interés y la energía. Puede decir: «¿Ha podido seguir haciendo las cosas que le gustan? ¿Cómo anda de energía?»' },
  { note: 'Dejó de ir a misa y al grupo de costura. Está cansada más de la mitad de los días. Se siente triste, pero dice que no ha perdido la esperanza.',
    drafts: [['phq', 0, 2], ['phq', 1, 2], ['phq', 3, 2]],
    reply: 'Borradores: preguntas 1, 2 y 4 = Más de la mitad de los días.\n\nAhora pregunte por el apetito, cómo se siente consigo misma y la concentración. Cuando llegue a la pregunta 9, léala exactamente así:\n«En las últimas dos semanas, ¿con qué frecuencia ha pensado que estaría mejor muerto o muerta, o en hacerse daño de alguna forma?»' },
  { note: 'Algunos días come menos. A veces siente que es una carga para su hija. Algunos días se le olvidan las cosas. A la pregunta 9 respondió que nunca.',
    drafts: [['phq', 4, 1], ['phq', 5, 1], ['phq', 6, 1], ['phq', 7, 0], ['phq', 8, 0]],
    reply: 'Borradores: preguntas 5, 6 y 7 = Varios días; 8 y 9 = Nunca. Si los confirma, el total del cuestionario es 12.\n\nPasemos a capacidad digital: «¿Qué celular usa? ¿Tiene señal en la casa? ¿Manda audios?»' },
  { note: 'Usa el celular de su hija Paola. Tienen datos limitados. Manda audios por WhatsApp. Dice que tal vez usaría una app si la hija le ayuda.',
    drafts: [['dig', 0, 1], ['dig', 1, 1], ['dig', 2, 1], ['dig', 3, 1], ['dig', 4, 1], ['dig', 5, 1]],
    reply: 'Borradores de capacidad digital: las seis respuestas valen 1 punto (total 6, nivel Media). Revise cada sección y confirme.' }
];

  function go(screen) {
    setState({ screen, newForm: false });
  }
  function flash(t) { setState({ toast: t }); clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setState({ toast: '' }), 4200); }
  /** Ids con los que este experto aparece en people / worklists (cuenta, ficha y nombre). */
  function expertKeys(S: any) {
    const keys = new Set<string>();
    if (ex) keys.add(String(ex));
    if (expertName) keys.add(String(expertName));
    const experts = store.experts ? store.experts(S) : S.experts || [];
    experts.forEach((e: { id?: string; accountId?: string; name?: string }) => {
      if (e.id === ex || e.accountId === ex || e.name === expertName) {
        if (e.id) keys.add(String(e.id));
        if (e.accountId) keys.add(String(e.accountId));
        if (e.name) keys.add(String(e.name));
      }
    });
    return keys;
  }
  function person() {
    const S = store.get();
    if (store.ensureExpertBuckets) store.ensureExpertBuckets(S, ex);
    const keys = expertKeys(S);
    for (const k of keys) {
      const fromWl = (S.worklists[k] || []).find((w: { id?: string }) => w.id === st.pid);
      if (fromWl) return fromWl;
    }
    const fromPeople = (store.people ? store.people(S) : S.people || []).find(
      (p: { id?: string; code?: string }) => p.id === st.pid || p.code === st.pid,
    );
    if (fromPeople) return fromPeople;
    return { name: '', age: 0, place: '' };
  }
  function honor(p) { const first = p.name.split(' ')[0]; return p.age >= 60 ? (/a$/.test(first) ? 'doña ' : 'don ') + first : (ex === 'mj' ? 'don ' : '') + first; }
  function startVisit(w) {
    const now = new Date(); const hh = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    visitStartRef.current = Date.now();
    if (w.id === 'hernan') {
      const phq = [2, 3, 2, 3, 2, 2, 2, 1].map(v => ({ v, st: 'ok' })).concat([{ v: null, st: 'none' }]);
      const dig = [2, 1, 1, 2, 1, 1].map(v => ({ v, st: 'ok' }));
      const ctx = [{ v: 1, st: 'ok' }, { v: 0, st: 'ok' }];
      visitStartRef.current = Date.now() - 24 * 60000;
      setState({ pid: w.id, screen: 'eval', newForm: false, editPid: null, mode: 'form', sec: 'phq', items: { phq, dig, ctx }, consent: { r0: 1, r1: 1, r2: 1, o0: 1, o1: 1, o2: 1 }, signed: true, crisis: false, chat: [], step: 0, override: 'keep', reason: '', startTime: '10:58' });
      return;
    }
    setState({ pid: w.id, screen: 'consent', newForm: false, editPid: null, gps: null, consent: {}, signed: false, ruego: false, witness: '', mode: 'form', sec: 'phq', items: { phq: blank(9), dig: blank(6), ctx: blank(2) }, crisis: false, step: 0, override: 'keep', reason: '', reasonErr: '', consentMsg: '', startTime: hh,
      chat: [{ who: 'ai', label: 'TEO sugiere · cómo abrir', text: 'Empiece sin mencionar el cuestionario. Puede decir:\n«¿Cómo ha estado usted y su familia desde el sismo?»' }] });
  }
  function setItem(sec: string, i: number, v: number, stItem: string) {
    const items = JSON.parse(JSON.stringify(st.items));
    items[sec][i] = { v, st: stItem };
    setState({ items });
    // SPEC-04 (RG-01, matriz v2): la pregunta 9 > 0 avisa de inmediato al clínico del territorio,
    // sin esperar a cerrar el cuestionario. Mismo mecanismo que «Estoy en crisis» del paciente
    // (id 'a-<pid>', que es el que muestra la pantalla de resultado). Si después se corrige a 0,
    // la alerta no se borra: la cierra el clínico.
    if (sec === 'phq' && i === 8 && Number(v) > 0 && st.pid) {
      const p = person();
      const alerta = {
        id: 'a-' + st.pid,
        sev: 'crisis',
        pid: st.pid,
        name: p.name,
        age: p.age,
        place: (p.place || '').split(',')[0] || p.place,
        profile: (p as { profile?: string }).profile || '',
        what: 'Respondió ' + v + ' en la pregunta 9 del PHQ-9 durante la visita del experto de campo.',
        term: 'PHQ-9 pregunta 9 > 0',
        source: 'Experto de campo · cuestionario',
        createdByRole: 'experto',
        phone: (p as { phone?: string }).phone || '',
      };
      setState({ crisis: true });
      // H-002 (SPEC-002 FR-002): el servidor guarda la alerta al momento (POST /api/alerts), aunque la persona
      // todavía no sea paciente y aunque la visita no se guarde. Antes se escribía en app-state, que la
      // descartaba, y POST /api/patients respondía 403 al experto.
      void (async () => {
        for (let intento = 0; intento < 4; intento++) {
          if (intento) await new Promise((ok) => setTimeout(ok, 3000 * intento));
          try {
            const res = await fetch('/api/alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(alerta),
            });
            if (res.ok) {
              const { alert } = (await res.json()) as { alert?: Record<string, unknown> };
              store.set((s: { alerts: Record<string, unknown>[] }) => {
                if (!s.alerts.some((x) => x.id === alerta.id)) s.alerts.unshift(alert || { ...alerta, at: Date.now(), status: 'new' });
              });
              return;
            }
            if (res.status === 403 || res.status === 400) break;
          } catch {
            /* sin señal: se reintenta */
          }
        }
        // Respaldo: alerta local, que se sincroniza con app-state cuando haya conexión.
        store.addAlert(alerta);
      })();
    }
  }
  function applyDrafts(list: [string, number, number][]) {
    const items = JSON.parse(JSON.stringify(st.items));
    list.filter(([sec, i]) => !(sec === 'phq' && i === 8)).forEach(([sec, i, v]) => { if (items[sec] && items[sec][i] && items[sec][i].st !== 'ok') items[sec][i] = { v, st: 'draft' }; });
    setState({ items });
  }
  async function sendChat() {
    const text = st.chatInput.trim(); if (!text) return;
    const chat = st.chat.concat([{ who: 'exp', text }]);
    const sc = SCRIPT[st.step];
    if (sc && text === sc.note) {
      setState({ chat, chatInput: '', thinking: true });
      setTimeout(() => { applyDrafts(sc.drafts); setState(s => ({ thinking: false, step: s.step + 1, chat: s.chat.concat([{ who: 'ai', label: 'TEO sugiere · sin confirmar', text: sc.reply }]), sec: sc.drafts[0][0] === 'dig' ? 'dig' : s.sec })); }, 700);
      return;
    }
    setState({ chat, chatInput: '', thinking: true });
    const S = store;
    const cur = { phq: st.items.phq.map(x => x.v), dig: st.items.dig.map(x => x.v), ctx: st.items.ctx.map(x => x.v) };
    const prompt = `Eres el asistente de evaluación de NARA, un programa de salud mental post-sismo en el Eje Cafetero (Colombia). Un experto de campo está en una visita y te escribe en lenguaje natural lo que la persona le cuenta. Propones BORRADORES de respuesta para el registro; el experto los confirma.
Ítems:
PHQ-9 (sec "phq", i 0-8, v 0-3: 0 Nunca, 1 Varios días, 2 Más de la mitad de los días, 3 Casi todos los días): ${S.PHQ.map((q, i) => i + ': ' + q).join('; ')}.
Capacidad digital (sec "dig"): 0 Teléfono (0 Ninguno,1 Compartido,2 Smartphone propio); 1 Conexión (0 Sin señal,1 Datos limitados,2 Estable); 2 Uso diario (0 Solo llamadas,1 WhatsApp y audios,2 Apps y videollamadas); 3 Lectura (0 Prefiere voz,1 Básica,2 Cómoda); 4 ¿Hablaría con una app? (0 No,1 Tal vez,2 Sí); 5 Ayuda en casa con el celular (0 No,1 Sí).
Contexto (sec "ctx"): 0 Daño vivienda (0 Ninguno,1 Parcial,2 Total); 1 Perdió familiar (0 No,1 Sí).
Valores actuales (null = sin respuesta): ${JSON.stringify(cur)}.
Nota del experto: "${text}"
Responde SOLO con JSON: {"reply":"texto breve en español de Colombia, trato de usted, que diga qué borradores propones y sugiera la siguiente pregunta a hacer. Si toca la pregunta 9 da su redacción exacta: «${S.Q9_EXACT}»","drafts":[{"sec":"phq","i":0,"v":0}]}. Solo incluye borradores claramente respaldados por la nota.`;
    let reply = 'No pude leer la nota. Escríbala de nuevo o complete el formulario directamente.', drafts = [];
    try {
      const out = JSON.stringify(window.AlientoAI.interpretNote(text, cur, S.Q9_EXACT)); // motor local siempre: respuestas predecibles en campo
      const j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
      reply = j.reply || reply; drafts = (j.drafts || []).filter(d => ['phq', 'dig', 'ctx'].includes(d.sec)).map(d => [d.sec, +d.i, +d.v]);
    } catch (e) { }
    applyDrafts(drafts);
    setState(s => ({ thinking: false, chat: s.chat.concat([{ who: 'ai', label: 'TEO sugiere · sin confirmar', text: reply }]) }));
  }
  function coursePick(res) { const R = store.REC, it = st.items, p = person() || {}; const auto = R.courseFor({ phq: it.phq.map(x => x.v || 0), age: p.age, ctx: { perdida: (it.ctx[1] || {}).v || 0 } }); const sel = st.courseSel; return sel && sel !== auto.id ? { id: sel, motivo: 'elegido por el experto', auto } : Object.assign({ auto }, auto); }
  function cpVals(A, res) {
    const R = A.REC, cp = coursePick(res), c = R.curso(cp.id), r = res.r;
    const courseSub =
      r >= 3
        ? 'Solo si la psicóloga lo asigna, como apoyo a la terapia'
        : r === 2
          ? 'Con el experto, dentro del grupo de apoyo'
          : r <= 1 && res.d === 0
            ? 'Con el experto, en la revisita'
            : 'Guiado por TEO';
    return {
      cover: R.cover(c.mods[0].cuento),
      title: c.title,
      motivo: cp.motivo,
      sel: cp.id,
      sub: courseSub + ' · ' + R.channel(res.d) + ' · ' + c.weeks + ' semanas',
      opts: R.CURSOS.map((x) => ({ v: x.id, s: x.id === cp.id, l: x.title + (x.id === cp.auto.id ? ' (propuesto)' : '') })),
      set: (e) => setState({ courseSel: e.target.value }),
    };
  }
  function erVals() { const er = st.er; if (!er) return { erOpen: false, er: {} }; const R = store.REC, c = R.cuento(er.slug), n = c.pages || 1, go = d => setState({ er: { slug: er.slug, page: Math.max(1, Math.min(n, er.page + d)) } }); return { erOpen: true, er: { title: c.title, counter: er.page + ' de ' + n, img: c.pages ? R.page(er.slug, er.page) : R.cover(er.slug), alt: c.title + ', página ' + er.page, prev: () => go(-1), next: () => go(1), close: () => setState({ er: null }) } }; }
  function calcResult() {
    const it = st.items;
    const phqT = it.phq.reduce((a, x) => a + (x.v || 0), 0);
    const digT = it.dig.reduce((a, x) => a + (x.v || 0), 0);
    // v2: sin teléfono ⇒ capacidad digital Baja, sin importar el puntaje.
    const sinTel = it.dig[0].v === 0;
    const r = store.riskIdx(phqT), d = sinTel ? 0 : store.digIdx(digT);
    const dNoHelp = sinTel ? 0 : store.digIdx(digT - (it.dig[5].v || 0));
    return { phqT, digT, r, d, dNoHelp, sinTel, code: store.code(r, d) };
  }
  function saveVisit() {
    const res = calcResult();
    const p = person();
    const crisis = st.crisis;
    const cons = st.consent;
    const terr = terrName;
    const expName = expertName;
    const S0 = store.get();
    const people0 = store.people ? store.people(S0) : S0.people || [];
    // Ficha canónica en people (el worklist a veces trae otro id).
    const canonical =
      people0.find(
        (x: { id?: string; code?: string; name?: string }) =>
          (p.id && x.id === p.id) ||
          (p.code && x.code === p.code) ||
          (st.pid && (x.id === st.pid || x.code === st.pid)) ||
          (p.name && x.name === p.name),
      ) || null;
    const personId = String(canonical?.id || p.id || st.pid || '');
    // Código nuevo: el mayor número existente del prefijo + 1 (antes era un conteo y se repetía).
    const prefijo = (store.TCODE && store.TCODE[terr]) || terr.slice(0, 3).toUpperCase();
    const maxCodigo = people0.reduce((m: number, x: { code?: string }) => {
      const mm = String(x.code || '').match(new RegExp('^' + prefijo + '-(\\d+)$'));
      return mm ? Math.max(m, Number(mm[1])) : m;
    }, 1000);
    const personCode = String(canonical?.code || p.code || prefijo + '-' + String(maxCodigo + 1));
    const personName = String(canonical?.name || p.name || '');
    const personAge = canonical?.age ?? p.age;
    const personPlace = String(canonical?.place || p.place || '');
    const personRural = canonical?.rural !== undefined ? canonical.rural !== false : p.rural !== false;
    const personPhone = String(canonical?.phone || p.phone || '');
    const personClin = String(canonical?.clin || clinForTerr(terr));
    const prevProfile = canonical?.profile || p.profile || null;
    const profileCode = crisis ? null : res.code;
    const prog0 =
      store.courseProgress &&
      (store.courseProgress(S0, String(canonical?.id || p.id || '')) ||
        store.courseProgress(S0, String(canonical?.code || p.code || '')));
    const closingEval =
      !crisis &&
      needsClosingEval(
        {
          status: canonical?.status || p.status,
          profile: canonical?.profile || p.profile,
          week: canonical?.week ?? p.week,
          weeks: canonical?.weeks ?? p.weeks,
          finalEvalAt: canonical?.finalEvalAt ?? p.finalEvalAt,
        },
        {
          courseDone: prog0 ? Number(prog0.done) || 0 : null,
          courseWeeks: prog0?.c?.weeks != null ? Number(prog0.c.weeks) : null,
        },
      );
    // Evaluación inicial → Por aprobar (sigue en lista del experto). Cierre → validada.
    const wlStatus = crisis ? 'crisis' : closingEval ? 'validada' : 'por_aprobar';
    // Evaluación inicial → Por aprobar. Evaluación de cierre (Terminado blanco) → Terminado negro.
    const nextStatus = crisis ? 'Crisis' : closingEval ? 'Terminado negro' : 'Por aprobar';
    const flagPayload: Record<string, unknown> | null = null;
    shortRef.current = 0;
    const evalAt = Date.now();

    store.set((s) => {
      if (store.ensureExpertBuckets) store.ensureExpertBuckets(s, ex);
      const matchWl = (x: { id?: string; code?: string; name?: string }) =>
        (personId && x.id === personId) ||
        (p.id && x.id === p.id) ||
        (st.pid && x.id === st.pid) ||
        (personCode && x.code === personCode) ||
        (p.code && x.code === p.code) ||
        (personName && x.name === personName);
      expertKeys(s).forEach((k) => {
        (s.worklists[k] || []).forEach(
          (w: {
            status?: string;
            profile?: string | null;
            id?: string;
            code?: string;
            at?: number;
            validatedAt?: number;
            rural?: boolean;
            age?: number;
          }) => {
            if (!matchWl(w)) return;
            w.status = wlStatus;
            w.profile = crisis ? 'Ruta de crisis' : res.code;
            w.validatedAt = evalAt;
            w.at = evalAt;
            if (personId) w.id = personId;
            if (personCode) w.code = personCode;
            if (personAge != null) w.age = Number(personAge);
            w.rural = personRural;
          },
        );
      });
      // Reporte TRL 2026-10-10 (P-01): el consentimiento firmado en la visita siempre queda registrado
      // (antes solo se guardaba si la persona ya tenía uno), con quién lo tomó y cuándo.
      s.consents = s.consents || {};
      s.consents[personId] = {
        ...(s.consents[personId] || {}),
        participar: !!cons.r0,
        datos: !!cons.r1,
        contactoRiesgo: !!cons.r2,
        contacto: !!cons.o0,
        manilla: !!cons.o1,
        remision: !!cons.o2,
        investigacion: !!(s.consents[personId] || {}).investigacion,
        firmado: !!st.signed,
        aRuego: !!st.ruego,
        visitaAt: Date.now(),
        visitaPor: ex,
        visitaPorNombre: expName,
      };
      s.visits[personId] = {
        code: res.code,
        phq: res.phqT,
        dig: res.digT,
        crisis,
        override: 'keep',
        reason: '',
        gps: st.gps || null, // H-008: se guarda con la visita
      };
      s.people = s.people || [];
      const existing = s.people.find(
        (x: { id?: string; code?: string; name?: string }) =>
          x.id === personId ||
          x.code === personCode ||
          (personName && x.name === personName),
      );
      if (existing) {
        Object.assign(existing, {
          id: personId || existing.id,
          code: personCode || existing.code,
          name: personName || existing.name,
          previousProfile: crisis ? existing.previousProfile : prevProfile,
          profile: crisis ? existing.profile : profileCode,
          status: nextStatus,
          expert: expName,
          expertId: ex,
          terr: existing.terr || terr,
          week: existing.week || 0,
          weeks: existing.weeks || (res.r <= 1 ? 13 : res.r === 2 ? 26 : 52),
          pendingEval: !crisis && !closingEval,
          needsReeval: false,
          evalAt: crisis ? existing.evalAt : evalAt,
          evalBy: crisis ? existing.evalBy : expName,
          evalPhq: crisis ? existing.evalPhq : res.phqT,
          evalDig: crisis ? existing.evalDig : res.digT,
          finalEvalAt: closingEval ? evalAt : existing.finalEvalAt || null,
          clin: existing.clin || personClin,
        });
      } else if (!crisis) {
        s.people.push({
          id: personId,
          code: personCode,
          name: personName,
          age: personAge,
          place: personPlace,
          rural: personRural,
          terr,
          profile: profileCode,
          previousProfile: null,
          week: 0,
          weeks: res.r <= 1 ? 13 : res.r === 2 ? 26 : 52,
          expert: expName,
          expertId: ex,
          status: nextStatus,
          clin: personClin,
          phone: personPhone,
          pendingEval: true,
          evalAt,
          evalBy: expName,
          evalPhq: res.phqT,
          evalDig: res.digT,
        });
      }
      if (!crisis) {
        s.patients = s.patients || {};
        const patKey = personId;
        if (!s.patients[patKey]) {
          s.patients[patKey] = store.emptyPatient
            ? store.emptyPatient(patKey, personName, personAge)
            : {
                id: patKey,
                name: personName,
                age: personAge,
                place: personPlace + ', ' + terr,
                profile: profileCode,
                phone: personPhone,
                phq: [res.phqT],
                phqDates: [new Date().toISOString().slice(0, 10)], // H-013: fecha ISO, no «Hoy»
                sleep: null,
                braceletStatus: '',
                adherence: null,
                next: 'Primera llamada dentro de 7 días',
                nextShort: 'Primera llamada',
                consent: true,
                consentKey: patKey,
                signal: nextStatus,
                summary: null,
                audios: 0,
                timeline: [],
                ctx: { dano: 0, perdida: 0 },
                lastCheckin: '',
                checkinDays: null,
              };
        }
        const pat = s.patients[patKey];
        pat.previousProfile = pat.profile || null;
        pat.profile = profileCode;
        pat.phq = (pat.phq || []).concat([res.phqT]);
        pat.phqDates = (pat.phqDates || []).concat([new Date().toISOString().slice(0, 10)]); // H-013
        pat.signal = nextStatus;
        pat.status = nextStatus;
        pat.pendingEval = !closingEval;
        pat.needsReeval = false;
        pat.expert = expName;
        pat.clin = pat.clin || personClin;
        pat.code = personCode;
        pat.evalAt = evalAt;
        pat.evalBy = expName;
        pat.evalPhq = res.phqT;
        pat.evalDig = res.digT;
        if (closingEval) pat.finalEvalAt = evalAt;
        // Servicios de la app: solo al aprobar el clínico (no al terminar la visita).
        if (!crisis && !closingEval) {
          pat.modulesEnabled = [];
          pat.modulesVisible = [];
        }
      }
      if (!crisis && s.recursos) {
        const cpk = coursePick(res);
        s.recursos.people = s.recursos.people || {};
        if (!s.recursos.people[personId]) {
          s.recursos.people[personId] = {
            course: cpk.id,
            week: 1,
            channel: ['impreso', 'whatsapp', 'app'][res.d],
            by: store.cursosMod(res.r, res.d),
            pending: res.r >= 3,
            read: {},
            page: {},
            tech: {},
            tech4w: {},
            doneMods: [],
            answers: [],
          };
        }
      }
      if (!crisis && !closingEval) {
        s.alerts = s.alerts.filter((a: { id?: string }) => a.id !== 'a-new-' + personId);
        store.pushNotif(
          s,
          'clin',
          'Evaluación por aprobar: ' + personName + ' (' + res.code + ')',
          '/clinico/aprobaciones',
        );
        const caseloadRow = {
          id: personId,
          name: personName,
          age: personAge,
          place: personPlace + ', ' + terr,
          profile: profileCode,
          phq: res.phqT,
          expert: expName,
          status: nextStatus,
          pendingEval: true,
        };
        s.caseload = (s.caseload || [])
          .filter((x: { id?: string }) => x.id !== personId)
          .concat([caseloadRow]);
        s.alerts.push({
          id: 'a-new-' + personId,
          sev: 'info',
          pid: personId,
          name: personName,
          age: personAge,
          place: personPlace + ', ' + terr,
          profile: profileCode,
          what:
            'Evaluación y perfil ' +
            res.code +
            ' pendientes de aprobación clínica.',
          source: 'Visita de campo · ' + expName,
          at: evalAt,
          status: 'open',
        });
      } else if (closingEval) {
        s.caseload = (s.caseload || []).map((x: { id?: string; status?: string; pendingEval?: boolean; profile?: string }) =>
          x.id === personId
            ? { ...x, status: nextStatus, pendingEval: false, profile: profileCode || x.profile }
            : x,
        );
      }
    });

    const peopleBody = {
      id: personId,
      code: personCode,
      name: personName,
      age: personAge,
      place: personPlace,
      rural: personRural,
      terr,
      profile: crisis ? null : res.code,
      expert: expName,
      expertId: ex,
      status: nextStatus,
      phone: personPhone,
      weeks: closingEval
        ? Number(canonical?.weeks) || 13
        : res.r <= 1
          ? 13
          : res.r === 2
            ? 26
            : 52,
      clin: personClin,
      pendingEval: !crisis && !closingEval,
      previousProfile: prevProfile,
      evalPhq: res.phqT,
      evalDig: res.digT,
      evalBy: expName,
      evalAt,
      ...(closingEval ? { finalEvalAt: evalAt } : {}),
    };
    pauseLiveHydrate(5_000);
    void Promise.all([
      fetch('/api/people', {
        credentials: 'same-origin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(peopleBody),
      }),
      fetch('/api/worklists', {
        credentials: 'same-origin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: personId,
          expertId: ex,
          time: 'Ahora',
          name: personName,
          age: personAge,
          place: personPlace,
          rural: personRural,
          status: wlStatus,
          profile: crisis ? null : res.code,
          code: personCode,
          phone: personPhone,
          at: evalAt,
          validatedAt: evalAt,
        }),
      }),
      !crisis
        ? fetch('/api/patients', {
            credentials: 'same-origin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: personId,
              code: personCode,
              name: personName,
              age: personAge,
              place: personPlace + ', ' + terr,
              terr,
              profile: res.code,
              phone: personPhone,
              expert: expName,
              clin: personClin,
              signal: nextStatus,
              status: nextStatus,
              pendingEval: !closingEval,
              previousProfile: prevProfile,
              evalPhq: res.phqT,
              evalDig: res.digT,
              evalBy: expName,
              evalAt,
              ...(closingEval ? { finalEvalAt: evalAt } : {}),
              // Vacío hasta aprobación clínica (evita activar la app del paciente antes).
              ...(!crisis && !closingEval
                ? { modulesEnabled: [], modulesVisible: [] }
                : {}),
              timeline: [
                {
                  d: 'Hoy',
                  t: closingEval
                    ? 'Evaluación de cierre · ' + expName
                    : 'Visita de campo · ' + expName,
                  x: closingEval
                    ? 'Evaluación de cierre. PHQ-9 ' +
                      res.phqT +
                      '. Perfil ' +
                      res.code +
                      ' · Terminado negro.'
                    : 'Evaluación inicial. PHQ-9 ' +
                      res.phqT +
                      '. Perfil ' +
                      res.code +
                      ' · pendiente de aprobación clínica.',
                },
              ],
              ctx: {
                dano: (st.items.ctx[0] && st.items.ctx[0].v) || 0,
                perdida: (st.items.ctx[1] && st.items.ctx[1].v) || 0,
              },
            }),
          })
        : Promise.resolve(),
      flagPayload
        ? fetch('/api/flags', {
            credentials: 'same-origin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flagPayload),
          })
        : Promise.resolve(),
    ]).catch(() => {});

    // H-004 (SPEC-002 FR-004): la visita se da por guardada solo cuando el servidor confirma el
    // consentimiento firmado. Antes dependía del guardado automático y se perdía si la app se cerraba.
    const consentimiento = (store.get().consents || {})[personId];
    void (async () => {
      let guardado = !consentimiento;
      for (let intento = 0; !guardado && intento < 3; intento++) {
        if (intento) await new Promise((ok) => setTimeout(ok, 1500 * intento));
        try {
          const r = await fetch('/api/app-state', {
            credentials: 'same-origin',
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slices: { consents: { [personId]: consentimiento } } }),
          });
          const j = (await r.json().catch(() => ({}))) as { descartados?: { apartado: string }[] };
          guardado = r.ok && !(j.descartados || []).some((d) => d.apartado === 'consents');
        } catch {
          /* sin señal: se reintenta */
        }
      }
      if (!guardado) {
        flash('No se pudo guardar el consentimiento en el servidor. Revise la señal y toque «Guardar visita» otra vez.');
        return;
      }
      setState({ screen: 'list', pid: null, newForm: false, editPid: null });
      flash(
        crisis
          ? 'Crisis registrada.'
          : closingEval
            ? 'Evaluación de cierre · perfil ' + res.code + ' · Terminado negro.'
            : 'Evaluación guardada · perfil ' + res.code + ' · por aprobar.',
      );
    })();
  }
  function rv() {
    const A = store;
    if (!A) return {};
    const S = A.get(); const C = A.C;
    if (A.ensureExpertBuckets) A.ensureExpertBuckets(S, ex);
    else {
      S.worklists = S.worklists || {};
      if (!Array.isArray(S.worklists[ex])) S.worklists[ex] = [];
      S.pendingSync = S.pendingSync || {};
      if (S.pendingSync[ex] == null) S.pendingSync[ex] = 0;
      S.revisits = S.revisits || {};
      if (!Array.isArray(S.revisits[ex])) S.revisits[ex] = [];
      S.groupSessions = S.groupSessions || {};
      if (!Array.isArray(S.groupSessions[ex])) S.groupSessions[ex] = [];
    }
    const scr = st.screen;
    const q = A.quotas(S, ex);
    const pct = (a: number, b: number) => {
      if (!b || b <= 0) return a > 0 ? '100%' : '0%';
      return Math.min(100, Math.round((a / b) * 100)) + '%';
    };
    const offline = false;
    const pend = S.pendingSync[ex] || 0;
    const STATUS: Record<string, [string, string, string]> = {
      validada: ['Validada', '#E3F1E8', C.tinta],
      por_aprobar: ['Por aprobar', '#F7E2D2', '#7A3A10'],
      siguiente: ['Siguiente', C.verde, '#fff'],
      curso: ['En curso · falta 1 pregunta', '#E6E1D9', C.azul],
      programada: ['Programada', C.niebla, C.texto2],
      revision: ['En revisión · no cuenta aún', '#F7E2D2', '#7A3A10'],
      rechazada: ['Rechazada · reevaluar', '#EFDCDA', '#9C2F25'],
      ausente: ['No estaba en casa · reprogramar', '#F9EBC8', '#161413'],
      crisis: ['Crisis · alerta enviada', C.rojoBg, '#8A1C14'],
      asignada: ['Nueva asignada · por programar', '#E6E1D9', '#161413'],
      sin_evaluacion: ['Sin evaluación', '#FFF4CC', '#161413'],
      cierre: ['Terminado blanco · evaluación de cierre', '#F7F5F1', '#161413'],
    };
    const expName = expertName;
    const keys = expertKeys(S);
    // Siguen en lista: sin evaluación, por aprobar, rechazada, cierre, crisis.
    // Salen de la lista del experto solo cuando el clínico ya aprobó (Activo) o egreso.
    const LEFT_EXPERT = new Set([
      'activo', 'aprobado', 'en seguimiento', 'alta', 'egreso',
      'terminado negro', 'terminado_negro',
    ]);
    const courseOptsFor = (p: any) => {
      const prog =
        A.courseProgress &&
        (A.courseProgress(S, p?.id) || A.courseProgress(S, p?.code));
      return {
        courseDone: prog ? Number(prog.done) || 0 : null,
        courseWeeks: prog?.c?.weeks != null ? Number(prog.c.weeks) : null,
      };
    };
    const needsReeval = (p: any) =>
      /rechazad/i.test(String(p?.status || '')) ||
      String(p?.status || '').toLowerCase() === 'rechazada' ||
      p?.needsReeval === true;
    const needsCierre = (p: any) => p && needsClosingEval(p, courseOptsFor(p));
    const isPendingApproval = (p: any) =>
      !!p &&
      (p.pendingEval === true ||
        /por\s*aprobar/i.test(String(p.status || '')) ||
        String(p.status || '').toLowerCase() === 'por_aprobar');
    /** Crisis abierta: estado Crisis o alerta de crisis sin cerrar. Solo lectura en la lista. */
    const inOpenCrisis = (p: any, w?: any) => {
      if (w && String(w.status || '').toLowerCase() === 'crisis') return true;
      if (!p) return false;
      if (/^crisis$/i.test(String(p.status || '')) || /^crisis$/i.test(String(p.signal || ''))) {
        return true;
      }
      const pid = String(p.id || p.code || '');
      return (S.alerts || []).some(
        (a: { pid?: string; id?: string; sev?: string; status?: string }) =>
          a.sev === 'crisis' &&
          a.status !== 'closed' &&
          (a.pid === pid ||
            a.pid === p.code ||
            (a.id && pid && String(a.id).includes(pid))),
      );
    };
    /** Ya no debe aparecer en la cola del experto (aprobada / egreso). Crisis abierta sí se muestra. */
    const leftExpertQueue = (p: any) => {
      if (!p || needsReeval(p) || needsCierre(p) || isPendingApproval(p) || inOpenCrisis(p)) {
        return false;
      }
      const st = String(p?.status || '').trim().toLowerCase();
      if (LEFT_EXPERT.has(st)) return true;
      // Perfil formalizado sin pendiente = el clínico ya aceptó.
      return (
        !!(p?.profile && /^P\d+$/i.test(String(p.profile))) &&
        p.pendingEval !== true &&
        !/por\s*aprobar|rechazad|sin\s*evalu|crisis/i.test(st) &&
        (/activo|aprobad/i.test(st) || (!st && !!p.evalAt))
      );
    };
    const peopleList = A.people ? A.people(S) : S.people || [];
    const findPerson = (w: any) =>
      peopleList.find(
        (p: any) =>
          (w.id && (p.id === w.id || p.code === w.id)) ||
          (w.code && (p.code === w.code || p.id === w.code)) ||
          (w.name && p.name === w.name),
      );
    const wlRows: any[] = [];
    const seen = new Set<string>();
    keys.forEach((k) => {
      (S.worklists[k] || []).forEach((w: any) => {
        const pe = findPerson(w);
        // Rechazada / Terminado blanco → vuelven a cola (reeval o cierre).
        if (needsReeval(pe) || needsReeval(w)) {
          w.status = 'rechazada';
          w.profile = null;
        } else if (needsCierre(pe) || needsCierre(w)) {
          w.status = 'cierre';
        } else if (inOpenCrisis(pe, w)) {
          // Solo para ver: no acciones mientras esté en crisis.
          w.status = 'crisis';
          if (pe?.profile) w.profile = pe.profile;
        } else if (leftExpertQueue(pe)) {
          // Ya Activo / egreso (y sin crisis) → fuera de la cola del experto.
          return;
        } else if (isPendingApproval(pe) || w.status === 'validada' || w.status === 'por_aprobar') {
          w.status = 'por_aprobar';
          if (pe?.profile) w.profile = pe.profile;
        } else if (w.status === 'crisis') {
          // Crisis ya cerrada: no mostrar fila residual de worklist.
          return;
        }
        const sid = String(w.id || w.code || w.name);
        if (seen.has(sid)) return;
        seen.add(sid);
        wlRows.push(w);
      });
    });
    // Asignados: sin evaluación, por aprobar, rechazada, cierre o crisis (solo ver).
    const assignedPeople = peopleList.filter((p: any) => {
      const eid = p.expertId != null ? String(p.expertId) : '';
      const en = p.expert != null ? String(p.expert) : '';
      return (eid && keys.has(eid)) || (en && keys.has(en));
    });
    assignedPeople.forEach((p: any) => {
      if (leftExpertQueue(p)) return;
      const sid = String(p.id || p.code || p.name);
      const already = wlRows.some(
        (w) =>
          String(w.id) === String(p.id) ||
          String(w.code) === String(p.code) ||
          String(w.name) === String(p.name),
      );
      if (already) {
        wlRows.forEach((w) => {
          if (
            String(w.id) === String(p.id) ||
            String(w.code) === String(p.code) ||
            String(w.name) === String(p.name)
          ) {
            if (inOpenCrisis(p, w)) {
              w.status = 'crisis';
              if (p.profile) w.profile = p.profile;
            } else if (needsReeval(p)) {
              w.status = 'rechazada';
              w.profile = null;
            } else if (needsCierre(p)) {
              w.status = 'cierre';
            } else if (isPendingApproval(p)) {
              w.status = 'por_aprobar';
              if (p.profile) w.profile = p.profile;
            }
          }
        });
        return;
      }
      wlRows.push({
        id: p.id || p.code,
        time: '—',
        name: p.name,
        age: p.age,
        place: p.place,
        rural: p.rural !== false,
        status: inOpenCrisis(p)
          ? 'crisis'
          : needsReeval(p)
            ? 'rechazada'
            : needsCierre(p)
              ? 'cierre'
              : isPendingApproval(p)
                ? 'por_aprobar'
                : 'sin_evaluacion',
        code: p.code,
        profile:
          inOpenCrisis(p) || needsCierre(p) || isPendingApproval(p)
            ? p.profile || null
            : null,
        phone: p.phone || '',
      });
      seen.add(sid);
    });
    // personOv (reasignaciones locales) aún pendientes de evaluación
    Object.keys(S.personOv || {}).forEach((c) => {
      if (S.personOv[c].expert !== expName) return;
      const p = A.person(S, c);
      if (!p || leftExpertQueue(p)) return;
      if (wlRows.some((w) => w.name === p.name || w.code === p.code)) return;
      wlRows.push({
        id: 'as-' + (p.code || c),
        time: '—',
        name: p.name,
        age: p.age,
        place: p.place,
        rural: p.rural,
        status: isPendingApproval(p) ? 'por_aprobar' : 'sin_evaluacion',
        code: p.code,
        profile: isPendingApproval(p) ? p.profile || null : null,
      });
    });
    const rank = (s: string) =>
      ({
        sin_evaluacion: 0,
        cierre: 1,
        siguiente: 2,
        curso: 3,
        programada: 4,
        asignada: 5,
        ausente: 6,
        crisis: 7,
        rechazada: 8,
        por_aprobar: 9,
        validada: 10,
      }[s] ?? 50);
    wlRows.sort((a, b) => rank(a.status) - rank(b.status) || String(a.name || '').localeCompare(String(b.name || ''), 'es'));
    const worklist = wlRows.map((w) => {
      // Crisis ya cerrada/resuelta: no mostrar «Crisis atendida»; vuelve el estado normal.
      const [tag, tagBg, tagFg] = w.reassignedTo
        ? ['Reasignada a ' + w.reassignedTo, C.niebla, C.texto2]
        : (STATUS[w.status] || ['Pendiente', C.niebla, C.texto2]);
      // Crisis abierta: solo ver (sin botón). Por aprobar / validada: también sin acción.
      const act = w.reassignedTo || w.status === 'crisis'
        ? ''
        : w.status === 'sin_evaluacion' || w.status === 'rechazada' || w.status === 'cierre'
          ? w.status === 'rechazada'
            ? 'Reevaluar'
            : w.status === 'cierre'
              ? 'Evaluación de cierre'
              : 'Evaluar'
          : w.status === 'asignada'
            ? 'Programar'
            : w.status === 'siguiente'
              ? 'Empezar visita'
              : w.status === 'curso'
                ? 'Continuar visita'
                : w.status === 'ausente'
                  ? 'Reprogramar'
                  : w.status === 'programada'
                    ? 'Empezar'
                    : w.status === 'por_aprobar' || w.status === 'validada'
                      ? ''
                      : '';
      const primary =
        w.status === 'siguiente' ||
        w.status === 'curso' ||
        w.status === 'sin_evaluacion' ||
        w.status === 'rechazada' ||
        w.status === 'cierre';
      return Object.assign({}, w, {
        zone: w.rural ? 'Rural' : 'Urbano',
        tag,
        tagBg,
        tagFg,
        hasProfile:
          !!w.profile &&
          w.status !== 'crisis' &&
          w.status !== 'sin_evaluacion' &&
          w.status !== 'rechazada' &&
          w.status !== 'cierre',
        rowBg: primary ? '#FFF9E3' : '#fff',
        rowShadow: primary ? 'inset 4px 0 0 #161413' : 'none',
        hasAction: !!act,
        action: act,
        btnBg: primary ? C.verde : '#fff',
        btnFg: primary ? '#fff' : C.verde,
        onAction: () => {
          if (w.status === 'asignada') {
            return A.set((s: any) => {
              s.worklists[ex] = s.worklists[ex] || [];
              if (!s.worklists[ex].find((x: any) => x.id === w.id || x.name === w.name)) {
                s.worklists[ex].push({
                  id: w.id || 'p' + Date.now(),
                  time: '17:30',
                  name: w.name,
                  age: w.age,
                  place: w.place,
                  rural: w.rural,
                  status: 'programada',
                  code: w.code,
                  profile: w.profile || null,
                });
              } else {
                const x = s.worklists[ex].find((row: any) => row.id === w.id || row.name === w.name);
                if (x) x.status = 'programada';
              }
            });
          }
          if (w.status === 'ausente') {
            A.set((s: any) => {
              const x = (s.worklists[ex] || []).find((row: any) => row.id === w.id);
              if (x) x.status = 'programada';
            });
          }
          // Sin evaluación / rechazada / cierre: confirmar datos y (re)hacer la visita.
          if (w.status === 'sin_evaluacion' || w.status === 'rechazada' || w.status === 'cierre') {
            const fromPeople = (A.people ? A.people(S) : S.people || []).find(
              (p: any) => p.id === w.id || p.code === w.code || p.name === w.name,
            );
            const phone = String(w.phone || fromPeople?.phone || '');
            const fullName = String(w.name || fromPeople?.name || '');
            const { firstName, lastName } = splitFullName(fullName);
            const birthDate = String(fromPeople?.birthDate || '');
            const terr = String(fromPeople?.terr || w.terr || terrName);
            return setState({
              newForm: true,
              editPid: String(w.id || w.code || ''),
              nf: emptyPersonForm({
                id: String(w.id || fromPeople?.id || ''),
                code: String(w.code || fromPeople?.code || ''),
                firstName: String(fromPeople?.firstName || firstName),
                lastName: String(fromPeople?.lastName || lastName),
                birthDate,
                age: birthDate
                  ? String(ageFromBirth(birthDate))
                  : w.age != null && w.age !== ''
                    ? String(w.age)
                    : '',
                phone,
                email: String(fromPeople?.email || ''),
                place: String(w.place || fromPeople?.place || ''),
                terr,
                genero: String(fromPeople?.genero || ''),
                estadoCivil: String(fromPeople?.estadoCivil || ''),
                estrato: String(fromPeople?.estrato || ''),
                expert: String(fromPeople?.expert || expertName),
                clin: String(fromPeople?.clin || clinForTerr(terr)),
              }),
              dupOk: false,
              newMsg: '',
            });
          }
          // Asegura fila en worklist del experto antes de abrir consentimiento / evaluación.
          A.set((s: any) => {
            s.worklists[ex] = s.worklists[ex] || [];
            if (!s.worklists[ex].find((row: any) => row.id === w.id || row.name === w.name)) {
              s.worklists[ex].push({
                id: w.id,
                time: w.time || 'Ahora',
                name: w.name,
                age: w.age,
                place: w.place,
                rural: w.rural,
                status: w.status,
                code: w.code,
                profile: w.profile || null,
                phone: w.phone || '',
              });
            }
          });
          startVisit(w);
        },
      });
    });
    const notices = (S.notices[ex] || []).map((n, i) => Object.assign({}, n, {
      tagBg: n.kind === 'crisis' ? C.rojoBg : '#F7E2D2', tagFg: n.kind === 'crisis' ? '#8A1C14' : '#7A3A10',
      dismiss: () => A.set(s => { s.notices[ex].splice(i, 1); })
    }));
    const p = person();
    const inVisit = ['consent', 'eval', 'result'].includes(scr);
    const stepIdx = { consent: 0, eval: 1, result: 2 }[scr] || 0;
    const steps = ['Consentimiento', 'Evaluación', 'Resultado'].map((label, i) => ({ n: i < stepIdx ? '✓' : i + 1, label, arrow: i < 2, bg: i < stepIdx ? C.verde : i === stepIdx ? '#fff' : '#fff', fg: i < stepIdx ? '#fff' : i === stepIdx ? C.verde : C.texto2, bd: i <= stepIdx ? C.verde : C.lineas, fw: i === stepIdx ? 500 : 400 }));

    const CONS = [
      ['r0', 'Participar en la evaluación y en el seguimiento', true],
      ['r1', 'Tratamiento de sus datos personales y de salud según la Ley 1581 de 2012. Sus datos de identidad se guardan aparte.', true],
      ['r2', 'El equipo clínico le contactará si su vida está en riesgo', true],
      ['o0', 'Contacto por teléfono o WhatsApp', false],
      ['o1', 'Usar una manilla de monitoreo si su ruta la incluye', false],
      ['o2', 'Compartir su caso con la institución a la que le remitan', false]
    ];
    const consentItems = CONS.map(([k, text, req]) => {
      const on = !!st.consent[k];
      return { text, kind: req ? 'Obligatorio' : 'Opcional', kindFg: req ? C.tinta : C.texto2, mark: on ? '✓' : '', bd: on ? C.verde : C.lineas, bg: on ? '#FFF9E3' : '#fff', boxBd: on ? C.verde : C.texto2, boxBg: on ? C.verde : '#fff', toggle: () => setState(s => ({ consent: Object.assign({}, s.consent, { [k]: !s.consent[k] }) })) };
    });
    const reqOk = st.consent.r0 && st.consent.r1 && st.consent.r2;
    const sigOk = st.signed && (!st.ruego || st.witness.trim());
    const territory = terrName + (terrName === 'Armenia' ? ' · Barrios seleccionados' : ' · Veredas seleccionadas');
    const evidence = [
      // H-008: posición real o «sin ubicación»; los territorios no tienen límites cargados, así que no se afirma que esté dentro.
      { k: 'GPS al inicio', v: st.gps?.lat != null ? Math.abs(st.gps.lat).toFixed(4).replace('.', ',') + '° ' + (st.gps.lat >= 0 ? 'N' : 'S') + ' · ' + Math.abs(Number(st.gps.lng)).toFixed(4).replace('.', ',') + '° ' + (Number(st.gps.lng) >= 0 ? 'E' : 'O') + ' (±' + st.gps.precision + ' m)' : st.gps?.error ? 'Sin ubicación: ' + st.gps.error : 'Obteniendo ubicación…' },
      { k: 'Territorio', v: st.gps?.lat != null ? 'Sin comparar: el territorio no tiene límites cargados' : '—' },
      { k: 'Hora de inicio', v: st.startTime || '—' }
    ];

    const it = st.items;
    const all = [].concat(it.phq, it.dig);
    const okN = all.filter(x => x.st === 'ok').length, drN = all.filter(x => x.st === 'draft').length;
    const allOk = okN === 15;
    const secDef = { phq: { qs: A.PHQ.map(t => ({ q: t, o: A.PHQ_OPTS })), label: 'Cuestionario PHQ-9' }, dig: { qs: A.DIGQ, label: 'Capacidad digital' }, ctx: { qs: A.CTX, label: 'Contexto del sismo' } };
    const tag = s => s === 'ok' ? ['Confirmado', OK_BG, C.verde, '#FDCD22'] : s === 'draft' ? ['Por confirmar', C.ambarBg, C.ambarTx, C.ambar] : ['Sin respuesta', C.niebla, C.texto2, C.lineas];
    const secDraftN = it[st.sec].filter((x) => x.st === 'draft').length;
    const rows = secDef[st.sec].qs.map((qq, i) => {
      const cell = it[st.sec][i]; const [t, tb, tf, tbd] = tag(cell.st);
      return {
        n: i + 1, q: qq.q, tag: t, tagBg: tb, tagFg: tf, tagBd: tbd, isDraft: cell.st === 'draft', sensitive: st.sec === 'phq' && i === 8,
        bd: st.sec === 'phq' && i === 8 ? C.azul : cell.st === 'draft' ? C.ambar : C.lineas,
        confirm: () => setItem(st.sec, i, cell.v, 'ok'),
        opts: qq.o.map((label, v) => {
          const sel = cell.v === v;
          // Al elegir queda «por confirmar»; «Confirmar las revisadas» las pasa a Confirmado.
          return { label: st.sec === 'phq' ? v + ' · ' + label : label, pick: () => setItem(st.sec, i, v, 'draft'), bg: sel ? (cell.st === 'ok' ? C.verde : C.ambarBg) : '#fff', fg: sel ? (cell.st === 'ok' ? '#fff' : C.ambarTx) : C.tinta, bd: sel ? (cell.st === 'ok' ? C.verde : C.ambar) : C.lineas };
        })
      };
    });
    const secTabs = ['phq', 'dig', 'ctx'].map(k => ({ label: secDef[k].label, count: it[k].filter(x => x.st === 'ok').length + '/' + it[k].length, bd: st.sec === k ? C.amarillo : 'transparent', fg: st.sec === k ? C.verde : C.tinta, go: () => setState({ sec: k }) }));

    const res = calcResult();
    const crisis = st.crisis;
    const alertObj = S.alerts.find(a => a.id === 'a-' + st.pid) || S.closedToday.find(a => a.id === 'a-' + st.pid);
    let alertStatusText = 'Enviando…';
    if (alertObj) alertStatusText = alertObj.status === 'new' ? 'Enviada · esperando que la Dra. Lucía Marín tome el caso (' + A.agoText(alertObj.at) + ')' : alertObj.status === 'mine' || alertObj.status === 'retry' ? 'La Dra. Lucía Marín tomó el caso y está llamando' + (alertObj.status === 'retry' ? ' · no contestó, reintenta en 10 min' : '') : alertObj.status === 'closed' ? 'Atendida · ' + alertObj.outcome : 'En atención';
    const riskScale = A.RISK.map((r, i) => ({ k: r.k, c: r.c, op: i === res.r ? 1 : 0.28, ol: i === res.r ? '2px solid #161413' : 'none', fg: i === res.r ? C.tinta : C.texto2, fw: i === res.r ? 500 : 400 }));
    const digScale = A.DIG.map((r, i) => ({ k: r.k, c: r.c, op: i === res.d ? 1 : 0.35, ol: i === res.d ? '2px solid #161413' : 'none', fg: i === res.d ? C.tinta : C.texto2, fw: i === res.d ? 500 : 400 }));
    const matrix = A.RISK.map((r, ri) => ({ k: r.k, c: r.c, cells: [0, 1, 2].map(di => {
      const hit = ri === res.r && di === res.d; const code = A.code(ri, di);
      if (hit && crisis) return { label: 'Suspendido', bg: '#fff', fg: C.tinta, bd: C.tinta, bs: 'dashed', fw: 500 };
      return { label: code, bg: hit ? C.verde : r.bg, fg: hit ? '#fff' : C.texto2, bd: hit ? C.verde : 'transparent', bs: 'solid', fw: hit ? 600 : 400 };
    }) }));
    const rr = res.r;
    const vctx = { dano: (st.items && st.items.ctx && st.items.ctx[0] && st.items.ctx[0].v) || 0, perdida: (st.items && st.items.ctx && st.items.ctx[1] && st.items.ctx[1].v) || 0 };
    let path = A.pathList(rr, res.d, null, vctx).map(x => {
        if (x.id !== 'bracelet') return { name: x.name, freq: x.freq, main: x.main, sub: x.channel };
        const tInfo = A.terrInfo(S, terrName) || { brAv: 0 };
        const avail = tInfo.brAv || 0;
        return { name: x.name, freq: x.freq, main: x.main, sub: x.channel + (avail ? ' · ' + avail + ' disponibles en ' + terrName : ' · sin stock registrado') };
      });
    const months = A.defaultPath(rr, res.d).months;
    if (crisis) path = [
      { name: 'Valoración clínica prioritaria', sub: 'Dra. Lucía Marín · clínica de turno', freq: 'En menos de 24 h', main: true },
      { name: 'Ruta según perfil', sub: 'Se asigna después de la valoración clínica', freq: 'En pausa', main: false }
    ];
    const dur = Math.max(1, Math.round((Date.now() - (visitStartRef.current || Date.now())) / 60000));
    const evidenceEnd = evidence.concat([{ k: 'Duración', v: dur + ' min' }, { k: 'Consentimiento', v: st.ruego ? 'Firma a ruego' : 'Firmado' }]);
    const nf = st.nf;
    const dup = String(nf.phone || '').replace(/\D/g, '') === '3124550178';
    const setNf = (k: string) => (e: { target: { value: string } }) => {
      const value = e.target.value;
      setStateRaw((prev) => {
        const next = Object.assign({}, prev.nf, { [k]: value }) as Record<string, string>;
        if (k === 'birthDate') {
          next.age = value ? String(ageFromBirth(value)) : '';
        }
        nfRef.current = next;
        return {
          ...prev,
          nf: next,
          dupOk: k === 'phone' ? false : prev.dupOk,
          newMsg: '',
        };
      });
    };
    const codes = { list: 'ExpertWorklist', new: 'NewPersonForm', consent: 'VisitConsent', eval: 'AssessmentForm', result: crisis ? 'AssessmentResult · crisis' : 'AssessmentResult' };

    return {
      ex, dev: A.devMode(), agentRole: 'expert:' + ex, agentOpen: !!st.agentOpen, drawerW: window.innerWidth < 720 ? '100%' : '460px', briefLine: window.AlientoAgent ? AlientoAgent.briefing(ex, S).text : '', briefSub: (offline ? 'Con los datos de la última sincronización · hoy 7:05' : 'Datos al momento') + ((S.revisits[ex] || []).length ? ' · ' + S.revisits[ex].length + ' revisitas pendientes' : ''), openAgent: () => setState({ agentOpen: true }), closeAgent: () => setState({ agentOpen: false, pendingAsk: '' }), pendingAsk: '', agentCtx: offline ? 'Sin señal · datos de la última sincronización (7:05)' : 'Datos al momento', screenCode: st.newForm ? codes.new : codes[scr], expertName, territory,
      connText: offline ? 'Sin señal · ' + pend + ' visitas por sincronizar' : 'Sincronizado', connBg: offline ? '#F9EBC8' : '#FFF4CC', connDot: offline ? '#E0A526' : '#4E9A6B',
      scrollRef: scrollRef, chatRef: chatRef, sigRef: sigInit,
      goList: () => setState({ screen: 'list', newForm: false, editPid: null }),
      goNew: () => {
        const id = 'n' + Date.now();
        const pre = (A.TCODE && A.TCODE[terrName]) || terrName.slice(0, 3).toUpperCase();
        const code = pre + '-' + String(1000 + ((A.people(A.get()).length) + 1));
        setState({
          newForm: true,
          editPid: null,
          nf: emptyPersonForm({
            id,
            code,
            terr: terrName,
            expert: expertName,
            clin: clinForTerr(terrName),
          }),
          dupOk: false,
          newMsg: '',
        });
      },
      closeNewForm: () => setState({ newForm: false, editPid: null, newMsg: '' }),
      isList: scr === 'list', isNew: !!st.newForm, isEditPerson: !!st.editPid,
      formTitle: st.editPid ? 'Datos de la persona' : 'Nueva persona',
      formDesc: st.editPid
        ? 'Confirme o complete los datos antes de empezar la visita.'
        : 'Complete la ficha. Territorio, experto, clínico y códigos se asignan solos.',
      formSaveLabel: st.editPid ? 'Empezar visita' : 'Agregar y empezar visita',
      formSize: 'lg',
      isConsent: scr === 'consent', isEval: scr === 'eval', isResult: scr === 'result', inVisit,
      crisisLines: A.crisisLines(ex === 'mj' ? 'Armenia' : 'Salento').map(l => ({ tel: l.tel, label: l.label, sub: l.sub, bg: l.main ? '#B42318' : '#fff', fg: l.main ? '#fff' : '#8A1C14' })),
      notices, worklist, hasGroups: ((S.groupSessions || {})[ex] || []).length > 0,
      groups: ((S.groupSessions || {})[ex] || []).map(g => { const n = Object.values(g.att).filter(v => v === true).length; const GS = { pm1: ['la-bruja-estresona', 'musculos'], gr1: ['el-ladron-de-suenos', 'resp-dormir'], pm2: ['la-bruja-estresona', '54321'], gr2: ['la-carta-del-abuelo', 'bueno-dia'] }[g.id] || ['la-bruja-estresona', 'resp-46'], R = A.REC, gc = R.cuento(GS[0]), gt = R.tecnica(GS[1]), gv = (st.gTab || {})[g.id] === 'guide'; return { isGuide: gv, isAtt: !gv, attBd: gv ? 'transparent' : '#FDCD22', guideBd: gv ? '#FDCD22' : 'transparent', tabAtt: () => setState({ gTab: Object.assign({}, st.gTab, { [g.id]: 'att' }) }), tabGuide: () => setState({ gTab: Object.assign({}, st.gTab, { [g.id]: 'guide' }) }), cover: R.cover(gc.slug), cuento: gc.title, read: () => setState({ er: { slug: gc.slug, page: 1 } }), qs: gc.preguntas.map((t, i) => ({ n: i + 1, t })), tech: gt.title + ' · ' + gt.min + ' min', time: g.time, kind: g.kind === 'pmplus' ? 'Sesión PM+' : 'Grupo de apoyo', title: g.title, place: g.place, attText: g.closed ? n + ' de ' + g.who.length + ' asistieron' : n + ' de ' + g.who.length + ' marcadas · toque cada nombre', canClose: !g.closed, closed: !!g.closed, close: () => A.set(s => { const x = s.groupSessions[ex].find(y => y.id === g.id); x.closed = true; A.pushNotif(s, 'admin', (g.kind === 'pmplus' ? 'Sesión PM+' : 'Grupo de apoyo') + ' registrado por ' + (ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo') + ': ' + n + ' de ' + g.who.length + ' asistieron', '/admin/experto?e=' + encodeURIComponent(ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo')); }), who: g.who.map(([name]) => { const v = g.att[name]; return { name, mark: v === true ? '✓' : v === false ? '✕' : '·', bd: v === true ? C.verde : v === false ? C.texto2 : C.lineas, bg: v === true ? '#FFF4CC' : '#fff', fg: v === false ? C.texto2 : C.tinta, toggle: () => { if (g.closed) return; A.set(s => { const x = s.groupSessions[ex].find(y => y.id === g.id); x.att[name] = v === true ? false : v === false ? undefined : true; }); } }; }) }; }),
      quotaDateLabel: (() => {
        const d = new Date();
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
        ];
        return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
      })(),
      quotaCards: [
        { label: 'Visitas de hoy', val: q.today, target: q.todayT, pct: pct(q.today, q.todayT) },
        { label: 'Semana', val: q.week, target: q.weekT, pct: pct(q.week, q.weekT) },
        { label: 'Cuota rural hoy', val: q.rural, target: q.ruralT, pct: pct(q.rural, q.ruralT) },
        { label: 'Cuota 60+ hoy', val: q.sixty, target: q.sixtyT, pct: pct(q.sixty, q.sixtyT) }
      ],
      newSections: (() => {
        const field = (
          label: string,
          key: string,
          opts?: { kind?: string; ph?: string; options?: string[]; readOnly?: boolean; span?: 1 | 2 },
        ) => ({
          label,
          key,
          value: String((nf as Record<string, string>)[key] ?? ''),
          onChange: setNf(key),
          kind: opts?.kind || (opts?.options ? 'select' : opts?.readOnly ? 'readonly' : 'text'),
          ph: opts?.ph || '',
          options: opts?.options,
          readOnly: !!opts?.readOnly,
          span: opts?.span || 1,
        });
        return [
          {
            title: 'Identidad',
            fields: [
              field('Nombre', 'firstName', { ph: 'Nombre' }),
              field('Apellido', 'lastName', { ph: 'Apellidos' }),
              field('Fecha de nacimiento', 'birthDate', { kind: 'date' }),
              field('Edad', 'age', { readOnly: true, ph: 'Se calcula sola' }),
              field('Género', 'genero', { options: GENERO_OPTS }),
              field('Estado civil', 'estadoCivil', { options: CIVIL_OPTS }),
            ],
          },
          {
            title: 'Contacto',
            fields: [
              field('Teléfono', 'phone', { kind: 'phone', ph: '3xx xxx xxxx' }),
              field('Correo', 'email', { ph: 'correo@ejemplo.com', kind: 'email' }),
            ],
          },
          {
            title: 'Ubicación',
            fields: [
              field('Vereda o barrio', 'place', { ph: 'Ej.: Vereda Cocora' }),
              field('Estrato', 'estrato', { options: ESTRATO_OPTS }),
            ],
          },
        ];
      })(),
      dupShow: dup && !st.dupOk, dupConfirm: () => setState({ dupOk: true, newMsg: 'Marcado como otra persona. Queda registro de la verificación.' }), newMsg: st.newMsg, clearNewMsg: () => setState({ newMsg: '' }),
      newSave: () => {
        const draft = { ...(nfRef.current || st.nf) } as Record<string, string>;
        const editPid = editPidRef.current || st.editPid;
        // Completar desde ficha en store si el form llegó incompleto (cierre obsoleto / import).
        if (editPid) {
          const fromPeople = (A.people ? A.people(A.get()) : A.get().people || []).find(
            (p: any) =>
              p.id === editPid ||
              p.code === editPid ||
              String(p.id) === String(draft.id) ||
              String(p.code) === String(draft.code),
          );
          if (fromPeople) {
            const split = splitFullName(String(fromPeople.name || ''));
            if (!String(draft.firstName || '').trim()) {
              draft.firstName = String(fromPeople.firstName || split.firstName || '');
            }
            if (!String(draft.lastName || '').trim()) {
              draft.lastName = String(fromPeople.lastName || split.lastName || '');
            }
            if (!String(draft.birthDate || '').trim()) {
              draft.birthDate = String(fromPeople.birthDate || '');
            }
            if (!String(draft.place || '').trim()) {
              draft.place = String(fromPeople.place || '');
            }
            if (!String(draft.phone || '').trim()) {
              draft.phone = String(fromPeople.phone || '');
            }
            if (!String(draft.email || '').trim()) {
              draft.email = String(fromPeople.email || '');
            }
          }
        }
        // Si solo hay nombre completo en un campo, partirlo.
        if (!String(draft.lastName || '').trim() && String(draft.firstName || '').includes(' ')) {
          const split = splitFullName(draft.firstName);
          draft.firstName = split.firstName;
          draft.lastName = split.lastName;
        }
        if (
          (!String(draft.firstName || '').trim() || !String(draft.lastName || '').trim()) &&
          String(draft.name || '').trim()
        ) {
          const split = splitFullName(String(draft.name));
          if (!String(draft.firstName || '').trim()) draft.firstName = split.firstName;
          if (!String(draft.lastName || '').trim()) draft.lastName = split.lastName;
        }

        const firstName = String(draft.firstName || '').trim();
        const lastName = String(draft.lastName || '').trim();
        const birthDate = String(draft.birthDate || '').trim();
        const place = String(draft.place || '').trim();
        const name = [firstName, lastName].filter(Boolean).join(' ');
        const missing: string[] = [];
        if (!firstName) missing.push('nombre');
        if (!lastName) missing.push('apellido');
        if (!birthDate) missing.push('fecha de nacimiento');
        if (!place) missing.push('vereda o barrio');
        if (missing.length) {
          return setState({
            newMsg:
              missing.length === 1
                ? 'Falta el dato: ' + missing[0] + '.'
                : 'Faltan datos: ' + missing.join(', ') + '.',
          });
        }
        // H-007 (SPEC-005): mismas reglas que la API (libs/common/src/validar-persona.ts).
        const nac = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
        const nacDate = nac ? new Date(Date.UTC(+nac[1], +nac[2] - 1, +nac[3])) : null;
        if (!nacDate || Number.isNaN(nacDate.getTime())) return setState({ newMsg: 'La fecha de nacimiento no es válida.' });
        if (nacDate.getTime() > Date.now()) return setState({ newMsg: 'La fecha de nacimiento no puede ser futura.' });
        const edadAlta = ageFromBirth(birthDate);
        if (!(edadAlta >= 18 && edadAlta <= 110)) return setState({ newMsg: 'La edad debe estar entre 18 y 110 años.' });
        const telAlta = String(draft.phone || '').replace(/[\s-]/g, '');
        if (telAlta && !/^3\d{9}$/.test(telAlta)) {
          return setState({ newMsg: 'El teléfono debe tener 10 dígitos y empezar por 3.' });
        }
        const phoneDigits = String(draft.phone || '').replace(/\D/g, '');
        if (phoneDigits === '3124550178' && !st.dupOk) {
          return setState({ newMsg: 'Confirme si es otra persona antes de seguir.' });
        }
        const terr = terrName;
        const age = ageFromBirth(birthDate) || Number(draft.age) || 0;
        const phone = String(draft.phone || '').trim();
        const email = String(draft.email || '').trim().toLowerCase();
        const rural = /vereda/i.test(place);
        const genero = String(draft.genero || '').trim();
        const estadoCivil = String(draft.estadoCivil || '').trim();
        const estrato = String(draft.estrato || '').trim();
        const clin = clinForTerr(terr);
        const expName = expertName;
        const personPayload = {
          name, firstName, lastName, age, birthDate, place, rural, phone, email, terr,
          expert: expName, expertId: ex, clin,
          genero, estadoCivil, estrato,
        };
        nfRef.current = { ...draft, firstName, lastName, birthDate, place, age: String(age) };

        // Evaluar persona ya asignada: actualizar datos y abrir visita.
        if (editPid) {
          const pid = editPid;
          let visitRow: any = null;
          A.set((s: any) => {
            s.worklists[ex] = s.worklists[ex] || [];
            let w = s.worklists[ex].find((x: any) => x.id === pid || x.code === pid || x.name === name);
            if (!w) {
              const fromP = (s.people || []).find((p: any) => p.id === pid || p.code === pid);
              w = {
                id: pid,
                time: 'Ahora',
                name,
                age,
                place,
                rural,
                status: 'programada',
                code: fromP?.code || draft.code || pid,
                profile: null,
                phone,
              };
              s.worklists[ex].push(w);
            } else {
              Object.assign(w, { name, age, place, rural, phone, status: 'programada', profile: null });
            }
            const pe = (s.people || []).find((p: any) => p.id === pid || p.code === pid || p.name === name);
            if (pe) Object.assign(pe, { ...personPayload, expertId: ex });
            visitRow = { ...w };
          });
          void fetch('/api/people', {
            credentials: 'same-origin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pid, code: draft.code || undefined, ...personPayload }),
          }).catch(() => {});
          startVisit(visitRow || { id: pid, name, age, place, rural, phone, status: 'programada' });
          return;
        }

        const id = draft.id || ('n' + Date.now());
        const pre = (A.TCODE && A.TCODE[terr]) || terr.slice(0, 3).toUpperCase();
        const code = draft.code || (pre + '-' + String(1000 + ((A.people(A.get()).length) + 1)));
        const w = { id, time: 'Ahora', name, age, place, rural, status: 'sin_evaluacion', code, terr, profile: null, phone };
        A.set((s: any) => {
          s.worklists[ex] = s.worklists[ex] || [];
          s.worklists[ex].push({ ...w, status: 'programada' });
          s.people = s.people || [];
          if (!s.people.find((x: any) => x.id === id)) {
            s.people.push({
              id, code, ...personPayload,
              profile: null, week: 0, weeks: 13,
              expertId: ex,
              status: 'Sin evaluación',
            });
          }
        });
        void fetch('/api/people', {
          credentials: 'same-origin',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id, code, ...personPayload,
            status: 'Sin evaluación', profile: null,
          }),
        }).catch(() => {});
        void fetch('/api/worklists', {
          credentials: 'same-origin',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id, expertId: ex, time: 'Ahora', name, age, place, rural,
            status: 'programada', code, phone,
          }),
        }).catch(() => {});
        startVisit({ ...w, status: 'programada' });
      },
      personName: p.name, personMeta: p.age + ' años · ' + p.place + ' · ' + (p.rural ? 'Rural' : 'Urbano'), steps,
      consentItems, sigTitle: st.ruego ? 'Firma del testigo' : 'Firma de la persona', sigHint: st.signed ? 'Firma registrada.' : 'Firme con el dedo dentro del recuadro.',
      sigClear: () => { if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, 440, 150); setState({ signed: false }); },
      ruego: st.ruego, ruegoMark: st.ruego ? '✓' : '', ruegoBd: st.ruego ? C.verde : C.texto2, ruegoBg: st.ruego ? C.verde : '#fff', toggleRuego: () => setState(s => ({ ruego: !s.ruego })),
      witness: st.witness, setWitness: e => setState({ witness: e.target.value }), evidence,
      consentBtnBg: reqOk && sigOk ? C.verde : '#8C857C',
      consentMsg: st.consentMsg, clearConsentMsg: () => setState({ consentMsg: '' }),
      consentNext: () => { if (!reqOk) return setState({ consentMsg: 'Faltan puntos obligatorios. La persona debe aceptar los tres para continuar.' }); if (!sigOk) return setState({ consentMsg: st.ruego ? 'Falta la firma y el nombre del testigo.' : 'Falta la firma.' }); setState({ screen: 'eval', consentMsg: '' }); },
      crisis, notCrisis: !crisis, crisisStay: 'Quédese con ' + honor(p) + '. No lo deje solo.', alertStatusText, goResult: () => go('result'),
      isChat: false,
      modeForm: () => setState({ mode: 'form' }),
      progressOk: okN + ' de 15 preguntas confirmadas', progressDraft: drN ? ' · ' + drN + ' en borrador' : '',
      calcBg: allOk || crisis ? C.verde : '#DCD6CD', calcFg: allOk || crisis ? '#fff' : '#7A736B',
      calc: () => {
        if (crisis) return go('result');
        if (!allOk) return flash('Faltan ' + (15 - okN) + ' preguntas por confirmar para calcular el resultado.');
        // v2: «Uso diario» no puede ser mayor que «Teléfono».
        if ((it.dig[2].v || 0) > (it.dig[0].v || 0)) {
          return flash('«Uso diario» no puede ser mayor que «Teléfono». Revise la sección Capacidad digital.');
        }
        go('result');
      },
      chat: st.chat.map(m => ({ isAi: m.who === 'ai', isExp: m.who === 'exp', text: m.text, label: m.label })),
      thinking: st.thinking, chatInput: st.chatInput, setChatInput: e => setState({ chatInput: e.target.value }), sendChat: () => sendChat(),
      hasExample: st.step < SCRIPT.length && st.pid === 'rosalba', exampleN: st.step + 1, useExample: () => SCRIPT[st.step] && setState({ chatInput: SCRIPT[st.step].note }),
      secTabs, rows, q9: A.Q9_EXACT,
      secNote: st.sec === 'ctx'
        ? 'Se registra, no suma puntos. Elija y luego confirme.'
        : secDraftN
          ? secDraftN + (secDraftN === 1 ? ' respuesta por confirmar en esta sección.' : ' respuestas por confirmar en esta sección.')
          : 'Toque una opción (queda por confirmar) y luego «Confirmar las revisadas».',
      secDraftN,
      confirmBtnBg: secDraftN ? C.amarillo : '#fff',
      confirmBtnFg: C.tinta,
      confirmBtnBd: secDraftN ? C.amarillo : C.lineas,
      confirmSection: () => {
        const items = JSON.parse(JSON.stringify(st.items));
        let n = 0;
        items[st.sec].forEach((x) => {
          if (x.st === 'draft' && x.v != null) {
            x.st = 'ok';
            n += 1;
          }
        });
        if (!n) {
          flash('Primero elija respuestas en esta sección. Quedarán «Por confirmar» y aquí las confirma.');
          return;
        }
        setState({ items });
        const secLabel = secDef[st.sec].label;
        flash(n + (n === 1 ? ' respuesta confirmada' : ' respuestas confirmadas') + ' en ' + secLabel + '.');
      },
      riskName: A.RISK[res.r].k, phqTotal: res.phqT, riskScale, digName: A.DIG[res.d].k, digTotal: res.digT, digScale,
      digNote: res.sinTel
        ? 'Sin teléfono: la capacidad digital queda en Baja.'
        : res.dNoHelp < res.d
          ? 'El apoyo de un familiar sube el nivel de ' + A.DIG[res.dNoHelp].k + ' a ' + A.DIG[res.d].k + '.'
          : (it.dig[5].v ? 'Tiene apoyo de un familiar con el celular.' : ''),
      matrix, profileLine: crisis ? A.code(res.r, res.d) + ' suspendido · Ruta de crisis' : res.code + ' · ' + A.RISK[res.r].k + ' × digital ' + A.DIG[res.d].k.toLowerCase(),
      evidenceEnd, pathTitle: crisis ? 'Ruta de crisis' : 'Ruta asignada', pathDuration: crisis ? 'Reemplaza la ruta del perfil' : 'Duración total: ' + months + ' meses', path,
      reasonErr: '', clearReasonErr: () => setState({ reasonErr: '' }),
      cp: cpVals(A, res), saveVisit: () => saveVisit(), saveNote: offline ? 'Sin señal: se guarda en la tablet y se sincroniza después.' : 'Se guarda y se sincroniza ahora.',
      toast: !!st.toast, toastText: st.toast
    };
  }
  const v = useMemo(() => {
    if (!session) return null;
    return { ...rv(), ...erVals(), sigRef: sigInit, scrollRef, chatRef };
  }, [session, st, store, ex, sigInit, live]);

  return { v, session, ex };
}
