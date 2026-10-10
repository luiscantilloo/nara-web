"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import AlientoAI from "@/lib/ai/ai";
import { BreathExercise } from "@/modules/paciente/app/BreathExercise";
import { naraAsset } from "@/modules/paciente/app/naraAsset";
import { useNaraStore } from "@/providers/nara-provider";

const TEO_N8N_WEBHOOK = "https://polariatech.app.n8n.cloud/webhook/teopaciente";
const STORAGE_PREFIX = "nara.teo.conversations.";
const FLUJO =
  "Se registró el flujo de respiración 4-6: inhalar 4 segundos, exhalar 6 segundos, tres ciclos.";
const MALO =
  /miedo|mal|triste|cansad|angust|dolor|ansie|llor|peor|no puedo|sola|solo|replica|réplica/i;
const CRISIS =
  /suicid|matarme|quitarme la vida|no quiero vivir|hacerme daño|hacerme dano|\bcrisis\b/i;

type Turn = { role: "paciente" | "teo"; text: string; crisis?: boolean };

type ChatVm = {
  patientId?: string;
  patientName?: string;
  firstName?: string;
  chatMsgs: {
    ai?: boolean;
    me?: boolean;
    crisis?: boolean;
    breath?: boolean;
    text?: string;
    avatar?: string;
  }[];
  dianaLines: { label: string; tel: string; sub: string; bg: string; fg: string }[];
  onBreathDone: () => void;
  typing: boolean;
  quick: { label: string; go: () => void }[];
  paused: boolean;
  notPaused: boolean;
  askChips: { label: string; go: () => void }[];
  input: string;
  setInput: (value: string) => void;
  sendDiana: () => void;
};

function btnFont(): CSSProperties {
  return { fontFamily: "Figtree, system-ui, sans-serif" };
}

function newId() {
  return `tc-${Date.now().toString(36)}`;
}

function fechaDe(ms: number) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(ms));
}

function mentionsBreath(text: string) {
  return /respir/i.test(text);
}

/** Misma lectura que el webhook de TEO: respuesta, text, output o message. */
function readN8nRespuesta(raw: string) {
  try {
    const data = JSON.parse(raw) as Record<string, unknown> | Array<Record<string, unknown>>;
    const obj = Array.isArray(data) ? data[0] : data;
    return String(obj?.respuesta || obj?.text || obj?.output || obj?.message || "").trim();
  } catch {
    return raw.trim();
  }
}

function turnsFromChat(msgs: ChatVm["chatMsgs"]): Turn[] {
  const turns: Turn[] = [];
  for (const m of msgs) {
    const text = String(m.text || "").trim();
    if (!text) continue;
    if (m.me) turns.push({ role: "paciente", text });
    else if (m.ai || m.crisis) turns.push({ role: "teo", text, ...(m.crisis ? { crisis: true } : {}) });
  }
  return turns;
}

