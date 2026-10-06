/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRequireSession } from "@/hooks/useRequireSession";
import { useNaraStore } from "@/providers/nara-provider";

const blank = (n: number) =>
  Array.from({ length: n }, () => ({ v: null as number | null, st: "none" as const }));
const OK_BG = "#FFF4CC";

export function useExpertoScreen() {
  const store = useNaraStore();
  const session = useRequireSession(["andres", "mj"]);
  const ex = session?.id === "mj" ? "mj" : "andres";

  const [st, setStateRaw] = useState({
    screen: "list",
    pid: null as string | null,
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
    nf: { name: "", age: "", phone: "", place: "" },
    newForm: false,
    dupOk: false,
    newMsg: "",
    consentMsg: "",
    startTime: "",
    agentOpen: false,
    gTab: {} as Record<string, string>,
    courseSel: undefined as string | undefined,
    er: null as { slug: string; page: number } | null,
  });

  const setState = useCallback((u: Record<string, unknown> | ((s: typeof st) => Record<string, unknown>)) => {
    setStateRaw((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visitStartRef = useRef(Date.now());
  const shortRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function go(screen) { setState({ screen }); }
  function flash(t) { setState({ toast: t }); clearTimeout(toastTimerRef.current); toastTimerRef.current = setTimeout(() => setState({ toast: '' }), 4200); }
  function person() {
    const S = store.get();
    return S.worklists[ex].find(w => w.id === st.pid) || { name: '', age: 0, place: '' };
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
      setState({ pid: w.id, screen: 'eval', newForm: false, mode: 'form', sec: 'phq', items: { phq, dig, ctx }, consent: { r0: 1, r1: 1, r2: 1, o0: 1, o1: 1, o2: 1 }, signed: true, crisis: false, chat: [], step: 0, override: 'keep', reason: '', startTime: '10:58' });
      return;
    }
    setState({ pid: w.id, screen: 'consent', newForm: false, consent: {}, signed: false, ruego: false, witness: '', mode: 'form', sec: 'phq', items: { phq: blank(9), dig: blank(6), ctx: blank(2) }, crisis: false, step: 0, override: 'keep', reason: '', reasonErr: '', consentMsg: '', startTime: hh,
      chat: [{ who: 'ai', label: 'TEO sugiere · cómo abrir', text: 'Empiece sin mencionar el cuestionario. Puede decir:\n«¿Cómo ha estado usted y su familia desde el sismo?»' }] });
  }
  function setItem(sec: string, i: number, v: number, stItem: string) {
    const items = JSON.parse(JSON.stringify(st.items));
    items[sec][i] = { v, st: stItem };
    setState({ items });
    if (sec === 'phq' && i === 8 && st === 'ok' && v > 0) triggerCrisis();
  }
  function triggerCrisis() {
    if (st.crisis) return;
    const p = person(); const S = store.get();
    const id = 'a-' + p.id;
    store.addAlert({ id, sev: 'crisis', pid: store.PATIENTS[p.id] ? p.id : null, name: p.name, age: p.age, place: p.place + (ex === 'mj' ? ', Armenia' : ', Salento'), profile: 'Suspendido', what: 'Respondió ' + st.items.phq[8].v + ' en la pregunta 9 del cuestionario durante la visita de campo.', source: 'Visita de campo · ' + (ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo') + ' sigue con él en la casa', phone: (store.PATIENTS[p.id] || {}).phone || '310 000 0000', expert: ex });
    setState({ crisis: true });
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
  function cpVals(A, res) { const R = A.REC, cp = coursePick(res), c = R.curso(cp.id), r = res.r; return { cover: R.cover(c.mods[0].cuento), title: c.title, motivo: cp.motivo, sel: cp.id, sub: (r >= 3 ? 'Solo si la psicóloga lo asigna, como apoyo a la terapia' : r === 2 ? 'Con el experto, dentro de PM+ o del grupo de apoyo' : 'Guiado por TEO') + ' · ' + R.channel(res.d) + ' · ' + c.weeks + ' semanas', opts: R.CURSOS.map(x => ({ v: x.id, s: x.id === cp.id, l: x.title + (x.id === cp.auto.id ? ' (propuesto)' : '') })), set: e => setState({ courseSel: e.target.value }) }; }
  function erVals() { const er = st.er; if (!er) return { erOpen: false, er: {} }; const R = store.REC, c = R.cuento(er.slug), n = c.pages || 1, go = d => setState({ er: { slug: er.slug, page: Math.max(1, Math.min(n, er.page + d)) } }); return { erOpen: true, er: { title: c.title, counter: er.page + ' de ' + n, img: c.pages ? R.page(er.slug, er.page) : R.cover(er.slug), alt: c.title + ', página ' + er.page, prev: () => go(-1), next: () => go(1), close: () => setState({ er: null }) } }; }
  function calcResult() {
    const it = st.items;
    const phqT = it.phq.reduce((a, x) => a + (x.v || 0), 0);
    const digT = it.dig.reduce((a, x) => a + (x.v || 0), 0);
    const r = store.riskIdx(phqT), d = store.digIdx(digT);
    const dNoHelp = store.digIdx(digT - (it.dig[5].v || 0));
    return { phqT, digT, r, d, dNoHelp, code: store.code(r, d) };
  }
  function saveVisit() {
    const res = calcResult();
    if (!st.crisis && st.override !== 'keep' && !st.reason.trim()) { setState({ reasonErr: 'Escriba el motivo del cambio de ruta.' }); return; }
    const p = person(); const crisis = st.crisis; const cons = st.consent;
    store.set(s => {
      const w = s.worklists[ex].find(x => x.id === p.id);
      const mins = Math.max(1, Math.round((Date.now() - (visitStartRef.current || Date.now())) / 60000));
      const short = !crisis && mins < 20;
      if (w) { w.status = crisis ? 'crisis' : short ? 'revision' : 'validada'; w.profile = crisis ? 'Ruta de crisis' : res.code; }
      if (short) {
        const now = new Date(), hh = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
        s.flags = s.flags.filter(f => f.wid !== p.id);
        s.flags.unshift({ id: 'fv-' + p.id + Date.now(), wid: p.id, fromVisit: true, expert: ex, expertName: ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo', territory: ex === 'mj' ? 'Armenia' : 'Salento', person: p.name, when: 'Hoy · ' + hh, reasons: ['Entrevista de ' + mins + (mins === 1 ? ' minuto' : ' minutos') + ' (mínimo 20)'], status: 'pending' });
        store.pushNotif(s, 'admin', 'Visita marcada: ' + p.name + ' · entrevista de ' + mins + ' min (' + (ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo') + ')', '/equipos');
        shortRef.current = mins;
      } else shortRef.current = 0;
      if (ex === 'andres') s.pendingSync.andres += 1;
      if (s.consents[p.id]) s.consents[p.id] = { contacto: !!cons.o0, remision: !!cons.o2, investigacion: false };
      s.visits[p.id] = { code: res.code, phq: res.phqT, dig: res.digT, crisis, override: st.override, reason: st.reason };
      const terr = ex === 'mj' ? 'Armenia' : 'Salento';
      const expName = ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo';
      s.people = s.people || [];
      const existing = s.people.find(x => x.id === p.id || x.code === p.code);
      if (existing) {
        Object.assign(existing, { profile: crisis ? existing.profile : res.code, status: crisis ? 'Crisis' : 'Activa', expert: expName, terr: existing.terr || terr, week: existing.week || 0, weeks: existing.weeks || (res.r <= 1 ? 13 : res.r === 2 ? 26 : 52) });
      } else if (!crisis) {
        const pre = (store.TCODE && store.TCODE[terr]) || terr.slice(0, 3).toUpperCase();
        s.people.push({ id: p.id, code: p.code || (pre + '-' + String(1000 + s.people.length + 1)), name: p.name, age: p.age, place: p.place, rural: p.rural, terr, profile: res.code, week: 0, weeks: res.r <= 1 ? 13 : res.r === 2 ? 26 : 52, expert: expName, status: 'Activa', clin: res.r >= 2 ? 'Dra. Lucía Marín' : null });
      }
      if (!crisis) {
        s.patients = s.patients || {};
        if (!s.patients[p.id]) s.patients[p.id] = store.emptyPatient ? store.emptyPatient(p.id, p.name, p.age) : { id: p.id, name: p.name, age: p.age, place: p.place + ', ' + terr, profile: res.code, phone: '', phq: [res.phqT], phqDates: ['Hoy'], sleep: null, braceletStatus: '', adherence: null, next: 'Primera llamada dentro de 7 días', nextShort: 'Primera llamada', consent: true, consentKey: p.id, signal: 'Nueva', summary: null, audios: 0, timeline: [], ctx: { dano: 0, perdida: 0 }, lastCheckin: '', checkinDays: null };
        else { s.patients[p.id].profile = res.code; s.patients[p.id].phq = (s.patients[p.id].phq || []).concat([res.phqT]); s.patients[p.id].phqDates = (s.patients[p.id].phqDates || []).concat(['Hoy']); }
      }
      if (!crisis && s.recursos) { const cpk = coursePick(res); s.recursos.people = s.recursos.people || {}; if (!s.recursos.people[p.id]) s.recursos.people[p.id] = { course: cpk.id, week: 1, channel: ['impreso', 'whatsapp', 'app'][res.d], by: res.r <= 1 ? 'Curso guiado por TEO' : res.r === 2 ? 'Curso con el experto' : 'Asignado por la psicóloga', pending: res.r >= 3, read: {}, page: {}, tech: {}, tech4w: {}, doneMods: [], answers: [] }; }
      if (!crisis) {
        s.alerts = s.alerts.filter(a => a.id !== 'a-new-' + p.id);
        store.pushNotif(s, 'clin', 'Nueva paciente asignada: ' + p.name + ' (' + res.code + ')', '/clinico?pid=' + p.id);
        if (!store.PATIENTS[p.id]) s.caseload = (s.caseload || []).filter(x => x.id !== p.id).concat([{ id: p.id, name: p.name, age: p.age, place: p.place + ', ' + terr, profile: res.code, phq: res.phqT, expert: expName }]);
        if (p.id === 'rosalba') { const t0 = new Date(), hm = t0.getHours() + ':' + String(t0.getMinutes()).padStart(2, '0'); s.rosalbaWA.welcomeAt = hm; s.rosalbaWA.inbox = [{ k: 'in', time: hm, text: (t0.getHours() < 12 ? 'Buenos días' : t0.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches') + ', doña Rosalba. Le escribe TEO, de NARA. Andrés Ocampo nos contó que la visitó hoy. Por aquí le vamos a escribir; puede responder con botones o con audios.', }]; s.rosalbaSummary = true; const rc = s.recursos && s.recursos.people.rosalba, c1 = rc && store.REC.cuento(store.REC.curso(rc.course).mods[0].cuento); if (c1) s.rosalbaWA.inbox.push({ k: 'story', slug: c1.slug, time: hm, text: 'Doña Rosalba, esta semana le toca el cuento «' + c1.title + '». Se lo mando en audio para que lo escuche con calma.' }, { k: 'audio', id: 'cuento1', title: 'Cuento narrado', dur: '5:12', secs: 312, caption: 'Cuento narrado · 5:12', time: hm }, { k: 'sys', text: 'Un día después' }, { k: 'ask', id: 'q-cuento1', time: '9:00', text: '¿Le gustó el cuento?', opts: ['Sí', 'Más o menos', 'No lo escuché'] }); }
        s.alerts.push({ id: 'a-new-' + p.id, sev: 'info', pid: store.PATIENTS[p.id] ? p.id : null, name: p.name, age: p.age, place: p.place + (ex === 'mj' ? ', Armenia' : ', Salento'), profile: res.code, what: 'Nueva paciente asignada (' + res.code + '). Primera llamada dentro de 7 días.', source: 'Visita de campo · ' + (ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo'), at: Date.now(), status: 'open' });
      }
    });
    setState({ screen: 'list', pid: null });
    flash((shortRef.current ? 'La entrevista duró ' + shortRef.current + ' min (mínimo 20): la visita va a revisión y no cuenta para la cuota hasta que se apruebe. ' : '') + (ex === 'andres' ? 'Visita guardada en la tablet. Se sincroniza cuando haya señal.' : 'Visita guardada y sincronizada.'));
  }
  function rv() {
    const A = store;
    if (!A) return {};
    const S = A.get(); const C = A.C;
    const scr = st.screen;
    const q = A.quotas(S, ex);
    const pct = (a, b) => Math.min(100, Math.round(a / b * 100)) + '%';
    const offline = ex === 'andres';
    const pend = S.pendingSync[ex];
    const STATUS = {
      validada: ['Validada', '#E3F1E8', C.tinta], siguiente: ['Siguiente', C.verde, '#fff'], curso: ['En curso · falta 1 pregunta', '#E6E1D9', C.azul],
      programada: ['Programada', C.niebla, C.texto2], revision: ['En revisión · no cuenta aún', '#F7E2D2', '#7A3A10'], rechazada: ['Rechazada en revisión', '#EFDCDA', '#9C2F25'], ausente: ['No estaba en casa · reprogramar', '#F9EBC8', '#161413'], crisis: ['Crisis · alerta enviada', C.rojoBg, '#8A1C14']
    };
    const expName = ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo', inList = new Set(S.worklists[ex].map(w => w.name));
    const assignedNew = Object.keys(S.personOv || {}).filter(c => S.personOv[c].expert === expName).map(c => A.person(S, c)).filter(p => p && !inList.has(p.name));
    const worklist = S.worklists[ex].concat(assignedNew.map(p => ({ id: 'as-' + p.code, time: '—', name: p.name, age: p.age, place: p.place, rural: p.rural, status: 'asignada', code: p.code }))).map(w => {
      const [tag, tagBg, tagFg] = w.reassignedTo ? ['Reasignada a ' + w.reassignedTo, C.niebla, C.texto2] : w.status === 'asignada' ? ['Nueva asignada · por programar', '#E6E1D9', '#161413'] : (S.closedToday || []).some(x => (x.pid === w.id || x.id === 'a-' + w.id) && x.sev === 'crisis') ? ['Crisis atendida · revisita en 48 h', '#E3F1E8', '#161413'] : STATUS[w.status];
      const act = w.reassignedTo || (S.closedToday || []).some(x => (x.pid === w.id || x.id === 'a-' + w.id) && x.sev === 'crisis') ? '' : w.status === 'asignada' ? 'Programar' : w.status === 'siguiente' ? 'Empezar visita' : w.status === 'curso' ? 'Continuar visita' : w.status === 'ausente' ? 'Reprogramar' : w.status === 'programada' ? 'Empezar' : '';
      const primary = w.status === 'siguiente' || w.status === 'curso';
      return Object.assign({}, w, {
        zone: w.rural ? 'Rural' : 'Urbano', tag, tagBg, tagFg, hasProfile: !!w.profile && w.status !== 'crisis',
        rowBg: primary ? '#FFF9E3' : '#fff', rowShadow: primary ? 'inset 4px 0 0 #161413' : 'none',
        hasAction: !!act, action: act, btnBg: primary ? C.verde : '#fff', btnFg: primary ? '#fff' : C.verde,
        onAction: () => { if (w.status === 'asignada') return A.set(s => { s.worklists[ex].push({ id: 'p' + Date.now(), time: '17:30', name: w.name, age: w.age, place: w.place, rural: w.rural, status: 'programada' }); }); if (w.status === 'ausente') A.set(s => { s.worklists[ex].find(x => x.id === w.id).status = 'programada'; }); else startVisit(w); }
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
    const territory = ex === 'mj' ? 'Armenia · Barrios seleccionados' : 'Salento · Veredas seleccionadas';
    const evidence = [
      { k: 'GPS al inicio', v: ex === 'mj' ? '4,5339° N · 75,6811° O' : '4,6378° N · 75,5703° O' },
      { k: 'Territorio', v: 'Dentro del territorio asignado' },
      { k: 'Hora de inicio', v: st.startTime || '—' }
    ];

    const it = st.items;
    const all = [].concat(it.phq, it.dig);
    const okN = all.filter(x => x.st === 'ok').length, drN = all.filter(x => x.st === 'draft').length;
    const allOk = okN === 15;
    const secDef = { phq: { qs: A.PHQ.map(t => ({ q: t, o: A.PHQ_OPTS })), label: 'Cuestionario PHQ-9' }, dig: { qs: A.DIGQ, label: 'Capacidad digital' }, ctx: { qs: A.CTX, label: 'Contexto del sismo' } };
    const tag = s => s === 'ok' ? ['Confirmado', OK_BG, C.verde, '#FDCD22'] : s === 'draft' ? ['TEO sugiere', C.ambarBg, C.ambarTx, C.ambar] : ['Sin respuesta', C.niebla, C.texto2, C.lineas];
    const rows = secDef[st.sec].qs.map((qq, i) => {
      const cell = it[st.sec][i]; const [t, tb, tf, tbd] = tag(cell.st);
      return {
        n: i + 1, q: qq.q, tag: t, tagBg: tb, tagFg: tf, tagBd: tbd, isDraft: cell.st === 'draft', sensitive: st.sec === 'phq' && i === 8,
        bd: st.sec === 'phq' && i === 8 ? C.azul : cell.st === 'draft' ? C.ambar : C.lineas,
        confirm: () => setItem(st.sec, i, cell.v, 'ok'),
        opts: qq.o.map((label, v) => {
          const sel = cell.v === v;
          return { label: st.sec === 'phq' ? v + ' · ' + label : label, pick: () => setItem(st.sec, i, v, 'ok'), bg: sel ? (cell.st === 'ok' ? C.verde : C.ambarBg) : '#fff', fg: sel ? (cell.st === 'ok' ? '#fff' : C.ambarTx) : C.tinta, bd: sel ? (cell.st === 'ok' ? C.verde : C.ambar) : C.lineas };
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
    let rr = res.r;
    if (st.override === 'up') rr = Math.min(4, res.r + 1);
    if (st.override === 'down') rr = Math.max(0, res.r - 1);
    const vctx = { dano: (st.items && st.items.ctx && st.items.ctx[0] && st.items.ctx[0].v) || 0, perdida: (st.items && st.items.ctx && st.items.ctx[1] && st.items.ctx[1].v) || 0 };
    let path = A.pathList(rr, res.d, null, vctx);
    if (st.override === 'down' && res.r >= 2 && !path.find(x => x.id === 'clin')) path.unshift({ id: 'clin', name: 'Psicólogo clínico', freq: 'Mensual', channel: A.CLIN_CH[res.d], main: true });
      path = path.map(x => {
        if (x.id !== 'bracelet') return { name: x.name, freq: x.freq, main: x.main, sub: x.channel };
        const terrName = ex === 'mj' ? 'Armenia' : 'Salento';
        const tInfo = A.terrInfo(S, terrName) || { brAv: 0 };
        const avail = tInfo.brAv || 0;
        return { name: x.name, freq: x.freq, main: x.main, sub: x.channel + (avail ? ' · ' + avail + ' disponibles en ' + terrName : ' · sin stock registrado') };
      });
    const months = A.defaultPath(rr, res.d).months;
    if (crisis) path = [
      { name: 'Valoración clínica prioritaria', sub: 'Dra. Lucía Marín · clínica de turno', freq: 'En menos de 24 h', main: true },
      { name: 'Revisita del experto', sub: 'Visita en casa', freq: 'En menos de 48 h', main: false },
      { name: 'Ruta según perfil', sub: 'Se asigna después de la valoración clínica', freq: 'En pausa', main: false }
    ];
    const dur = Math.max(1, Math.round((Date.now() - (visitStartRef.current || Date.now())) / 60000));
    const evidenceEnd = evidence.concat([{ k: 'Duración', v: dur + ' min' }, { k: 'Consentimiento', v: st.ruego ? 'Firma a ruego' : 'Firmado' }]);
    const overrides = [['keep', 'Mantener la ruta asignada'], ['up', 'Subir intensidad'], ['down', 'Bajar intensidad']].map(([k, label]) => ({ label, bd: st.override === k ? C.verde : C.lineas, dot: st.override === k ? C.verde : '#fff', pick: () => setState({ override: k, reasonErr: '' }) }));

    const nf = st.nf;
    const dup = nf.phone.replace(/\D/g, '') === '3124550178';
    const setNf = k => e => setState({ nf: Object.assign({}, st.nf, { [k]: e.target.value }), dupOk: k === 'phone' ? false : st.dupOk, newMsg: '' });
    const codes = { list: 'ExpertWorklist', new: 'NewPersonForm', consent: 'VisitConsent', eval: st.mode === 'chat' ? 'AssessmentConversation' : 'AssessmentForm', result: crisis ? 'AssessmentResult · crisis' : 'AssessmentResult' };

    return {
      ex, dev: A.devMode(), agentRole: 'expert:' + ex, agentOpen: !!st.agentOpen, drawerW: window.innerWidth < 720 ? '100%' : '460px', briefLine: window.AlientoAgent ? AlientoAgent.briefing(ex, S).text : '', briefSub: (offline ? 'Con los datos de la última sincronización · hoy 7:05' : 'Datos al momento') + ((S.revisits[ex] || []).length ? ' · ' + S.revisits[ex].length + ' revisitas pendientes' : ''), openAgent: () => setState({ agentOpen: true }), closeAgent: () => setState({ agentOpen: false, pendingAsk: '' }), pendingAsk: '', agentCtx: offline ? 'Sin señal · datos de la última sincronización (7:05)' : 'Datos al momento', screenCode: st.newForm ? codes.new : codes[scr], expertName: ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo', territory,
      connText: offline ? 'Sin señal · ' + pend + ' visitas por sincronizar' : 'Sincronizado', connBg: offline ? '#F9EBC8' : '#FFF4CC', connDot: offline ? '#E0A526' : '#4E9A6B',
      scrollRef: scrollRef, chatRef: chatRef, sigRef: sigInit,
      goList: () => setState({ screen: 'list', newForm: false }), goNew: () => setState({ newForm: true, nf: { name: '', age: '', phone: '', place: '' }, dupOk: false, newMsg: '' }),
      closeNewForm: () => setState({ newForm: false, newMsg: '' }),
      isList: scr === 'list', isNew: !!st.newForm, isConsent: scr === 'consent', isEval: scr === 'eval', isResult: scr === 'result', inVisit,
      crisisLines: A.crisisLines(ex === 'mj' ? 'Armenia' : 'Salento').map(l => ({ tel: l.tel, label: l.label, sub: l.sub, bg: l.main ? '#B42318' : '#fff', fg: l.main ? '#fff' : '#8A1C14' })),
      notices, worklist, hasGroups: ((S.groupSessions || {})[ex] || []).length > 0,
      groups: ((S.groupSessions || {})[ex] || []).map(g => { const n = Object.values(g.att).filter(v => v === true).length; const GS = { pm1: ['la-bruja-estresona', 'musculos'], gr1: ['el-ladron-de-suenos', 'resp-dormir'], pm2: ['la-bruja-estresona', '54321'], gr2: ['la-carta-del-abuelo', 'bueno-dia'] }[g.id] || ['la-bruja-estresona', 'resp-46'], R = A.REC, gc = R.cuento(GS[0]), gt = R.tecnica(GS[1]), gv = (st.gTab || {})[g.id] === 'guide'; return { isGuide: gv, isAtt: !gv, attBd: gv ? 'transparent' : '#FDCD22', guideBd: gv ? '#FDCD22' : 'transparent', tabAtt: () => setState({ gTab: Object.assign({}, st.gTab, { [g.id]: 'att' }) }), tabGuide: () => setState({ gTab: Object.assign({}, st.gTab, { [g.id]: 'guide' }) }), cover: R.cover(gc.slug), cuento: gc.title, read: () => setState({ er: { slug: gc.slug, page: 1 } }), qs: gc.preguntas.map((t, i) => ({ n: i + 1, t })), tech: gt.title + ' · ' + gt.min + ' min', time: g.time, kind: g.kind === 'pmplus' ? 'Sesión PM+' : 'Grupo de apoyo', title: g.title, place: g.place, attText: g.closed ? n + ' de ' + g.who.length + ' asistieron' : n + ' de ' + g.who.length + ' marcadas · toque cada nombre', canClose: !g.closed, closed: !!g.closed, close: () => A.set(s => { const x = s.groupSessions[ex].find(y => y.id === g.id); x.closed = true; A.pushNotif(s, 'admin', (g.kind === 'pmplus' ? 'Sesión PM+' : 'Grupo de apoyo') + ' registrado por ' + (ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo') + ': ' + n + ' de ' + g.who.length + ' asistieron', '/admin/experto?e=' + encodeURIComponent(ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo')); }), who: g.who.map(([name]) => { const v = g.att[name]; return { name, mark: v === true ? '✓' : v === false ? '✕' : '·', bd: v === true ? C.verde : v === false ? C.texto2 : C.lineas, bg: v === true ? '#FFF4CC' : '#fff', fg: v === false ? C.texto2 : C.tinta, toggle: () => { if (g.closed) return; A.set(s => { const x = s.groupSessions[ex].find(y => y.id === g.id); x.att[name] = v === true ? false : v === false ? undefined : true; }); } }; }) }; }),
      quotaCards: [
        { label: 'Visitas de hoy', val: q.today, target: q.todayT, pct: pct(q.today, q.todayT) },
        { label: 'Semana', val: q.week, target: q.weekT, pct: pct(q.week, q.weekT) },
        { label: 'Cuota rural hoy', val: q.rural, target: q.ruralT, pct: pct(q.rural, q.ruralT) },
        { label: 'Cuota 60+ hoy', val: q.sixty, target: q.sixtyT, pct: pct(q.sixty, q.sixtyT) }
      ],
      newFields: [
        { label: 'Nombre completo', value: nf.name, onChange: setNf('name'), ph: 'Nombre y apellidos' },
        { label: 'Edad', value: nf.age, onChange: setNf('age'), ph: 'Años' },
        { label: 'Teléfono', value: nf.phone, onChange: setNf('phone'), ph: '3xx xxx xxxx', kind: 'phone' },
        { label: 'Vereda o barrio', value: nf.place, onChange: setNf('place'), ph: 'Ej.: Vereda Cocora' }
      ],
      dupShow: dup && !st.dupOk, dupConfirm: () => setState({ dupOk: true, newMsg: 'Marcado como otra persona. Queda registro de la verificación.' }), newMsg: st.newMsg, clearNewMsg: () => setState({ newMsg: '' }),
      newSave: () => {
        if (!nf.name.trim() || !nf.age.trim() || !nf.place.trim()) return setState({ newMsg: 'Faltan datos: escriba nombre, edad y vereda o barrio.' });
        if (dup && !st.dupOk) return setState({ newMsg: 'Confirme si es otra persona antes de seguir.' });
        const id = 'n' + Date.now();
        const terr = ex === 'mj' ? 'Armenia' : 'Salento';
        const pre = (A.TCODE && A.TCODE[terr]) || terr.slice(0, 3).toUpperCase();
        const code = pre + '-' + String(1000 + ((A.people(A.get()).length) + 1));
        const w = { id, time: 'Ahora', name: nf.name.trim(), age: parseInt(nf.age, 10) || 0, place: nf.place.trim(), rural: /vereda/i.test(nf.place), status: 'programada', code, terr };
        A.set(s => {
          s.worklists[ex].push(w);
          s.people = s.people || [];
          if (!s.people.find(x => x.id === id)) {
            s.people.push({
              id, code, name: w.name, age: w.age, place: w.place, rural: w.rural, terr,
              profile: 'P01', week: 0, weeks: 13,
              expert: ex === 'mj' ? 'María José Vélez' : 'Andrés Ocampo',
              status: 'Nueva', clin: null,
            });
          }
        });
        startVisit(w);
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
      isChat: st.mode === 'chat', modeForm: () => setState({ mode: 'form' }), modeChat: () => setState({ mode: 'chat' }),
      mFormBg: st.mode === 'form' ? C.verde : '#fff', mFormFg: st.mode === 'form' ? '#fff' : C.tinta, mChatBg: st.mode === 'chat' ? C.verde : '#fff', mChatFg: st.mode === 'chat' ? '#fff' : C.tinta,
      progressOk: okN + ' de 15 preguntas confirmadas', progressDraft: drN ? ' · ' + drN + ' en borrador' : '',
      calcBg: allOk || crisis ? C.verde : '#DCD6CD', calcFg: allOk || crisis ? '#fff' : '#7A736B',
      calc: () => { if (crisis) return go('result'); if (allOk) go('result'); else flash('Faltan ' + (15 - okN) + ' preguntas por confirmar para calcular el resultado.'); },
      chat: st.chat.map(m => ({ isAi: m.who === 'ai', isExp: m.who === 'exp', text: m.text, label: m.label })),
      thinking: st.thinking, chatInput: st.chatInput, setChatInput: e => setState({ chatInput: e.target.value }), sendChat: () => sendChat(),
      hasExample: st.step < SCRIPT.length && st.pid === 'rosalba', exampleN: st.step + 1, useExample: () => SCRIPT[st.step] && setState({ chatInput: SCRIPT[st.step].note }),
      secTabs, rows, q9: A.Q9_EXACT, secNote: st.sec === 'ctx' ? 'Se registra, no suma puntos.' : 'Toque una opción para cambiar un borrador.',
      confirmSection: () => { const items = JSON.parse(JSON.stringify(st.items)); let q9 = false; items[st.sec].forEach((x, i) => { if (x.st === 'draft') { x.st = 'ok'; if (st.sec === 'phq' && i === 8 && x.v > 0) q9 = true; } }); setState({ items }); if (q9) triggerCrisis(); },
      riskName: A.RISK[res.r].k, phqTotal: res.phqT, riskScale, digName: A.DIG[res.d].k, digTotal: res.digT, digScale,
      digNote: res.dNoHelp < res.d ? 'El apoyo de un familiar sube el nivel de ' + A.DIG[res.dNoHelp].k + ' a ' + A.DIG[res.d].k + '.' : (it.dig[5].v ? 'Tiene apoyo de un familiar con el celular.' : ''),
      matrix, profileLine: crisis ? A.code(res.r, res.d) + ' suspendido · Ruta de crisis' : res.code + ' · ' + A.RISK[res.r].k + ' × digital ' + A.DIG[res.d].k.toLowerCase(),
      evidenceEnd, pathTitle: crisis ? 'Ruta de crisis' : 'Ruta asignada' + (st.override === 'up' ? ' · intensidad mayor' : st.override === 'down' ? ' · intensidad menor' : ''), pathDuration: crisis ? 'Reemplaza la ruta del perfil' : 'Duración total: ' + months + ' meses', path,
      overrides, needReason: st.override !== 'keep', reason: st.reason, setReason: e => setState({ reason: e.target.value, reasonErr: '' }), reasonErr: st.reasonErr, clearReasonErr: () => setState({ reasonErr: '' }), reasonBd: st.reasonErr ? C.revisar : C.lineas,
      cp: cpVals(A, res), saveVisit: () => saveVisit(), saveNote: offline ? 'Sin señal: se guarda en la tablet y se sincroniza después.' : 'Se guarda y se sincroniza ahora.',
      toast: !!st.toast, toastText: st.toast
    };
  }
  const v = useMemo(() => {
    if (!session) return null;
    return { ...rv(), ...erVals(), sigRef: sigInit, scrollRef, chatRef };
  }, [session, st, store, ex, sigInit]);

  return { v, session, ex };
}