function buildRecord(messages: Turn[], flujo: boolean) {
  const patient = messages.filter((m) => m.role === "paciente").map((m) => m.text);
  const joined = messages.map((m) => m.text).join("\n");
  let estadoMental: "bueno" | "malo" | "crisis" = "bueno";
  if (messages.some((m) => m.crisis) || CRISIS.test(joined)) estadoMental = "crisis";
  else if (MALO.test(patient.join(" "))) estadoMental = "malo";
  const spoken = messages
    .map((m) => `${m.role === "paciente" ? "Paciente" : "TEO"}: ${m.text}`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
  let resumen = spoken || "Conversación con TEO.";
  if (!/[.!?]$/.test(resumen)) resumen = `${resumen}.`;
  if (flujo) resumen = `${resumen} ${FLUJO}`;
  if (estadoMental === "crisis") resumen = `Crisis. ${resumen}`;
  return { resumen, estadoMental };
}

/** TEO (IA) — el chat que antes vivía en DianaChat. */
export function IaPanel({ vm }: { vm: ChatVm }) {
  const store = useNaraStore();
  const [conversationId, setConversationId] = useState(newId);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [thread, setThread] = useState<Turn[] | null>(null);
  const [sending, setSending] = useState(false);
  const [localPaused, setLocalPaused] = useState(false);

  function patientContext() {
    const id = String(vm.patientId || "");
    const row = (store.PATIENTS?.[id] ||
      store.emptyPatient?.(id, vm.firstName || "Paciente", 0) ||
      {}) as {
      name?: string;
      place?: string;
      profile?: string;
      age?: string | number;
      phone?: string;
    };
    const name = String(row.name || vm.patientName || vm.firstName || "Paciente");
    return {
      id,
      name,
      fname: name.split(/\s+/)[0] || "Paciente",
      place: String(row.place || "Quindío").split(",")[0],
      profile: row.profile || "P01",
      age: row.age || "",
      phone: row.phone || "",
    };
  }

  async function saveConversation(messages: Turn[], close = false) {
    const ctx = patientContext();
    const flujo = messages.some((m) => m.role === "teo" && mentionsBreath(m.text));
    const { resumen, estadoMental } = buildRecord(messages, flujo);
    const conversation = {
      id: conversationId,
      patientId: ctx.id,
      patientName: ctx.name,
      startedAt,
      fecha: fechaDe(startedAt),
      messages,
      resumen,
      estadoMental,
      flujoRespiracion: flujo,
      status: close ? "cerrada" : "abierta",
      closedAt: close ? Date.now() : null,
    };
    const key = STORAGE_PREFIX + (ctx.id || ctx.name);
    const prev = (() => {
      try {
        const raw = JSON.parse(window.localStorage.getItem(key) || "[]") as { id?: string }[];
        return Array.isArray(raw) ? raw.filter((row) => row.id !== conversation.id) : [];
      } catch {
        return [];
      }
    })();
    window.localStorage.setItem(key, JSON.stringify([conversation, ...prev]));
    try {
      await fetch("/api/teo/conversations", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          id: conversation.id,
          patientId: ctx.id,
          patientName: ctx.name,
          startedAt,
          close,
          flujoRespiracion: flujo,
          messages,
        }),
      });
    } catch {
      /* el historial local ya quedó */
    }
  }

  async function askN8n(text: string, prior: Turn[]) {
    const ctx = patientContext();
    const history = prior
      .slice(-8)
      .map((m) => `${m.role === "teo" ? "TEO" : ctx.fname}: ${m.text}`)
      .join("\n");
    const message = text.trim();
    const payload = {
      message,
      chatInput: message,
      history,
      patientName: ctx.name,
      place: ctx.place,
      profile: ctx.profile,
      age: ctx.age ?? "",
    };

    try {
      const res = await fetch(TEO_N8N_WEBHOOK, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(55_000),
      });
      const raw = await res.text();
      if (res.ok) {
        const reply = readN8nRespuesta(raw);
        if (reply) return reply;
      }
    } catch {
      /* el navegador no llega al webhook: el gateway hace la misma llamada */
    }

    try {
      const res = await fetch("/api/teo/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      const reply = readN8nRespuesta(raw);
      if (res.ok && reply && !/^\{/.test(reply)) return reply;
      if (res.ok) {
        const data = JSON.parse(raw) as { ok?: boolean; text?: string };
        if (data.ok && data.text?.trim()) return data.text.trim();
      }
    } catch {
      /* n8n no disponible */
    }

    try {
      const out = await AlientoAI.complete(
        `Eres TEO, acompañante con IA de un programa de salud mental post-sismo en el Eje Cafetero (Colombia). Hablas con ${ctx.name}, ${ctx.age || "—"} años, de ${ctx.place}. Perfil ${ctx.profile}. Trátala de usted, con calidez, frases cortas y palabras sencillas, sin jerga clínica. No das diagnósticos ni reemplazas a su psicóloga (Dra. Lucía Marín). Puedes ofrecer la respiración 4-6, anotar un tema para la sesión o recomendar un video. Voz de TEO: escucha primero, valida y ofrece una sola cosa concreta. Una sola pregunta por mensaje. Nunca diagnostiques, recetes, hables de medicamentos ni contradigas a la psicóloga. Nunca minimices («no es para tanto»), culpes («debería»), prometas («se va a sentir mejor») ni finjas ser humano o sentir emociones. Sin chistes; en temas de miedo, sueño o respiración, frases lentas y sin signos de exclamación. Si detectas cualquier señal de riesgo suicida o peligro inmediato, responde solo con la palabra CRISIS. Responde en máximo 3 frases.\n\n${history}\n${ctx.fname}: ${message}\nTEO:`,
      );
      const reply = String(out || "").trim();
      if (reply) return reply;
    } catch {
      /* respuesta local */
    }
    return AlientoAI.companion(text, false) || "Gracias por escribir. ¿Quiere contarme un poco más de cómo se ha sentido?";
  }

  async function send() {
    const text = vm.input.trim();
    if (!text || sending || vm.paused || localPaused) return;
    vm.setInput("");
    setSending(true);
    const base = thread ?? turnsFromChat(vm.chatMsgs);
    const withPatient: Turn[] = [...base, { role: "paciente", text }];
    setThread(withPatient);
    const ctx = patientContext();
    const crisisHit = store.crisisCheck?.(text);
    let teoText = "";
    let crisis = false;
    if (crisisHit) {
      crisis = true;
      teoText = AlientoAI.crisisText(ctx.fname);
      store.addAlert?.({
        id: "a-" + ctx.id,
        sev: "crisis",
        pid: ctx.id,
        name: ctx.name,
        age: ctx.age,
        place: ctx.place,
        profile: ctx.profile,
        what: `Escribió a TEO: «${text}». TEO pausó la conversación y levantó la alerta.`,
        term: crisisHit,
        source: "Conversación con TEO (IA)",
        phone: ctx.phone,
      });
    } else {
      const reply = await askN8n(text, base);
      crisis = /^\s*CRISIS/.test(reply);
      teoText = crisis ? AlientoAI.crisisText(ctx.fname) : reply;
      if (!crisis) store.logAi?.(ctx.id, "Chat con TEO", teoText);
    }
    if (crisis) setLocalPaused(true);
    const full: Turn[] = [...withPatient, { role: "teo", text: teoText, ...(crisis ? { crisis: true } : {}) }];
    setThread(full);
    setSending(false);
    await saveConversation(full);
  }

  async function startNew() {
    const current = thread ?? turnsFromChat(vm.chatMsgs);
    if (current.some((m) => m.role === "paciente")) await saveConversation(current, true);
    setConversationId(newId());
    setStartedAt(Date.now());
    setThread([]);
    setLocalPaused(false);
    vm.setInput("");
  }

  const shown = (thread ?? vm.chatMsgs.map((m) => ({ ...m }))).map((m) => {
    if ("role" in m) {
      const turn = m as Turn;
      return {
        ai: turn.role === "teo" && !turn.crisis,
        me: turn.role === "paciente",
        crisis: !!turn.crisis,
        breath: false,
        text: turn.text,
        avatar: naraAsset(
          `marca/personajes/teo-${turn.crisis || mentionsBreath(turn.text) ? "calma" : "curiosidad"}.svg`,
        ),
      };
    }
    return m;
  });
  const breathOn = (thread || []).some((m) => m.role === "teo" && mentionsBreath(m.text));

  return (
    <div style={{ animation: "naraTab .22s ease-out", display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div className="sticky top-0 z-20 bg-nara-crema px-3.5 py-2">
        <button
          type="button"
          onClick={() => void startNew()}
          className="h-11 w-full cursor-pointer rounded-full border-[1.5px] border-nara-tinta bg-nara-amarillo font-texto text-sm font-medium text-nara-tinta"
        >
          Nueva conversación
        </button>
      </div>
      <div style={{ margin: "0 14px", background: "#fff", border: "1px solid #DCD6CD", borderRadius: 12, padding: "10px 12px", fontSize: 14, lineHeight: 1.4, color: "#161413" }}>
        TEO es un acompañante con inteligencia artificial. No reemplaza a su psicóloga. Si está en peligro, use el botón de ayuda.
      </div>
      <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.map((m, i) => (
          <div key={i}>
            {m.ai ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "90%", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <img src={m.avatar} alt="" style={{ flex: "none", width: 36, height: 36, display: "block", marginTop: 18 }} />
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#5E5750", display: "flex", gap: 6, alignItems: "center" }}>
                    TEO <span style={{ fontSize: 11, fontWeight: 500, border: "1px solid #5E5750", borderRadius: 4, padding: "0 4px" }}>IA</span>
                  </span>
                  <div style={{ background: "#fff", border: "1px solid #DCD6CD", borderRadius: "4px 18px 18px 18px", padding: "11px 14px", lineHeight: 1.45 }}>{m.text}</div>
                </div>
              </div>
            ) : null}
            {m.me ? (
              <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "#161413", color: "#fff", borderRadius: "18px 4px 18px 18px", padding: "11px 14px", lineHeight: 1.45, marginLeft: "auto" }}>{m.text}</div>
            ) : null}
            {m.crisis ? (
              <div style={{ alignSelf: "stretch", background: "#FDE7E4", border: "1.5px solid #B42318", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#8A1C14" }}>
                  <img src={naraAsset("marca/personajes/teo-calma.svg")} alt="" style={{ width: 36, height: 36, display: "block" }} />
                  TEO · IA · mensaje de cuidado
                </span>
                <span style={{ lineHeight: 1.45 }}>{m.text}</span>
                {vm.dianaLines.map((cl) => (
                  <a key={cl.label} href={cl.tel} style={{ minHeight: 52, padding: "4px 14px", boxSizing: "border-box", borderRadius: 26, border: "2px solid #B42318", background: cl.bg, color: cl.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 16, textAlign: "center", textDecoration: "none" }}>
                    <span>{cl.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 400 }}>{cl.sub}</span>
                  </a>
                ))}
              </div>
            ) : null}
            {m.breath ? (
              <div style={{ alignSelf: "stretch", background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <BreathExercise onDone={vm.onBreathDone} />
              </div>
            ) : null}
          </div>
        ))}
        {breathOn ? (
          <div style={{ alignSelf: "stretch", background: "#fff", border: "1px solid #DCD6CD", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <BreathExercise />
          </div>
        ) : null}
        {sending || vm.typing ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5E5750" }}>
            <img src={naraAsset("marca/personajes/teo-duda.svg")} alt="" style={{ width: 32, height: 32, display: "block" }} />
            TEO está escribiendo…
          </span>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          {vm.quick.map((q) => (
            <button key={q.label} type="button" onClick={q.go} style={{ ...btnFont(), fontSize: 16, minHeight: 48, padding: "0 16px", borderRadius: 22, border: "1.5px solid #161413", background: "#fff", color: "#161413", cursor: "pointer" }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      {vm.paused || localPaused ? (
        <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #DCD6CD", padding: 14, textAlign: "center", fontWeight: 500, fontSize: 16 }}>
          Conversación en pausa · el equipo la llamará
        </div>
      ) : null}
      {vm.notPaused && !localPaused ? (
        <div style={{ position: "sticky", bottom: 0, background: "#F0ECE6", borderTop: "1px solid #DCD6CD", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {vm.askChips.map((q) => (
              <button key={q.label} type="button" onClick={q.go} style={{ flex: "none", ...btnFont(), fontSize: 15, minHeight: 48, padding: "0 14px", borderRadius: 22, border: "1px solid #DCD6CD", background: "#fff", color: "#161413", cursor: "pointer" }}>
                {q.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={vm.input}
              onChange={(e) => vm.setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send()}
              placeholder="Escríbale a TEO"
              style={{ flex: 1, height: 48, borderRadius: 24, border: "1.5px solid #DCD6CD", padding: "0 16px", fontSize: 17, background: "#fff", fontFamily: "Figtree, system-ui, sans-serif" }}
            />
            <button type="button" onClick={() => void send()} style={{ ...btnFont(), fontSize: 16, fontWeight: 500, height: 48, padding: "0 16px", borderRadius: 24, border: "none", background: "#FDCD22", color: "#161413", cursor: "pointer" }}>
              Enviar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
