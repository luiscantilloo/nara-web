"use client";

import AlientoAI from "@/lib/ai/ai";
import { useNaraStore } from "@/providers/nara-provider";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { naraAsset } from "./naraAsset";

type Tab = "home" | "chat" | "route" | "hist" | "resumen";
type ChatMsg = { t: "ai" | "me" | "crisis" | "breath"; text?: string };
type WaRaw = Record<string, unknown>;

type RdState = {
  slug: string;
  page: number;
  mode: "page" | "q" | "done";
  qi: number;
  ans: string;
  share: boolean;
  audio: boolean;
  aprog: number;
};

type PlState = { id: string; prog: number; playing: boolean; done: boolean };

const MOODS = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"];
/** Colores suaves por nivel (1=muy mal … 5=muy bien) */
const MOOD_TINTS = [
  { bd: "#E8A0A0", bg: "#FCE8E8", bgOn: "#F5C4C4" },
  { bd: "#E0B080", bg: "#FCF0E4", bgOn: "#F5D9B8" },
  { bd: "#C4BDB3", bg: "#F5F2EC", bgOn: "#FDCD22" },
  { bd: "#7CB89A", bg: "#E8F6EE", bgOn: "#C8EBD6" },
  { bd: "#D4B820", bg: "#FFF8D6", bgOn: "#FDCD22" },
] as const;

type MoodFace = "calma" | "curiosidad" | "energia" | "duda";
type MoodStep = "idle" | "ack" | "why" | "care" | "breath" | "done";
type MoodBubble = { who: "teo" | "me"; text: string };

const MOOD_WHY_LOW = [
  "El miedo o las réplicas",
  "No pude dormir",
  "Me siento sola o triste",
  "Duele el cuerpo o la cabeza",
  "Prefiero no decir",
];
const MOOD_WHY_MID = [
  "Ando cansada",
  "Hay preocupación en casa",
  "Un día normal, sin más",
  "Prefiero no decir",
];
const MOOD_WHY_HIGH = [
  "Dormí un poco mejor",
  "Me ayudó hablar con alguien",
  "Hoy el cuerpo está más calmo",
  "Solo quería marcarlo",
];

function moodAck(level: number, fname: string): { text: string; face: MoodFace; whyPrompt: string; whys: string[] } {
  const name = fname || "usted";
  if (level <= 0) {
    return {
      text: `${name}, gracias por decirlo con sinceridad. Estar muy mal no es un fallo: es una señal de que necesita cuidado. No tiene que cargar con esto sola.`,
      face: "calma",
      whyPrompt: "Si quiere, digame qué le pesa más ahora. Una sola cosa basta.",
      whys: MOOD_WHY_LOW,
    };
  }
  if (level === 1) {
    return {
      text: `Gracias por marcarlo, ${name}. Un día «mal» también cuenta. El cuerpo a veces se queda en alerta después de un susto o una noche difícil.`,
      face: "calma",
      whyPrompt: "¿Qué le está costando más hoy?",
      whys: MOOD_WHY_LOW,
    };
  }
  if (level === 2) {
    return {
      text: `Quedó registrado: regular. Un día así también merece una mirada amable, ${name}.`,
      face: "curiosidad",
      whyPrompt: "¿Qué describe mejor cómo va el día?",
      whys: MOOD_WHY_MID,
    };
  }
  if (level === 3) {
    return {
      text: `Qué bien que hoy esté bien, ${name}. Eso también es parte del camino.`,
      face: "energia",
      whyPrompt: "Si quiere, cuénteme qué le está ayudando.",
      whys: MOOD_WHY_HIGH,
    };
  }
  return {
    text: `Hoy se siente muy bien. Me alegra registrarlo con usted, ${name}.`,
    face: "energia",
    whyPrompt: "¿Qué le está funcionando hoy?",
    whys: MOOD_WHY_HIGH,
  };
}

function moodCareReply(level: number, why: string): { text: string; face: MoodFace } {
  if (/Prefiero no decir|Solo quería/i.test(why)) {
    return {
      text: "Está bien no decir más. Ya quedó en su seguimiento. Si quiere, podemos hacer una respiración corta de 2 minutos para bajar un poco la carga.",
      face: "calma",
    };
  }
  if (/miedo|réplica/i.test(why)) {
    return {
      text: "Después de un sismo el miedo puede volver con una réplica pequeña. No quiere decir que esté retrocediendo. Una respiración lenta ayuda al cuerpo a bajar la alerta.",
      face: "calma",
    };
  }
  if (/dormir|cansad/i.test(why)) {
    return {
      text: "Dormir mal cansa el ánimo y el cuerpo. Una pausa de respiración ahora no arregla la noche, pero puede dar un respiro pequeño.",
      face: "curiosidad",
    };
  }
  if (/sola|triste/i.test(why)) {
    return {
      text: "Sentirse sola o triste pesa. No tiene que resolverlo todo hoy. Si la angustia es muy fuerte, use Ayuda arriba. Si prefiere, respiramos juntas un momento.",
      face: "calma",
    };
  }
  if (/Duele|cuerpo|cabeza/i.test(why)) {
    return {
      text: "Cuando el cuerpo duele, el ánimo también se apaga. Vamos despacio: una respiración corta puede aflojar un poco la tensión.",
      face: "calma",
    };
  }
  if (/preocup|casa/i.test(why)) {
    return {
      text: "La casa y lo de todos los días pesan. Está bien nombrarlo. ¿Probamos una respiración de 2 minutos para no cargar todo a la vez?",
      face: "duda",
    };
  }
  if (/normal|sin más/i.test(why)) {
    return {
      text: "Un día normal también cuenta. Si quiere cuidar ese equilibrio, una respiración corta puede ayudar.",
      face: "curiosidad",
    };
  }
  if (/Dormí|hablar|calmo|funcionando/i.test(why)) {
    return {
      text: "Gracias por compartirlo. Vale la pena notar lo que ayuda. Si quiere, cerramos con una respiración suave para cuidar ese buen momento.",
      face: level >= 3 ? "energia" : "curiosidad",
    };
  }
  if (level <= 1) {
    return {
      text: "Gracias por contármelo. Estoy con usted en esto. Podemos respirar un momento, o si lo necesita ya, use el botón Ayuda.",
      face: "calma",
    };
  }
  return {
    text: "Gracias por contármelo. ¿Quiere una respiración corta o dejamos el check-in hasta aquí?",
    face: "curiosidad",
  };
}

function moodChatSeed(level: number, fname: string, why?: string) {
  const ack = moodAck(level, fname);
  const care = why ? moodCareReply(level, why).text : ack.text;
  return {
    chat: why
      ? `Registró «${MOODS[level]}» y me contó: ${why}. ${care}`
      : ack.text + " " + ack.whyPrompt,
    chatChips:
      level <= 1
        ? ["Sí, respiremos", "Quiero escribirle", "Ahora no"]
        : ["Sí, respiremos", "Contarle un poco más", "Por ahora está bien"],
    face: ack.face,
  };
}

const WA_BAR_H = [40, 70, 55, 90, 60, 35, 80, 65, 45, 95, 70, 50, 30, 75, 85, 55, 40, 65, 90, 50, 35, 60];
const CL = [
  ["contacto", "Contacto por teléfono o WhatsApp"],
  ["remision", "Compartir mi caso con una institución si me remiten"],
  ["investigacion", "Uso anónimo para investigación"],
] as const;

const fmt = (x: number) =>
  `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function hm() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function usePacienteScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const S = store.get();
  const C = store.C;
  const R = store.REC;

  const [ready, setReady] = useState(false);
  const [who, setWho] = useState("p-rosa-elena");
  const [tab, setTab] = useState<Tab>("home");
  const [topics, setTopics] = useState<[string, boolean][]>([
    ["El miedo con las réplicas pequeñas", true],
    ["Preocupación por la casa", true],
    ["Cómo está durmiendo", true],
  ]);
  const [topicInput, setTopicInput] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [moodStep, setMoodStep] = useState<MoodStep>("idle");
  const [moodThread, setMoodThread] = useState<MoodBubble[]>([]);
  const [moodChoices, setMoodChoices] = useState<string[]>([]);
  const [moodFace, setMoodFace] = useState<MoodFace>("curiosidad");
  const [moodPulse, setMoodPulse] = useState(false);
  const [moodWhy, setMoodWhy] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [stage, setStage] = useState("open");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [consentMsg, setConsentMsg] = useState("");
  const [wa, setWa] = useState<WaRaw[]>([]);
  const [waQuick, setWaQuick] = useState<string[]>([]);
  const [waStage, setWaStage] = useState("none");
  const [waInput, setWaInput] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [prog, setProg] = useState<Record<string, number>>({});
  const [splash, setSplash] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [rd, setRd] = useState<RdState | null>(null);
  const [pl, setPl] = useState<PlState | null>(null);
  const [libTab, setLibTab] = useState("cuentos");
  const [libQ, setLibQ] = useState("");
  const [libTema, setLibTema] = useState("");
  const [waAsked, setWaAsked] = useState<Record<string, string>>({});
  const [framed, setFramed] = useState(false);
  const [devZoom, setDevZoom] = useState(1);

  const bodyRef = useRef<HTMLDivElement>(null);
  const waRef = useRef<HTMLDivElement>(null);
  const modDoneRef = useRef(false);
  const inboxNRef = useRef(0);
  const waReadyRef = useRef(false);
  const auRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const plRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wpRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchXRef = useRef(0);
  const bannerKeyRef = useRef<string | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appInitedRef = useRef(false);
  const pidRef = useRef(who);

  const isRosalba = who === "rosalba";
  const isDiana = !isRosalba; // UI app TEO (Diana o Rosa); Rosalba = WhatsApp
  const pid = who;
  pidRef.current = pid;
  const sessionNow = store.session() as {
    id?: string;
    name?: string;
    email?: string;
    roleId?: string;
  } | null;
  const patientsMap = (store.get().patients || store.PATIENTS || {}) as Record<
    string,
    Record<string, unknown>
  >;
  const resolvedPatient =
    patientsMap[pid] ||
    Object.values(patientsMap).find(
      (p) =>
        p &&
        (p.accountId === pid ||
          p.accountId === sessionNow?.id ||
          (sessionNow?.email && p.email === sessionNow.email) ||
          p.id === pid),
    ) ||
    null;
  const DP =
    resolvedPatient ||
    store.PATIENTS[pid] ||
    store.emptyPatient(pid, sessionNow?.name || "Paciente", 0);
  const firstName = String(DP.name || "Paciente").split(/\s+/)[0] || "Paciente";
  const cons = (S.consents && S.consents[pid]) || {};

  const recP = useCallback(() => {
    const st = store.get();
    const id = pidRef.current;
    return st.recursos?.people?.[id] ?? null;
  }, [store]);

  const courseMod = useCallback(
    (pr: { course?: string; week?: number } | null | undefined) => {
      if (!pr?.course) return null;
      const c = R.curso(pr.course);
      if (!c?.mods?.length) return null;
      return c.mods[Math.max(0, Math.min(c.mods.length, pr.week || 1) - 1)] || null;
    },
    [R],
  );

  const checkModule = useCallback(
    (s: ReturnType<typeof store.get>) => {
      const id = pidRef.current;
      const pr = s.recursos?.people?.[id];
      if (!pr) return false;
      const m = courseMod(pr);
      if (m && pr.read[m.cuento] && (pr.tech[m.tecnica] || 0) >= 3 && !pr.doneMods.includes(pr.week)) {
        pr.doneMods.push(pr.week);
        return true;
      }
      return false;
    },
    [courseMod],
  );

  const celebrate = useCallback(() => {
    const pr = recP();
    if (!pr) return "";
    const m = courseMod(pr);
    if (!m) return `Terminó la semana ${pr.week}.`;
    const t = R.tecnica(m.tecnica);
    return `Terminó la semana ${pr.week}. Hizo la ${t.title} ${pr.tech[m.tecnica] || 0} veces. ¡Eso cuenta!`;
  }, [R, courseMod, recP]);

  const teoSay = useCallback(
    (text: string) => {
      store.logAi(pidRef.current, "Chat con TEO", text);
      setMsgs((m) => m.concat([{ t: "ai", text }]));
    },
    [store],
  );

  const me = useCallback((text: string) => {
    setMsgs((m) => m.concat([{ t: "me", text }]));
    setQuick([]);
  }, []);

  const ai = useCallback(
    (text: string, q?: string[], extra?: ChatMsg[]) => {
      store.logAi(pidRef.current, "Chat con TEO", text);
      setTyping(true);
      setQuick([]);
      setTimeout(() => {
        setTyping(false);
        setMsgs((m) => m.concat([{ t: "ai", text }], extra || []));
        if (q) setQuick(q);
      }, 800);
    },
    [store],
  );

  const crisisDiana = useCallback(
    (term: string, said: string) => {
      const id = pidRef.current;
      const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
      const fname = String(P.name || "Paciente").split(/\s+/)[0];
      setTyping(false);
      setPaused(true);
      setQuick([]);
      setMsgs((m) => m.concat([{ t: "crisis", text: AlientoAI.crisisText(fname) }]));
      store.set((s) => {
        s.diana = s.diana || { crisis: false };
        if (id === "diana") s.diana.crisis = true;
      });
      store.addAlert({
        id: "a-" + id,
        sev: "crisis",
        pid: id,
        name: P.name,
        age: P.age,
        place: (P.place || "").split(",")[0] || P.place,
        profile: P.profile || "P05",
        what:
          (said ? `Escribió a TEO: «${said}». ` : "TEO detectó riesgo en la conversación. ") +
          "TEO le dio la línea 123, pausó la conversación y levantó la alerta.",
        term: term || "clasificador IA",
        source: "Conversación con TEO (IA)",
        phone: P.phone || "",
      });
    },
    [store],
  );

  const initDiana = useCallback(() => {
    const st = store.get();
    const id = pidRef.current;
    const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
    const fname = String(P.name || "Paciente").split(/\s+/)[0];
    // Asegura recurso de curso para la paciente actual
    const existing = st.recursos?.people?.[id];
    const courseId = existing?.course && R.curso(existing.course) ? existing.course : "dormir";
    if (!existing || !R.curso(existing.course)) {
      store.set((s) => {
        s.recursos = s.recursos || { people: {} };
        s.recursos.people = s.recursos.people || {};
        s.recursos.people[id] = {
          course: courseId,
          week: existing?.week || 1,
          read: existing?.read || {},
          page: existing?.page || {},
          tech: existing?.tech || {},
          doneMods: existing?.doneMods || [],
          teoDay: existing?.teoDay ?? null,
        };
      });
    }
    if (id === "diana" && st.diana?.crisis) {
      setMsgs([
        { t: "ai", text: `${saludo()}, ${fname}. Anoche durmió 6,4 horas, mejor que la semana pasada. ¿Cómo se siente hoy?` },
        { t: "crisis", text: AlientoAI.crisisText(fname) },
      ]);
      setPaused(true);
      setQuick([]);
      return;
    }
    const pr = store.get().recursos?.people?.[id];
    const tk = new Date().toDateString();
    if (pr && pr.teoDay !== tk && pr.teoDay != null) {
      const m = courseMod(pr);
      if (m) {
        store.set((s) => {
          if (s.recursos?.people?.[id]) s.recursos.people[id].teoDay = tk;
        });
        store.logAi(id, "Chat con TEO", "Recordatorio del curso");
        setMsgs([
          {
            t: "ai",
            text: `Hola, ${fname}. Esta semana le toca «${R.cuento(m.cuento).title}». ¿Lo leemos o lo escuchamos?`,
          },
        ]);
        setQuick(["Leerlo", "Escucharlo", "Más tarde"]);
        setStage("course");
        return;
      }
    }
    const sleepHint = Array.isArray(P.sleep) && P.sleep.length
      ? `Según su manilla, ha dormido cerca de ${Number(P.sleep[P.sleep.length - 1]).toFixed(1).replace(".", ",")} horas.`
      : "Aún no hay datos de manilla; vamos con cómo se siente.";
    setMsgs([
      {
        t: "ai",
        text: `${saludo()}, ${fname}. ${sleepHint} ¿Cómo se siente hoy?`,
      },
    ]);
    setQuick(["Bien", "Con algo de miedo", "Cansada"]);
  }, [R, courseMod, store]);

  const initWA = useCallback(() => {
    const st = store.get();
    waReadyRef.current = true;
    inboxNRef.current = (st.rosalbaWA.inbox || []).length;
    if (!st.rosalbaSummary) {
      setWa([{ k: "sys", text: "Todavía no hay mensajes. TEO le escribe después de la visita del experto de campo." }]);
      setWaQuick([]);
      setWaStage("none");
      return;
    }
    const T = st.rosalbaWA.welcomeAt || "8:01";
    const lines = [
      { t: "Cómo le ha ido", x: "Hoy empezó su acompañamiento con TEO. Gracias por recibir a Andrés en su casa." },
      { t: "Lo que está funcionando", x: "Ya manda audios por WhatsApp. Así nos puede contar cómo está." },
      { t: "Su próximo paso", x: "La Dra. Lucía Marín la llama el viernes 2 de octubre en la mañana." },
      {
        t: "Lo que sigue en su ruta",
        x: (() => {
          const L = store.pathList(2, 1, null, store.ctxFor("rosalba")).map((x: { id: string }) => x.id);
          const out: string[] = [];
          if (L.includes("pmplus")) out.push("Andrés la acompaña en 5 sesiones PM+, una por semana, en su casa");
          if (L.includes("group")) out.push("cada 15 días hay grupo de apoyo en la escuela de la vereda");
          if (L.includes("social")) out.push("la conectamos con las ayudas para reparar su casa");
          return out.length ? `${out.join("; ").replace(/^./, (c) => c.toUpperCase())}.` : "";
        })(),
      },
      { t: "Para usted", x: "Dormir mal después del sismo es muy común. La respiración de la noche puede ayudarle." },
    ];
    const IB = st.rosalbaWA.inbox || [];
    const cut = IB.findIndex((x: WaRaw) => x.k === "sys" && /después/.test(String(x.text)));
    const today = cut > -1 ? IB.slice(0, cut) : IB;
    const welcome = today.filter((x: WaRaw) => x.k === "in" && !x.slug).slice(0, 1);
    const rest = today.filter((x: WaRaw) => welcome.indexOf(x) < 0);
    const waList: WaRaw[] = [{ k: "sys", text: "Hoy" }].concat(
      welcome,
      [
        { k: "in", text: "Le mandamos su resumen de bienvenida, en imagen y en audio.", time: T },
        { k: "card", lines, time: T },
        { k: "audio", id: "rs1", dur: "1:04", secs: 64, caption: "Nota de voz: su resumen leído en voz alta.", time: T },
      ],
      rest,
      [
        {
          k: "audio",
          id: "a1",
          dur: "0:32",
          secs: 32,
          caption: "¿Cómo durmió anoche? Me puede responder con un botón o con un audio.",
          time: T,
        },
      ],
    );
    if (st.rosalbaWA.crisis) {
      waList.push({ k: "crisis", text: AlientoAI.crisisText("Doña Rosalba") });
      setWa(waList);
      setWaQuick([]);
      setWaStage("done");
      return;
    }
    setWa(waList);
    setWaQuick(["Bien", "Regular", "Mal", "Mandar audio"]);
    setWaStage("sleep");
  }, [store]);

  useEffect(() => {
    let cancelled = false;
    const su = store.session() as {
      id?: string;
      role?: string;
      roleId?: string;
      href?: string;
      email?: string;
      name?: string;
      patientId?: string;
    } | null;
    const isPaciente =
      !!su && (su.roleId === "paciente" || /Paciente/i.test(su.role || ""));
    if (!su || !isPaciente) {
      router.replace("/ingreso");
      return;
    }

    async function boot() {
      // Traer ficha (módulos del admin) — fuente de verdad en Mongo
      try {
        const res = await fetch("/api/patients/me", { credentials: "same-origin" });
        const data = (await res.json()) as {
          ok?: boolean;
          patient?: Record<string, unknown> & { id: string; plan?: unknown };
        };
        if (!cancelled && res.ok && data.ok && data.patient?.id) {
          const profile = data.patient.profile != null ? String(data.patient.profile) : "";
          if (!/^P\d+$/i.test(profile)) {
            router.replace("/paciente/pendiente");
            return;
          }
          store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
            s.patients = s.patients || {};
            s.patients[data.patient!.id] = {
              ...(s.patients[data.patient!.id] || {}),
              ...data.patient!,
            };
          });
        } else if (!cancelled) {
          router.replace("/paciente/pendiente");
          return;
        }
      } catch {
        if (!cancelled) {
          router.replace("/paciente/pendiente");
          return;
        }
      }
      if (cancelled) return;

      const map = (store.get().patients || {}) as Record<
        string,
        { id?: string; accountId?: string; email?: string; plan?: unknown }
      >;
      const linked =
        (su!.patientId && map[su!.patientId]) ||
        map[su!.id!] ||
        Object.values(map).find(
          (p) => p?.accountId === su!.id || (su!.email && p?.email === su!.email),
        ) ||
        null;
      const patientId = String(linked?.id || su!.patientId || su!.id);
      if (su!.href === "/paciente/plan" || linked?.plan || store.PATIENTS?.[patientId]?.plan) {
        router.replace("/paciente/plan");
        return;
      }
      setWho(patientId);
      pidRef.current = patientId;
      if (!appInitedRef.current) {
        appInitedRef.current = true;
        if (patientId === "rosalba" || su!.id === "rosalba") initWA();
        else initDiana();
      }
      setReady(true);
    }

    void boot();
    const spl = setTimeout(() => setSplash(false), 1500);
    const clk = setInterval(() => setNow(Date.now()), 20000);
    const onR = () => {
      setFramed(window.innerWidth > 600);
      setDevZoom(window.innerWidth > 600 ? Math.min(1, (window.innerHeight - 32) / 868) : 1);
    };
    onR();
    window.addEventListener("resize", onR);
    return () => {
      cancelled = true;
      clearTimeout(spl);
      clearInterval(clk);
      window.removeEventListener("resize", onR);
      if (auRef.current) clearInterval(auRef.current);
      if (plRef.current) clearInterval(plRef.current);
      if (wpRef.current) clearInterval(wpRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [initDiana, initWA, router, store]);

  useEffect(() => {
    return store.subscribe(() => {
      const st = store.get();
      setPaused((p) => {
        if (p && !st.diana.crisis) {
          setMsgs((m) =>
            m.concat([
              {
                t: "ai",
                text: "Hola de nuevo, Diana. La Dra. Lucía Marín revisó su mensaje y reabrió nuestra conversación. Aquí estoy cuando quiera.",
              },
            ]),
          );
          return false;
        }
        return p;
      });
      const inbox = st.rosalbaWA.inbox || [];
      if (inbox.length && inboxNRef.current !== inbox.length) {
        const add = inbox.slice(inboxNRef.current);
        inboxNRef.current = inbox.length;
        if (waReadyRef.current) setWa((w) => w.concat(add));
      }
      const su = store.session();
      setWho((w) => (su && su.id !== w ? su.id : w));
    });
  }, [store]);

  useEffect(() => {
    const bn = (S.dianaInbox || []).find((m: { seen?: boolean }) => !m.seen) || null;
    const bk = bn ? String((bn as { id?: string; text?: string }).id || (bn as { text?: string }).text) : null;
    if (bk !== bannerKeyRef.current) {
      bannerKeyRef.current = bk;
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      if (bk) {
        bannerTimerRef.current = setTimeout(() => {
          store.set((s) => {
            const m = (s.dianaInbox || []).find((x: { seen?: boolean }) => !x.seen);
            if (m) m.seen = true;
          });
        }, 5000);
      }
    }
  }, [S.dianaInbox, store]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = tab === "chat" ? 1e6 : bodyRef.current.scrollTop;
  }, [msgs.length, tab]);

  useEffect(() => {
    if (waRef.current) waRef.current.scrollTop = 1e6;
  }, [wa.length]);

  const rdUpd = useCallback((o: Partial<RdState>) => {
    setRd((r) => (r ? { ...r, ...o } : r));
  }, []);

  const finishReading = useCallback(() => {
    if (auRef.current) clearInterval(auRef.current);
    setRd((rd) => {
      if (!rd) return rd;
      const c = R.cuento(rd.slug);
      store.set((s) => {
        const pr = s.recursos?.people?.[pidRef.current];
        if (pr) {
          pr.read[rd.slug] = true;
          delete pr.page[rd.slug];
          modDoneRef.current = checkModule(s);
        }
      });
      return { ...rd, mode: c.preguntas.length ? "q" : "done", audio: false, qi: 0, ans: "" };
    });
  }, [R, checkModule, store]);

  const startAudio = useCallback(() => {
    if (auRef.current) clearInterval(auRef.current);
    auRef.current = setInterval(() => {
      setRd((rd) => {
        if (!rd || !rd.audio || rd.mode !== "page") {
          if (auRef.current) clearInterval(auRef.current);
          return rd;
        }
        const c = R.cuento(rd.slug);
        const np = Math.min(1, rd.aprog + (0.25 / (c.audio * 60)) * 20);
        const page = c.pages ? Math.max(rd.page, Math.min(c.pages, 1 + Math.floor(np * c.pages))) : 1;
        if (c.pages && page !== rd.page) {
          store.set((s) => {
            const pr = s.recursos?.people?.[pidRef.current];
            if (pr) pr.page[rd.slug] = Math.max(pr.page[rd.slug] || 1, page);
          });
        }
        if (np >= 1) {
          if (auRef.current) clearInterval(auRef.current);
          setTimeout(finishReading, 0);
        }
        return { ...rd, aprog: np, page };
      });
    }, 250);
  }, [R, finishReading, store]);

  const openReader = useCallback(
    (slug: string, audio?: boolean) => {
      const c = R.cuento(slug);
      if (!c) return;
      const pr = recP() || { page: {} as Record<string, number> };
      const pg = c.pages ? Math.min(c.pages, (pr.page || {})[slug] || 1) : 1;
      setRd({ slug, page: pg, mode: "page", qi: 0, ans: "", share: true, audio: !!audio, aprog: 0 });
      if (audio) setTimeout(startAudio, 50);
    },
    [R, recP, startAudio],
  );

  const goPage = useCallback(
    (d: number) => {
      setRd((rd) => {
        if (!rd) return rd;
        const c = R.cuento(rd.slug);
        const n = c.pages || 1;
        const np = rd.page + d;
        if (np < 1) return rd;
        if (np > n) {
          finishReading();
          return rd;
        }
        store.set((s) => {
          const pr = s.recursos?.people?.[pidRef.current];
          if (pr) pr.page[rd.slug] = Math.max(pr.page[rd.slug] || 1, np);
        });
        return { ...rd, page: np };
      });
    },
    [R, finishReading, store],
  );

  const answerQ = useCallback(
    (skip: boolean) => {
      setRd((rd) => {
        if (!rd) return rd;
        const c = R.cuento(rd.slug);
        const text = (rd.ans || "").trim();
        if (text && !skip) {
          const hit = store.crisisCheck(text);
          if (hit) {
            if (auRef.current) clearInterval(auRef.current);
            setTab("chat");
            me(text);
            setTimeout(() => crisisDiana(hit, text), 300);
            return null;
          }
          store.set((s) => {
            const pr = s.recursos?.people?.[pidRef.current];
            if (pr) {
              pr.answers.push({
                slug: rd.slug,
                q: c.preguntas[rd.qi],
                a: text,
                at: Date.now(),
                shared: rd.share,
              });
              if (rd.share) {
                const id = pidRef.current;
                const Pn = store.PATIENTS[id]?.name || "Paciente";
                store.pushNotif(
                  s,
                  "clin",
                  `${Pn} compartió su respuesta a «${c.title}»`,
                  "/clinico?pid=" + id,
                );
              }
            }
          });
        }
        if (rd.qi + 1 < c.preguntas.length) return { ...rd, qi: rd.qi + 1, ans: "", share: true };
        return { ...rd, mode: "done" };
      });
    },
    [R, crisisDiana, me, store],
  );

  const closeReader = useCallback(() => {
    if (auRef.current) clearInterval(auRef.current);
    setRd((rd) => {
      if (rd?.mode === "done") {
        const pr = recP();
        const m = courseMod(pr);
        teoSay(
          modDoneRef.current
            ? celebrate()
            : `Gracias por leer «${R.cuento(rd.slug).title}». ${m ? m.pregunta : ""}`,
        );
        modDoneRef.current = false;
      }
      return null;
    });
  }, [R, celebrate, courseMod, recP, teoSay]);

  const runPlayer = useCallback(() => {
    if (plRef.current) clearInterval(plRef.current);
    plRef.current = setInterval(() => {
      setPl((pl) => {
        if (!pl || !pl.playing) {
          if (plRef.current) clearInterval(plRef.current);
          return pl;
        }
        const it = R.item(pl.id);
        const np = Math.min(1, pl.prog + (0.25 / (it.min * 60)) * 30);
        if (np >= 1) {
          if (plRef.current) clearInterval(plRef.current);
          let doneMod = false;
          if (it.kind === "tecnica") {
            store.set((s) => {
              const pr = s.recursos?.people?.[pidRef.current];
              if (pr) {
                pr.tech[pl.id] = (pr.tech[pl.id] || 0) + 1;
                pr.tech4w[pl.id] = (pr.tech4w[pl.id] || 0) + 1;
                doneMod = checkModule(s);
              }
            });
          }
          if (doneMod) teoSay(celebrate());
          return { ...pl, prog: 1, playing: false, done: true };
        }
        return { ...pl, prog: np };
      });
    }, 250);
  }, [R, celebrate, checkModule, store, teoSay]);

  const playItem = useCallback(
    (id: string) => {
      if (!R.item(id)) return;
      if (plRef.current) clearInterval(plRef.current);
      setPl({ id, prog: 0, playing: true, done: false });
      setTimeout(runPlayer, 30);
    },
    [R, runPlayer],
  );

  const startBreath = useCallback(() => {
    setQuick([]);
    setStage("breath");
    setMsgs((m) => m.concat([{ t: "breath" }]));
  }, []);

  const onBreathDone = useCallback(() => {
    setStage("rate");
    ai("¿Cómo está ahora, del 1 al 10?", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  }, [ai]);

  const moduleOn = useCallback(
    (id: string) => {
      const p = (store.get().patients || {})[pidRef.current] as { modulesEnabled?: string[] } | undefined;
      const en = p?.modulesEnabled;
      if (Array.isArray(en)) return en.includes(id);
      return id === "ia" || id === "mood" || id === "hist";
    },
    [store],
  );

  const resetMoodFlow = useCallback(() => {
    setMood(null);
    setMoodStep("idle");
    setMoodThread([]);
    setMoodChoices([]);
    setMoodWhy(null);
    setMoodFace("curiosidad");
  }, []);

  const pushMoodTeo = useCallback((text: string, face?: MoodFace, choices?: string[]) => {
    setMoodThread((t) => t.concat([{ who: "teo", text }]));
    if (face) setMoodFace(face);
    setMoodChoices(choices || []);
  }, []);

  const pickMood = useCallback(
    (i: number) => {
      if (paused) return;
      setMood(i);
      setMoodWhy(null);
      setMoodPulse(true);
      setTimeout(() => setMoodPulse(false), 450);
      const id = pidRef.current;
      const label = MOODS[i];
      const fname = firstName;
      const ack = moodAck(i, fname);
      setMoodStep("why");
      setMoodFace(ack.face);
      setMoodThread([
        { who: "me", text: `Hoy me siento: ${label}` },
        { who: "teo", text: ack.text },
        { who: "teo", text: ack.whyPrompt },
      ]);
      setMoodChoices(ack.whys);
      store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
        s.patients = s.patients || {};
        const prev = s.patients[id] || store.emptyPatient(id, fname, 0);
        const timeline = Array.isArray(prev.timeline) ? prev.timeline.slice() : [];
        timeline.push({
          type: "mood",
          label,
          value: i + 1,
          at: Date.now(),
          d: "Hoy",
        });
        const prevStatus = String(prev.status || "");
        // Aprobado → Activo con el primer contacto / check-in (seguimiento continuo).
        const nextStatus = /^aprobad/i.test(prevStatus) ? "Activo" : prevStatus || prev.status;
        s.patients[id] = {
          ...prev,
          lastCheckin: new Date().toISOString(),
          lastMood: i + 1,
          lastMoodLabel: label,
          timeline,
          ...(nextStatus ? { status: nextStatus, signal: nextStatus === "Activo" ? "Activo" : prev.signal } : {}),
        };
        if (nextStatus === "Activo") {
          const pe = (s.people || []).find((p: { id?: string }) => p.id === id);
          if (pe) pe.status = "Activo";
        }
      });
      store.logAi(id, "Check-in de ánimo", `${label} (${i + 1}/5)`);
    },
    [firstName, paused, store],
  );

  const answerMoodWhy = useCallback(
    (why: string) => {
      if (mood === null) return;
      setMoodWhy(why);
      setMoodThread((t) => t.concat([{ who: "me", text: why }]));
      const care = moodCareReply(mood, why);
      setMoodStep("care");
      setMoodFace(care.face);
      const choices = [
        "Respirar 2 minutos",
        ...(moduleOn("ia") ? ["Seguir hablando con TEO"] : []),
        ...(mood <= 1 ? ["Necesito ayuda ahora"] : []),
        "Cerrar por hoy",
      ];
      setTimeout(() => {
        pushMoodTeo(care.text, care.face, choices);
      }, 280);
      store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
        const p = s.patients?.[pidRef.current];
        if (p) p.lastMoodWhy = why;
      });
      store.logAi(pidRef.current, "Check-in de ánimo", `Motivo: ${why}`);
    },
    [moduleOn, mood, pushMoodTeo, store],
  );

  const continueMoodWithTeo = useCallback(
    (level: number, mode: "talk" | "breath" | "done" = "talk") => {
      const label = MOODS[level];
      const seed = moodChatSeed(level, firstName, moodWhy || undefined);
      if (!moduleOn("ia")) {
        if (mode === "breath") {
          setMoodStep("breath");
          setMoodChoices([]);
          pushMoodTeo("Vamos despacio. Siga el círculo: inspire 4, suelte 6.", "calma");
          return;
        }
        setMoodStep("done");
        pushMoodTeo("Listo. Su check-in quedó en el seguimiento de hoy. Aquí estaré en el próximo.", "calma", []);
        return;
      }
      setTab("chat");
      if (mode === "breath") {
        me(
          moodWhy
            ? `Hoy me siento: ${label}. Me pesa: ${moodWhy}. Quiero respirar.`
            : `Hoy me siento: ${label}. Quiero respirar un momento.`,
        );
        startBreath();
        return;
      }
      if (mode === "done") {
        me(`Hoy me siento: ${label}. Por ahora cierro el check-in.`);
        setStage("free");
        ai("Listo. Quedó en su seguimiento. Aquí estoy cuando quiera hablar.");
        return;
      }
      me(
        moodWhy
          ? `Hoy me siento: ${label} (${level + 1} de 5). Me pesa: ${moodWhy}.`
          : `Hoy me siento: ${label} (${level + 1} de 5).`,
      );
      setStage("mood");
      ai(seed.chat, seed.chatChips);
    },
    [ai, firstName, me, moduleOn, moodWhy, pushMoodTeo, startBreath],
  );

  const onMoodCareChoice = useCallback(
    (label: string) => {
      if (mood === null) return;
      if (/Cerrar/i.test(label) && moodStep === "done") {
        setMoodChoices([]);
        return;
      }
      setMoodThread((t) => t.concat([{ who: "me", text: label }]));
      if (/ayuda/i.test(label)) {
        setHelp(true);
        setMoodStep("care");
        pushMoodTeo(
          "Abrí Ayuda para usted. Si está en peligro o con ideas de hacerse daño, use esas líneas ahora. Si no, podemos respirar un momento.",
          "calma",
          ["Respirar 2 minutos", "Cerrar por hoy"],
        );
        return;
      }
      if (/Respirar/i.test(label)) {
        if (moduleOn("ia")) return continueMoodWithTeo(mood, "breath");
        setMoodStep("breath");
        setMoodChoices([]);
        pushMoodTeo("Vamos despacio. Siga el círculo conmigo.", "calma");
        return;
      }
      if (/Seguir hablando|TEO/i.test(label)) {
        return continueMoodWithTeo(mood, "talk");
      }
      setMoodStep("done");
      setMoodChoices([]);
      pushMoodTeo(
        mood <= 1
          ? "Quedó registrado. Si el malestar crece, use Ayuda cuando lo necesite. Cuídese."
          : "Gracias por el check-in de hoy. Quedó en su seguimiento.",
        mood <= 1 ? "calma" : "energia",
      );
    },
    [continueMoodWithTeo, moduleOn, mood, moodStep, pushMoodTeo],
  );

  const onMoodBreathDone = useCallback(() => {
    setMoodStep("done");
    const next = moduleOn("ia")
      ? ["Seguir hablando con TEO", "Cerrar por hoy"]
      : ["Cerrar por hoy"];
    pushMoodTeo(
      "Bien. Tres ciclos ya cuentan. Su ánimo quedó registrado. Si quiere, mañana volvemos a mirarlo.",
      "energia",
      next,
    );
  }, [moduleOn, pushMoodTeo]);

  const quickDiana = useCallback(
    (label: string) => {
      me(label);
      if (stage === "course") {
        const pr = recP();
        const m = courseMod(pr);
        setStage("open");
        if (m && label !== "Más tarde") openReader(m.cuento, label === "Escucharlo");
        return ai("Está bien. ¿Cómo se siente hoy?", ["Bien", "Con algo de miedo", "Cansada"]);
      }
      if (stage === "mood") {
        if (/respir/i.test(label)) return startBreath();
        if (/ahora no|por ahora|está bien/i.test(label)) {
          setStage("free");
          return ai("Está bien. Aquí estoy cuando lo necesite. Su check-in ya quedó registrado.");
        }
        setStage("free");
        return ai(
          "La escucho. Cuénteme con sus palabras qué le está pasando, o use el teclado cuando quiera. Una sola cosa a la vez está bien.",
        );
      }
      if (stage === "open") {
        if (label === "Con algo de miedo") {
          setStage("fear");
          me("Ayer hubo una réplica pequeña en el trabajo y me volvió el miedo.");
          return ai(
            "Es muy comprensible. Después de un sismo el cuerpo se queda alerta, y una réplica pequeña puede traer todo el miedo de vuelta. No quiere decir que esté retrocediendo. ¿Hacemos juntas una respiración de 2 minutos?",
            ["Sí, respiremos", "Ahora no"],
          );
        }
        setStage("fear");
        return ai(
          label === "Bien"
            ? "Gracias por contarme. ¿Quiere hacer la respiración de hoy para cuidar ese buen momento?"
            : "Gracias por contarme. Cuando hay cansancio, una pausa corta ayuda. ¿Hacemos una respiración de 2 minutos?",
          ["Sí, respiremos", "Ahora no"],
        );
      }
      if (stage === "fear") {
        if (label === "Sí, respiremos") return startBreath();
        setStage("free");
        return ai("Está bien. Aquí estoy cuando lo necesite. Si quiere, le recomiendo el video «El miedo después del sismo» · 4 min.");
      }
      if (stage === "rate") {
        setStage("note");
        return ai(
          "Gracias. ¿Quiere que anote «miedo con las réplicas en el trabajo» para su próxima sesión con la Dra. Lucía Marín?",
          ["Sí, anótelo", "No, gracias"],
        );
      }
      if (stage === "note") {
        setStage("free");
        return ai(
          label === "Sí, anótelo"
            ? "Listo, quedó anotado para el miércoles 7 de octubre. También le puede servir el video «El miedo después del sismo» · 4 min."
            : "Está bien. Le dejo el video «El miedo después del sismo» · 4 min, por si le sirve.",
        );
      }
    },
    [ai, courseMod, me, openReader, recP, stage, startBreath],
  );

  const sendDiana = useCallback(async () => {
    const text = input.trim();
    if (!text || paused) return;
    me(text);
    setInput("");
    setTyping(true);
    const hit = store.crisisCheck(text);
    if (hit) return setTimeout(() => crisisDiana(hit, text), 500);
    const id = pidRef.current;
    const P = store.PATIENTS[id] || store.emptyPatient(id, firstName, 0);
    const fname = String(P.name || firstName || "Paciente").split(/\s+/)[0];
    const place = String(P.place || "Quindío").split(",")[0];
    const hist = msgs
      .filter((m) => m.t === "ai" || m.t === "me")
      .slice(-8)
      .map((m) => `${m.t === "ai" ? "TEO: " : fname + ": "}${m.text}`)
      .join("\n");

    let reply = "";
    try {
      const res = await fetch("/api/teo/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: hist,
          patientName: P.name || firstName,
          place,
          profile: P.profile || "P01",
          age: P.age || "",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; text?: string; fallback?: boolean };
      if (res.ok && data.ok && data.text && data.text.trim()) {
        reply = data.text.trim();
      }
    } catch {
      /* Gemini no disponible → motor local */
    }

    if (!reply) {
      try {
        const out = await AlientoAI.complete(
          `Eres TEO, acompañante con IA de un programa de salud mental post-sismo en el Eje Cafetero (Colombia). Hablas con ${P.name || firstName}, ${P.age || "—"} años, de ${place}. Perfil ${P.profile || "P05"}. Trátala de usted, con calidez, frases cortas y palabras sencillas, sin jerga clínica. No das diagnósticos ni reemplazas a su psicóloga (Dra. Lucía Marín). Puedes ofrecer la respiración 4-6, anotar un tema para la sesión o recomendar un video. Voz de TEO: escucha primero, valida y ofrece una sola cosa concreta. Una sola pregunta por mensaje. Nunca diagnostiques, recetes, hables de medicamentos ni contradigas a la psicóloga. Nunca minimices («no es para tanto»), culpes («debería»), prometas («se va a sentir mejor») ni finjas ser humano o sentir emociones. Sin chistes; en temas de miedo, sueño o respiración, frases lentas y sin signos de exclamación. Si detectas cualquier señal de riesgo suicida o peligro inmediato, responde solo con la palabra CRISIS. Responde en máximo 3 frases.\n\n${hist}\n${fname}: ${text}\nTEO:`,
        );
        reply = String(out || "").trim();
      } catch {
        reply = AlientoAI.companion(text, false);
      }
    }

    if (/^\s*CRISIS/.test(reply)) return crisisDiana("clasificador IA", text);
    if (!reply) {
      reply = "Gracias por escribir. ¿Quiere contarme un poco más de cómo se ha sentido?";
    }
    store.logAi(pidRef.current, "Chat con TEO", reply);
    setTyping(false);
    setMsgs((m) => m.concat([{ t: "ai", text: reply }]));
  }, [crisisDiana, firstName, input, me, msgs, paused, store]);

  const chipAnswer = useCallback(
    (label: string) => {
      const id = pidRef.current;
      const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
      const phq = Array.isArray(P.phq) ? P.phq : [];
      const sleep = Array.isArray(P.sleep) ? P.sleep : [];
      const practice = Array.isArray(P.practice) ? P.practice : [];
      const cur = phq.length ? phq[phq.length - 1] : null;
      const wk = sleep.length ? sleep.slice(-7).reduce((a: number, b: number) => a + b, 0) / Math.min(7, sleep.length) : null;
      const daysN = practice.reduce((a: number, b: number) => a + b, 0);
      const T: Record<string, string> = {
        "¿Cómo voy?":
          phq.length && cur != null
            ? `Su cuestionario de ánimo ${phq.length > 1 ? `empezó en ${phq[0]} y hoy está en ${cur}` : `está en ${cur}`}; más bajo es mejor.${wk != null ? ` Esta semana durmió casi ${Math.round(wk)} horas por noche.` : ""}${daysN ? ` La respiración la hizo ${daysN} días.` : ""}`
            : "Todavía no hay mediciones suyas en el programa. Cuando haga check-ins o tenga visita, aquí verá cómo va.",
        "¿Qué hablé la última vez con la doctora?":
          P.lastSession?.d
            ? `El ${String(P.lastSession.d).toLowerCase()} hablaron de ${P.lastSession.topic || "su avance"}.`
            : "Aún no hay notas de una sesión anterior en su expediente.",
        "¿Qué me toca esta semana?":
          P.next
            ? `Su próximo paso registrado es: ${P.next}.`
            : "Todavía no hay tareas ni cita programada en su expediente.",
      };
      if (paused) return;
      me(label);
      ai(T[label]);
    },
    [ai, me, paused, store],
  );

  const waMe = useCallback((item: WaRaw) => {
    setWa((w) => w.concat([{ ...item, time: hm() }]));
    setWaQuick([]);
  }, []);

  const waPush = useCallback((items: WaRaw[], quick?: string[], stage?: string) => {
    items.forEach((i) => {
      if (i.k === "in" || i.k === "crisis") store.logAi("rosalba", "WhatsApp", String(i.text));
    });
    setWaQuick([]);
    setTimeout(() => {
      setWa((w) => w.concat(items));
      if (quick) setWaQuick(quick);
      if (stage) setWaStage(stage);
    }, 700);
  }, [store]);

  const waTech = useCallback(
    (intro: string) =>
      [
        { k: "in", text: intro, time: hm() },
        { k: "audio", id: "t1", title: "Respiración para dormir", dur: "3:10", secs: 190, time: hm() },
      ] as WaRaw[],
    [],
  );

  const waReminder = useCallback(
    () =>
      [
        {
          k: "in",
          text: "La Dra. Lucía Marín la llama el viernes 2 de octubre en la mañana. Responda 1 si le queda bien o 2 para otro día.",
          time: hm(),
        },
      ] as WaRaw[],
    [],
  );

  const waAnswer = useCallback(
    (label: string) => {
      if (waStage === "summary") {
        if (label === "Mandar audio") {
          waMe({
            k: "audio",
            me: true,
            id: "v2",
            dur: "0:14",
            secs: 14,
            transcript: "Gracias, mija. Ya me aprendí lo de respirar despacio. El viernes espero la llamada.",
          });
          return waPush(
            [
              {
                k: "in",
                text: "Gracias por contarme, doña Rosalba. El viernes la llama la Dra. Lucía Marín. Que pase buen día.",
                time: hm(),
              },
            ],
            [],
            "done",
          );
        }
        waMe({ k: "me", text: label });
        return waPush([{ k: "in", text: "Con mucho gusto, doña Rosalba. Aquí estamos con usted.", time: hm() }], [], "done");
      }
      if (waStage === "sleep") {
        if (label === "Mandar audio") {
          waMe({
            k: "audio",
            me: true,
            id: "v1",
            dur: "0:18",
            secs: 18,
            transcript: "Dormí regular, me desperté otra vez a las tres pensando en el temblor.",
          });
          return waPush(
            waTech(
              "Gracias por su audio, doña Rosalba. Despertarse con ese miedo es muy común después de un sismo. Le mando una técnica para esta noche; escúchela ya acostada.",
            ).concat(waReminder()),
            ["1", "2"],
            "remind",
          );
        }
        waMe({ k: "me", text: label });
        if (label === "Mal") {
          return waPush(
            [
              {
                k: "in",
                text: "Siento que haya pasado mala noche, doña Rosalba. ¿Quiere que su psicóloga la llame antes del viernes 2 de octubre?",
                time: hm(),
              },
            ],
            ["Sí", "No, gracias"],
            "earlier",
          );
        }
        return waPush(
          waTech(
            label === "Bien"
              ? "Gracias, doña Rosalba. Para seguir durmiendo bien, le mando una técnica corta."
              : "Gracias por contarme, doña Rosalba. Le mando una técnica para esta noche; escúchela ya acostada.",
          ).concat(waReminder()),
          ["1", "2"],
          "remind",
        );
      }
      if (waStage === "earlier") {
        waMe({ k: "me", text: label });
        if (label === "Sí") {
          store.addAlert({
            id: "a-rosalba-wa",
            sev: "revisar",
            pid: "rosalba",
            name: "Rosalba Giraldo",
            age: 67,
            place: "Vereda La Esperanza, Salento",
            profile: "P08",
            what: "Respondió «Mal» sobre su sueño y pidió que su psicóloga la llame antes del viernes 2 de octubre.",
            source: "WhatsApp · check-in de sueño",
          });
        }
        return waPush(
          waTech(
            label === "Sí"
              ? "Listo. Le avisamos a la Dra. Lucía Marín para que la llame antes. Mientras tanto, le dejo esta técnica para dormir."
              : "Está bien. Le dejo esta técnica para dormir, por si le sirve esta noche.",
          ).concat(waReminder()),
          ["1", "2"],
          "remind",
        );
      }
      if (waStage === "remind") {
        waMe({ k: "me", text: label });
        return waPush(
          [
            {
              k: "in",
              text:
                label === "1"
                  ? "Perfecto, quedó confirmada la llamada del viernes en la mañana."
                  : "Listo, le vamos a proponer otro día. Le llegará un mensaje a este celular.",
              time: hm(),
            },
            {
              k: "in",
              text: "Si en algún momento necesita ayuda, escriba AYUDA y el equipo la llama.",
              time: hm(),
            },
          ],
          [],
          "done",
        );
      }
    },
    [store, waMe, waPush, waReminder, waStage, waTech],
  );

  const waSendText = useCallback(async () => {
    const text = waInput.trim();
    if (!text) return;
    waMe({ k: "me", text });
    setWaInput("");
    const hitW = store.crisisCheck(text);
    if (hitW) {
      store.set((s) => {
        s.rosalbaWA.crisis = true;
      });
      store.addAlert({
        id: "a-rosalba-ayuda",
        sev: "crisis",
        pid: "rosalba",
        name: "Rosalba Giraldo",
        age: 67,
        place: "Vereda La Esperanza, Salento",
        profile: "P08",
        what: `Escribió «${text}» por WhatsApp.`,
        term: hitW,
        source: "WhatsApp · celular de Paola (hija)",
        phone: "311 839 2205",
        expert: "andres",
      });
      return waPush([{ k: "crisis", text: AlientoAI.crisisText("Doña Rosalba") }], [], "done");
    }
    let reply = "Gracias, doña Rosalba. Le paso su mensaje al equipo.";
    try {
      const out = await AlientoAI.complete(
        `Eres TEO, el acompañante por WhatsApp de un programa de salud mental post-sismo en el Eje Cafetero (Colombia). Le escribes a doña Rosalba, 67 años, de la Vereda La Esperanza (Salento), al celular de su hija Paola. Trátala de "doña Rosalba" y de usted. Frases muy cortas y palabras sencillas; ella prefiere audios. No reemplazas a su psicóloga (Dra. Lucía Marín). Voz de TEO: escucha primero, valida y ofrece una sola cosa concreta. Una sola pregunta por mensaje. Nunca diagnostiques, recetes, hables de medicamentos ni contradigas a la psicóloga. Nunca minimices («no es para tanto»), culpes («debería»), prometas («se va a sentir mejor») ni finjas ser humano o sentir emociones. Sin chistes; en temas de miedo, sueño o respiración, frases lentas y sin signos de exclamación. Si detectas riesgo suicida o peligro, responde solo CRISIS. Máximo 2 frases.\nDoña Rosalba: ${text}\nTEO:`,
      );
      if (/^\s*CRISIS/.test(out)) {
        setWaInput("AYUDA");
        return waSendText();
      }
      reply = out.trim();
    } catch {
      /* local */
    }
    waPush([{ k: "in", text: reply, time: "8:20" }]);
  }, [store, waInput, waMe, waPush]);

  const waPlay = useCallback((id: string, secs: number) => {
    if (wpRef.current) clearInterval(wpRef.current);
    if (playing === id) {
      setPlaying(null);
      return;
    }
    setPlaying(id);
    setProg((p) => ({ ...p, [id]: 0 }));
    const step = 100 / Math.min(secs, 12) / 4;
    wpRef.current = setInterval(() => {
      setProg((p) => {
        const v = (p[id] || 0) + step;
        if (v >= 100) {
          if (wpRef.current) clearInterval(wpRef.current);
          setPlaying(null);
          return { ...p, [id]: 100 };
        }
        return { ...p, [id]: v };
      });
    }, 250);
  }, [playing]);

  const waAsk = useCallback(
    (m: WaRaw, label: string) => {
      setWaAsked((a) => ({ ...a, [String(m.id)]: label }));
      waMe({ k: "me", text: label });
      store.set((s) => {
        const r = s.recursos?.people?.rosalba;
        if (r) {
          r.answers.push({
            slug: "el-pais-de-los-suenos",
            q: String(m.text),
            a: label,
            at: Date.now(),
            shared: true,
          });
          if (label !== "No lo escuché") r.read["el-pais-de-los-suenos"] = true;
        }
      });
      waPush([
        {
          k: "in",
          time: "9:02",
          text:
            label === "No lo escuché"
              ? "Está bien, doña Rosalba. El audio queda aquí para cuando tenga un rato."
              : label === "Sí"
                ? "Gracias por contarme, doña Rosalba. ¿Qué parte le gustó más?"
                : "Gracias por decirme, doña Rosalba. Andrés le puede contar más en la próxima visita.",
        },
      ]);
    },
    [store, waMe, waPush],
  );

  const clock = useMemo(() => {
    const d = new Date(now);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, [now]);

  const greet = useMemo(() => {
    const h = new Date(now).getHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  }, [now]);

  const sleepSeries = Array.isArray(DP.sleep) ? DP.sleep : [];
  const practiceSeries = Array.isArray(DP.practice) ? DP.practice : [];
  const wkS = sleepSeries.length ? sleepSeries.slice(-7).reduce((a: number, b: number) => a + b, 0) / Math.min(7, sleepSeries.length) : 0;
  const days = practiceSeries.reduce((a: number, b: number) => a + b, 0);
  const res = useMemo(
    () => ({
      week: sleepSeries.length
        ? `Esta semana durmió en promedio casi ${Math.round(wkS)} horas por noche.`
        : "Aún no hay datos de sueño registrados.",
      blocks: [
        {
          t: "Cómo le ha ido esta semana",
          x: sleepSeries.length
            ? `Esta semana durmió en promedio casi ${Math.round(wkS)} horas por noche.`
            : "Cuando haya check-ins o manilla, aquí verá su progreso.",
        },
        {
          t: "Lo que está funcionando",
          x: days
            ? `La respiración 4-6 la ha usado ${days} días. ¡Eso cuenta!`
            : "Todavía no hay prácticas registradas esta semana.",
        },
        {
          t: "Su próximo paso",
          x: DP.next || "Su equipo clínico le avisará la próxima sesión.",
        },
        {
          t: "Un mensaje para usted",
          x: "Cada paso cuenta. Cuando tenga datos nuevos, este resumen se actualizará solo.",
        },
      ],
      dots: (practiceSeries.length ? practiceSeries : [0, 0, 0, 0, 0, 0, 0]).map((v: number, i: number) => ({
        bg: v ? C.verde : "#fff",
        l: ["mié", "jue", "vie", "sáb", "dom", "lun", "mar"][i],
      })),
    }),
    [C.verde, DP.next, days, practiceSeries, sleepSeries.length, wkS],
  );

  const pr = recP();
  const hasCourse = !!pr;
  const EB = { calma: "#A9D4FF", curiosidad: "#FFE189", energia: "#FFC0E0" } as const;

  const dc = useMemo(() => {
    if (!pr) return null;
    const c = R.curso(pr.course);
    if (!c || !Array.isArray(c.mods) || !c.mods.length) return null;
    const cur = c.mods[Math.max(0, Math.min(c.mods.length, pr.week || 1) - 1)];
    if (!cur) return null;
    const done = (pr.doneMods || []).length;
    return {
      title: c.title,
      week: pr.week,
      weeks: c.weeks,
      pctW: `${(done / c.weeks) * 100}%`,
      doneLabel: `${done} de ${c.weeks} semanas hechas`,
      cover: naraAsset(R.cover(cur.cuento)),
      // Solo semanas asignadas (hechas + actual). No mostrar la biblioteca futura.
      mods: c.mods
        .map((m, i) => {
          const n = i + 1;
          const state = (pr.doneMods || []).includes(n)
            ? "Hecho"
            : n === (pr.week || 1)
              ? "Esta semana"
              : n < (pr.week || 1)
                ? "Pendiente"
                : "Próximo";
          const t = R.tecnica(m.tecnica);
          const v = R.video(m.video);
          return {
            n,
            slug: m.cuento,
            cuento: R.cuento(m.cuento).title,
            tecnicaId: m.tecnica,
            videoId: m.video,
            cover: naraAsset(R.cover(m.cuento)),
            state,
            chipBg: state === "Hecho" ? "#E3F1E8" : state === "Esta semana" ? "#FDCD22" : "#F0ECE6",
            bd: state === "Esta semana" ? "2px solid #161413" : "1px solid #DCD6CD",
            tech: `${t.title} · ${t.min} min`,
            techCount:
              n === pr.week
                ? (pr.tech[m.tecnica] || 0) >= 3
                  ? `✓ ${pr.tech[m.tecnica]} veces`
                  : `${pr.tech[m.tecnica] || 0} de 3`
                : state === "Hecho"
                  ? "Hecho"
                  : "Escuchar",
            video: `${v.title} · ${v.min} min`,
            assigned: state !== "Próximo",
          };
        })
        .filter((m) => m.assigned),
    };
  }, [R, pr]);

  // Biblioteca = solo lo asignado esta semana (no el catálogo completo)
  const libModFlags = useMemo(() => {
    const en = (DP as { modulesEnabled?: string[] }).modulesEnabled;
    const vis = (DP as { modulesVisible?: string[] }).modulesVisible;
    const hasEn = Array.isArray(en);
    const ok = (id: string) => {
      if (!hasEn) return true;
      if (!en!.includes(id)) return false;
      if (Array.isArray(vis) && vis.length) return vis.includes(id);
      return true;
    };
    return { cursos: ok("cursos"), videos: ok("videos"), tech: ok("tech") };
  }, [DP]);

  const lib = useMemo(() => {
    const week = pr?.week || 1;
    const course = pr?.course ? R.curso(pr.course) : null;
    const mod = course?.mods?.[Math.max(0, week - 1)];
    const assigned: Array<{
      kind: "cuento" | "video" | "tecnica";
      id: string;
      title: string;
      meta: string;
      slug?: string;
      emo: keyof typeof EB;
    }> = [];
    if (mod) {
      if (libModFlags.cursos) {
        const c = R.cuento(mod.cuento);
        assigned.push({
          kind: "cuento",
          id: mod.cuento,
          slug: mod.cuento,
          title: c.title,
          meta: `Cuento · semana ${week}`,
          emo: "curiosidad",
        });
      }
      if (libModFlags.tech) {
        const t = R.tecnica(mod.tecnica);
        assigned.push({
          kind: "tecnica",
          id: mod.tecnica,
          title: t.title,
          meta: `Técnica · ${t.min} min · semana ${week}`,
          emo: "calma",
        });
      }
      if (libModFlags.videos) {
        const v = R.video(mod.video);
        assigned.push({
          kind: "video",
          id: mod.video,
          title: v.title,
          meta: `Video · ${v.min} min · semana ${week}`,
          emo: "curiosidad",
        });
      }
    }
    const q = libQ.toLowerCase();
    const filtered = assigned.filter(
      (x) => !q || x.title.toLowerCase().includes(q) || x.meta.toLowerCase().includes(q),
    );
    const tab = libTab;
    const byTab =
      tab === "cuentos"
        ? filtered.filter((x) => x.kind === "cuento")
        : tab === "videos"
          ? filtered.filter((x) => x.kind === "video")
          : filtered.filter((x) => x.kind === "tecnica");
    const tabs = (
      [
        libModFlags.cursos ? (["cuentos", "Cuentos"] as const) : null,
        libModFlags.videos ? (["videos", "Videos"] as const) : null,
        libModFlags.tech ? (["tecnicas", "Técnicas"] as const) : null,
      ] as Array<readonly [string, string] | null>
    ).filter(Boolean) as Array<readonly [string, string]>;

    return {
      tabs: tabs.map(([k, label]) => ({
        label,
        on: tab === k,
        bg: tab === k ? "#fff" : "transparent",
        fw: tab === k ? 600 : 500,
        key: k,
      })),
      temas: [] as string[],
      isCuentos: tab === "cuentos",
      isList: tab !== "cuentos",
      empty: !byTab.length,
      assignedOnly: true,
      cuentos:
        tab === "cuentos"
          ? byTab.map((c) => ({
              title: c.title,
              cover: naraAsset(R.cover(c.slug || c.id)),
              meta: c.meta,
              slug: c.slug || c.id,
            }))
          : [],
      items:
        tab !== "cuentos"
          ? byTab.map((v) => ({
              title: v.title,
              meta: v.meta,
              bg: EB[v.emo],
              char: naraAsset(`marca/personajes/nara-${v.emo}.svg`),
              cta: v.kind === "video" ? "Ver" : "Escuchar",
              id: v.id,
            }))
          : [],
    };
  }, [EB, R, libModFlags, libQ, libTab, pr]);

  const rdView = useMemo(() => {
    if (!rd) return null;
    const c = R.cuento(rd.slug);
    const n = c.preguntas.length;
    return {
      title: c.title,
      counter: rd.mode === "page" ? (c.pages ? `${rd.page} de ${c.pages}` : "Portada") : "",
      img: naraAsset(c.pages ? R.page(rd.slug, rd.page) : R.cover(rd.slug)),
      alt: `${c.title}${c.pages ? `, página ${rd.page}` : ", portada"}`,
      isPage: rd.mode === "page",
      isQ: rd.mode === "q",
      isDone: rd.mode === "done",
      noPages: !c.pages,
      prevOp: rd.page > 1 ? 1 : 0.35,
      audioLabel: rd.audio ? "Pausar" : "Escuchar",
      aW: `${rd.aprog * 100}%`,
      aTime: `${fmt(rd.aprog * c.audio * 60)} / ${fmt(c.audio * 60)}`,
      qCounter: `Pregunta ${rd.qi + 1} de ${n}`,
      q: c.preguntas[rd.qi] || "",
      ans: rd.ans,
      share: rd.share,
      yesBg: rd.share ? "#FDCD22" : "#fff",
      noBg: rd.share ? "#fff" : "#FDCD22",
      nextLabel: rd.qi + 1 < n ? "Siguiente" : "Terminar",
      doneTitle: `Terminó «${c.title}»`,
      doneText: modDoneRef.current
        ? celebrate()
        : "Quedó guardado en su curso. Puede volver a leerlo cuando quiera.",
    };
  }, [R, celebrate, rd]);

  const plView = useMemo(() => {
    if (!pl) return null;
    const it = R.item(pl.id);
    const cnt = pr ? pr.tech[pl.id] || 0 : 0;
    return {
      title: it.title,
      meta: `${it.kind === "video" ? "Video" : "Técnica guiada"} · ${it.min} min · ${it.tema}`,
      bg: EB[it.emo as keyof typeof EB],
      char: naraAsset(`marca/personajes/nara-${it.emo}.svg`),
      w: `${pl.prog * 100}%`,
      time: `${fmt(pl.prog * it.min * 60)} / ${fmt(it.min * 60)}`,
      done: pl.done,
      doneText:
        it.kind === "tecnica"
          ? `Quedó registrada. Esta semana la hizo ${cnt}${cnt === 1 ? " vez." : " veces."}`
          : "Video terminado.",
      label: pl.done ? "Otra vez" : pl.playing ? "Pausar" : "Reproducir",
    };
  }, [EB, R, pl, pr]);

  const dianaLines = store.crisisLines("Armenia").map((l: { tel: string; label: string; sub: string; main?: boolean }) => ({
    tel: l.tel,
    label: l.label,
    sub: l.sub,
    bg: l.main ? "#B42318" : "#fff",
    fg: l.main ? "#fff" : "#8A1C14",
  }));

  const rosaLines = store.crisisLines("Salento").map((l: { tel: string; label: string; sub: string; main?: boolean }) => ({
    tel: l.tel,
    label: l.label,
    sub: l.sub,
    bg: l.main ? "#B42318" : "#fff",
    fg: l.main ? "#fff" : "#8A1C14",
  }));

  const unreadBanner = (S.dianaInbox || []).find((m: { seen?: boolean }) => !m.seen) as
    | { text?: string; tab?: Tab }
    | undefined;

  const screenCode = isDiana
    ? ({ resumen: "PatientWeeklySummary", home: "PatientHome", chat: "TeoChat", route: "PatientPath", hist: "PatientHistory" } as const)[
        tab === "resumen" ? "resumen" : tab
      ]
    : "WhatsAppChannel";

  const routeChanges = (S.pathAdjust[pid] || [])
    .map((x: string) => ({
      d: "Hoy · Dra. Lucía Marín",
      x:
        ({
          "Subir a sesiones semanales": "Sus sesiones con la psicóloga ahora son cada semana.",
          "Bajar intensidad": "Su ruta ahora tiene menos sesiones, porque va mejorando.",
          "Agregar revisita del experto": "Su experta de campo la va a visitar de nuevo en casa.",
        } as Record<string, string>)[x.split(".")[0]] || x,
    }))
    .concat(
      S.referrals
        .filter((x: { pid: string }) => x.pid === pid)
        .map((x: { date: string; status: string }) => ({
          d: x.date,
          x: `Su psicóloga la remitió a otra institución para que la atiendan allí. Estado: ${x.status.toLowerCase()}.`,
        })),
    );

  const { r: pathR, d: pathD } = store.parseCode(DP.profile || "P05");
  const pathServices = store.pathList(pathR, pathD, null, store.ctxFor(pid));
  const pathById = Object.fromEntries(
    pathServices.map((s: { id: string; freq: string; channel: string; name: string }) => [s.id, s]),
  ) as Record<string, { id: string; freq: string; channel: string; name: string }>;
  // Admin habilita (modulesEnabled); paciente elige qué ver (modulesVisible).
  // Si la ficha trae modulesEnabled (aunque sea un solo ítem), manda sobre la ruta.
  const hasModuleOverride = Array.isArray((DP as { modulesEnabled?: string[] }).modulesEnabled);
  const enabledList: string[] = hasModuleOverride
    ? ((DP as { modulesEnabled: string[] }).modulesEnabled || []).slice()
    : [...Object.keys(pathById), "hist"];
  const rawVisible = (DP as { modulesVisible?: string[] }).modulesVisible;
  const visibleList: string[] =
    hasModuleOverride && Array.isArray(rawVisible)
      ? rawVisible.filter((id: string) => enabledList.includes(id))
      : enabledList.slice();
  const effectiveVisible =
    hasModuleOverride && Array.isArray(rawVisible) && rawVisible.length === 0
      ? []
      : visibleList.length
        ? visibleList
        : hasModuleOverride
          ? enabledList.slice()
          : enabledList;
  const on = (id: string) => enabledList.includes(id) && effectiveVisible.includes(id);
  const mods = {
    mood: on("mood"),
    clin: on("clin"),
    ia: on("ia"),
    wa: on("wa"),
    call: on("call"),
    bracelet: on("bracelet"),
    videos: on("videos"),
    tech: on("tech"),
    cursos: on("cursos"),
    group: on("group"),
    pmplus: on("pmplus"),
    social: on("social"),
    revisit: on("revisit"),
    hist: on("hist"),
  };
  const showRouteTab = !!(
    mods.cursos ||
    mods.videos ||
    mods.tech ||
    mods.wa ||
    mods.call ||
    mods.group ||
    mods.revisit ||
    mods.social
  );
  const hasHomeContent = !!(
    mods.mood ||
    mods.ia ||
    mods.wa ||
    mods.call ||
    mods.videos ||
    mods.tech ||
    mods.cursos ||
    mods.group ||
    mods.revisit ||
    mods.social ||
    mods.clin ||
    mods.bracelet
  );
  const showHistTab = !!mods.hist;
  const showHomeTab = hasHomeContent || (!showHistTab && !mods.ia && !showRouteTab);
  const hasAnyModule = hasHomeContent || showHistTab || mods.ia || showRouteTab;

  useEffect(() => {
    if (!hasAnyModule) {
      setTab("home");
      return;
    }
    if (tab === "chat" && !mods.ia) setTab(showHomeTab ? "home" : showHistTab ? "hist" : "home");
    if (tab === "route" && !showRouteTab) setTab(showHomeTab ? "home" : showHistTab ? "hist" : "home");
    if (tab === "hist" && !showHistTab) setTab(showHomeTab ? "home" : "home");
    if (tab === "home" && !showHomeTab && showHistTab) setTab("hist");
  }, [tab, mods.ia, showRouteTab, hasAnyModule, showHistTab, showHomeTab]);

  const svc = (id: string, freqFallback = "Según su ruta", channelFallback = "") => ({
    freq: pathById[id]?.freq || freqFallback,
    channel: pathById[id]?.channel || channelFallback,
  });

  const waCard = mods.wa
    ? {
        freq: svc("wa", "Semanal").freq,
        channel: svc("wa", "Semanal", "Audio primero").channel || "Audio primero",
        title: "Check-in por WhatsApp",
        body: `Le escribimos ${String(svc("wa", "semanal").freq).toLowerCase()} por WhatsApp (${svc("wa", "Semanal", "audio primero").channel || "audio primero"}). Puede responder con un audio corto de cómo se siente.`,
        tip: "Cuando llegue el mensaje, respóndalo desde WhatsApp. Aquí solo ve el recordatorio.",
      }
    : null;

  const callCard = mods.call
    ? {
        freq: svc("call", "Mensual").freq,
        title: "Llamada de seguimiento",
        when: DP.next || `Llamada ${String(svc("call", "mensual").freq).toLowerCase()}`,
        phone: DP.phone || "—",
        clin: DP.clin || "Su equipo clínico",
        body: `Según su ruta: llamada ${String(svc("call", "mensual").freq).toLowerCase()}. Conteste desde su número registrado.`,
      }
    : null;

  const revisitCard = mods.revisit
    ? {
        title: "Revisita del experto",
        freq: svc("revisit", "Mensual").freq,
        expert: DP.expert || "Su experta de campo",
        place: (DP.place || "").split(",")[0] || "su vereda",
        body: `${DP.expert || "Su experta de campo"} la visitará en casa (${svc("revisit", "Mensual", "Visita en casa").channel || "visita en casa"}). Frecuencia: ${String(svc("revisit", "mensual").freq).toLowerCase()}.`,
        tip: "Prepare un lugar tranquilo. Si no puede atender, avise con tiempo.",
      }
    : null;

  const groupCard = mods.group
    ? {
        title: "Grupo de apoyo en la vereda",
        freq: svc("group", "Quincenal").freq,
        channel: svc("group", "Quincenal", "En la vereda · con facilitador").channel || "En la vereda · con facilitador",
        body: `Encuentro ${String(svc("group", "quincenal").freq).toLowerCase()} en ${svc("group", "Quincenal", "la vereda, con facilitador").channel || "la vereda, con facilitador"}.`,
        tip: "No tiene que hablar si no quiere. Ir ya cuenta como cuidar su salud.",
      }
    : null;

  const socialCard = mods.social
    ? {
        title: "Ayudas sociales",
        channel: svc("social", "Según el caso", "Según el caso").channel || "Según el caso",
        body: `Su ruta incluye vinculación a ayudas: ${svc("social", "Según el caso", "según su situación").channel || "según su situación"}.`,
        tip: "Su experta de campo le ayuda con los trámites. Aquí solo ve el estado de ese apoyo.",
        status: "En trámite con el equipo de campo",
      }
    : null;

  const openVideosLib = () => {
    setLibTab("videos");
    setTab("route");
  };

  const openCursos = () => {
    if (mods.cursos) {
      setLibTab("cuentos");
      setTab("route");
    }
  };

  const route = [
    ["Sesiones con su psicóloga", DP.lastSession ? 1 : 0, null],
    ["Conversaciones con TEO", (S.aiLog || []).filter((l: { pid?: string }) => l.pid === pid).length || 0, null],
    ["Check-ins por WhatsApp", "Según la ruta", null],
    ["Manilla", DP.braceletStatus || "Según la ruta", null],
  ]
    .concat(
      pathServices
        .filter((x: { id: string }) => !["mood", "clin", "bracelet", "pmplus"].includes(x.id))
        .map((x: { id: string; name: string; freq: string; channel: string }) => [
          x.id === "social" ? `Ayudas sociales · ${(x.channel || "").toLowerCase()}` : x.name,
          x.id === "social" ? "Según el caso" : x.freq,
          null,
        ]),
    )
    .map(([name, a, b]) => ({
      name: name as string,
      val: b ? `${a} de ${b}` : String(a),
      hasBar: !!b,
      pct: b ? `${Math.round((Number(a) / Number(b)) * 100)}%` : "0%",
    }));

  const phqHist = Array.isArray(DP.phq) ? DP.phq : [];
  const phqDates = Array.isArray(DP.phqDates) ? DP.phqDates : [];
  const hist = (phqHist.length
    ? phqHist.map((v: number, i: number) => [v, phqDates[i] || "Medición"])
    : [[7, "Hoy"]]
  ).map(([v, d]) => ({ v, d, h: `${Math.round((Number(v) / 27) * 100)}%` }));

  const waMapped = wa.map((m) => {
    const id = String(m.id || "");
    const p = prog[id] || 0;
    return {
      raw: m,
      sys: m.k === "sys",
      inText: m.k === "in",
      meText: m.k === "me",
      crisis: m.k === "crisis",
      isAudio: m.k === "audio",
      isCard: m.k === "card",
      isStory: m.k === "story",
      isAsk: m.k === "ask",
      text: m.text as string | undefined,
      time: m.time as string | undefined,
      cover: m.slug ? naraAsset(R.cover(String(m.slug))) : "",
      open: m.k === "ask" && !waAsked[String(m.id)],
      opts: ((m.opts as string[]) || []).map((label) => ({ label, go: () => waAsk(m, label) })),
      lines: (m.lines as { t: string; x: string }[]) || [],
      align: m.me ? "flex-end" : "flex-start",
      bg: m.me ? "#FFF4CC" : "#fff",
      hasTitle: !!m.title,
      title: m.title as string | undefined,
      dur: m.dur as string | undefined,
      hasCaption: !!m.caption,
      caption: m.caption as string | undefined,
      hasTranscript: !!m.transcript,
      transcript: m.transcript as string | undefined,
      icon: playing === id ? "❚❚" : "▶",
      play: () => waPlay(id, Number(m.secs) || 12),
      bars: WA_BAR_H.map((h, i) => ({
        h: `${h}%`,
        c: (i / WA_BAR_H.length) * 100 < p ? "#161413" : "#B3ACA2",
      })),
    };
  });

  const chatMsgs = msgs.map((m) => ({
    ai: m.t === "ai",
    me: m.t === "me",
    crisis: m.t === "crisis",
    breath: m.t === "breath",
    text: m.text,
    avatar: naraAsset(
      `marca/personajes/teo-${
        paused
          ? "calma"
          : /(eso cuenta|lo logró|completó|mejoró|avance|terminó la semana)/i.test(m.text || "")
            ? "energia"
            : /respir|dorm|sueño|técnica|calma|despacio|aire/i.test(m.text || "")
              ? "calma"
              : "curiosidad"
      }.svg`,
    ),
  }));

  return {
    ready,
    isDiana,
    isRosalba: !isDiana,
    framed,
    dev: store.devMode(),
    devW: framed ? "390px" : "100%",
    devH: framed ? "844px" : "100dvh",
    devZoom,
    devR: framed ? "56px" : "0",
    devBd: framed ? "12px solid #161413" : "none",
    devSh: framed ? "0 30px 60px rgba(22,20,19,.25), 0 0 0 2px #3A3633" : "none",
    scrR: framed ? "44px" : "0",
    sbBg: isDiana ? "#F0ECE6" : "#161413",
    sbFg: isDiana ? "#161413" : "#fff",
    gestC: "#161413",
    clock,
    splash: isDiana && splash,
    screenCode,
    hasBanner: isDiana && !!unreadBanner,
    bannerText: unreadBanner?.text || "",
    bannerTop: framed ? "54px" : "10px",
    dismissBanner: (e: React.MouseEvent) => {
      e.stopPropagation();
      store.set((s) => {
        const m = (s.dianaInbox || []).find((x: { seen?: boolean }) => !x.seen);
        if (m) m.seen = true;
      });
    },
    openBanner: () => {
      const m = unreadBanner;
      store.set((s) => {
        const x = (s.dianaInbox || []).find((y: { seen?: boolean }) => !y.seen);
        if (x) x.seen = true;
      });
      if (m?.tab) setTab(m.tab);
    },
    bodyRef,
    waRef,
    tab,
    setTab,
    tabHome: tab === "home",
    tabChat: tab === "chat",
    tabRoute: tab === "route",
    tabHist: tab === "hist",
    tabRes: tab === "resumen",
    openResumen: () => setTab("resumen"),
    closeResumen: () => setTab("home"),
    greet,
    firstName,
    patientName: DP.name,
    mods,
    waCard,
    callCard,
    revisitCard,
    groupCard,
    socialCard,
    openVideosLib,
    openCursos,
    showCourse: mods.cursos && !!hasCourse && !!dc,
    showTech: mods.tech,
    showResumen: false,
    showBracelet: false,
    hasAnyModule,
    showHomeTab,
    showHistTab,
    res,
    moods: MOODS.map((label, i) => {
      const on = mood === i;
      const tint = MOOD_TINTS[i];
      return {
        n: i + 1,
        label,
        on,
        bd: on ? "#161413" : tint.bd,
        bg: on ? tint.bgOn : tint.bg,
        fg: C.tinta,
        scale: on && moodPulse ? "1.06" : on ? "1.03" : "1",
        pick: () => pickMood(i),
      };
    }),
    moodDone: mood !== null && moodStep !== "idle",
    moodStep,
    moodBreathing: moodStep === "breath",
    moodThread: moodThread.map((b) => ({
      me: b.who === "me",
      teo: b.who === "teo",
      text: b.text,
    })),
    moodFace: naraAsset(`marca/personajes/teo-${moodFace}.svg`),
    moodCanTeo: mods.ia,
    moodLow: mood !== null && mood <= 1,
    moodActions: moodChoices.map((label) => ({
      label,
      primary: /Respirar|TEO|hablar/i.test(label) && !/Cerrar|Prefiero/i.test(label),
      danger: /ayuda/i.test(label),
      go: () => {
        if (moodStep === "why") answerMoodWhy(label);
        else onMoodCareChoice(label);
      },
    })),
    onMoodBreathDone,
    moodChange: resetMoodFlow,
    hasCourse,
    dc,
    startTechnique: () => {
      setTab("chat");
      if (!paused && stage !== "breath") {
        me("Quiero hacer la respiración de hoy");
        startBreath();
      }
    },
    chatMsgs,
    typing,
    quick: quick.map((label) => ({ label, go: () => quickDiana(label) })),
    paused,
    notPaused: !paused,
    input,
    setInput,
    sendDiana,
    askChips: ["¿Cómo voy?", "¿Qué hablé la última vez con la doctora?", "¿Qué me toca esta semana?"].map(
      (label) => ({ label, go: () => chipAnswer(label) }),
    ),
    topics: topics.map(([label, on], i) => ({
      label,
      mark: on ? "✓" : "",
      bg: on ? C.verde : "#fff",
      toggle: () =>
        setTopics((t) => t.map((row, j) => (j === i ? [row[0], !row[1]] : row))),
    })),
    topicInput,
    setTopicInput,
    addTopic: () => {
      const t = topicInput.trim();
      if (t) {
        setTopics((top) => top.concat([[t, true]]));
        setTopicInput("");
      }
    },
    sesionDia: "miércoles 7 de octubre",
    lib: {
      ...lib,
      tabs: lib.tabs.filter((t: { key: string }) => {
        if (t.key === "videos") return mods.videos;
        if (t.key === "cuentos") return mods.cursos;
        if (t.key === "tecnicas") return mods.tech;
        return false;
      }),
    },
    setLibTab: (k: string) => {
      setLibTab(k);
      setLibTema("");
    },
    setLibQ,
    setLibTema,
    libQ,
    libTema,
    openReader,
    playItem,
    route,
    routeChanges,
    hasRouteChanges: !!(S.pathAdjust[pid] || []).length || !!S.referrals.find((x: { pid: string }) => x.pid === pid),
    hist,
    consents: CL.map(([k, label]) => ({
      label,
      state: cons[k] ? "Sí" : "No",
      bg: cons[k] ? C.verde : "#C4BDB3",
      x: cons[k] ? "25px" : "3px",
      toggle: () => {
        const v = !cons[k];
        const id = pidRef.current;
        const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
        store.set((s) => {
          s.consents = s.consents || {};
          s.consents[id] = s.consents[id] || {};
          s.consents[id][k] = v;
          if (!v)
            store.pushNotif(
              s,
              "clin",
              `Consentimiento retirado: ${P.name} · ${label.toLowerCase()}`,
              "/clinico?pid=" + id,
            );
          if (!v)
            s.alerts.push({
              id: `a-cons-${k}${Date.now()}`,
              sev: "info",
              pid: id,
              name: P.name,
              age: P.age,
              place: P.place,
              profile: P.profile || "P05",
              what: `Retiró su consentimiento: ${label.toLowerCase()}.`,
              source: "App · Historial",
              at: Date.now(),
              status: "open",
            });
        });
        setConsentMsg(v ? "Cambio guardado." : "Cambio guardado. Le avisamos a su psicóloga.");
      },
    })),
    consentMsg,
    clearConsentMsg: () => setConsentMsg(""),
    tabs: (
      [
        showHomeTab ? ["home", "Inicio"] : null,
        mods.ia ? ["chat", "TEO"] : null,
        showRouteTab ? ["route", "Mi ruta"] : null,
        showHistTab ? ["hist", "Historial"] : null,
      ] as Array<[string, string] | null>
    )
      .filter(Boolean)
      .map((row) => {
        const [k, label] = row as [string, string];
        return {
          label,
          on: tab === k,
          fg: tab === k ? "#161413" : "#5E5750",
          fw: tab === k ? 600 : 500,
          dot: tab === k ? "#FDCD22" : "transparent",
          op: tab === k ? 1 : 0.7,
          isHome: k === "home",
          isTeo: k === "chat",
          isRoute: k === "route",
          isHist: k === "hist",
          go: () => setTab(k as Tab),
        };
      }),
    tabCount: [showHomeTab, mods.ia, showRouteTab, showHistTab].filter(Boolean).length,
    rdOpen: !!rd,
    rdView,
    rdUpd,
    goPage,
    closeReader,
    answerQ,
    startAudio,
    toggleReaderAudio: () => {
      setRd((rd) => {
        if (!rd) return rd;
        const on = !rd.audio;
        if (on) setTimeout(startAudio, 30);
        else if (auRef.current) clearInterval(auRef.current);
        return { ...rd, audio: on };
      });
    },
    touchXRef,
    plOpen: !!pl,
    plView,
    plToggle: () => {
      if (!pl) return;
      if (pl.done) return playItem(pl.id);
      const on = !pl.playing;
      setPl({ ...pl, playing: on });
      if (on) setTimeout(runPlayer, 30);
      else if (plRef.current) clearInterval(plRef.current);
    },
    plClose: () => {
      if (plRef.current) clearInterval(plRef.current);
      setPl(null);
    },
    helpOpen: help,
    helpNotSent: (() => {
      const id = pidRef.current;
      const P = store.PATIENTS[id] || {};
      const openCrisis = (S.alerts || []).some(
        (a: { id?: string; pid?: string; sev?: string }) =>
          a.sev === "crisis" && (a.pid === id || a.id === "a-" + id + "-crisis-btn"),
      );
      if (openCrisis || (pid === "diana" && S.diana?.crisis)) return false;
      // Reactivación tras inactividad o tras cerrar crisis en clínico.
      if (P.crisisBtnReady) return true;
      return !helpSent;
    })(),
    helpText: (() => {
      const id = pidRef.current;
      const P = store.PATIENTS[id] || {};
      const openCrisis = (S.alerts || []).some(
        (a: { id?: string; pid?: string; sev?: string }) =>
          a.sev === "crisis" && (a.pid === id || a.id === "a-" + id + "-crisis-btn"),
      );
      const blocked =
        (openCrisis || (pid === "diana" && S.diana?.crisis) || (helpSent && !P.crisisBtnReady));
      return blocked
        ? "Ya avisamos al equipo. Una persona la va a llamar en menos de 30 minutos. Si está en peligro ahora: llame al 123. Si necesita hablar con alguien: Línea 192, opción 4."
        : "Si está en peligro ahora: llame al 123. Si necesita hablar con alguien: Línea 192, opción 4. Al tocar «Estoy en crisis» avisamos al equipo para que la contacten.";
    })(),
    openHelp: () => {
      setHelp(true);
      const id = pidRef.current;
      const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
      const openCrisis = (store.get().alerts || []).some(
        (a: { id?: string; pid?: string; sev?: string }) =>
          a.sev === "crisis" && (a.pid === id || a.id === "a-" + id + "-crisis-btn"),
      );
      if (openCrisis || (pid === "diana" && store.get().diana?.crisis)) return;
      if (helpSent && !P.crisisBtnReady) return;
      setHelpSent(true);
      store.set((s: any) => {
        if (s.patients[id]) {
          s.patients[id].crisisBtnReady = false;
          s.patients[id].status = "Crisis";
          s.patients[id].signal = "Crisis";
        }
        const pe = (s.people || []).find((p: { id?: string }) => p.id === id);
        if (pe) pe.status = "Crisis";
      });
      store.addAlert({
        id: "a-" + id + "-crisis-btn-" + Date.now(),
        sev: "crisis",
        pid: id,
        name: P.name,
        age: P.age,
        place: (P.place || "").split(",")[0] || P.place,
        profile: P.profile || "P05",
        what: "Tocó «Estoy en crisis» en la app.",
        source: "Botón Estoy en crisis · app",
        phone: P.phone || "",
        expert: P.expert || undefined,
      });
      void Promise.all([
        fetch("/api/people", {
          credentials: "same-origin",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name: P.name, status: "Crisis" }),
        }),
        fetch("/api/patients", {
          credentials: "same-origin",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name: P.name, status: "Crisis", signal: "Crisis" }),
        }),
      ]).catch(() => {});
    },
    closeHelp: () => setHelp(false),
    askCall: () => {
      setHelpSent(true);
      const id = pidRef.current;
      const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
      store.set((s: any) => {
        if (s.patients[id]) {
          s.patients[id].crisisBtnReady = false;
          s.patients[id].status = "Crisis";
          s.patients[id].signal = "Crisis";
        }
        const pe = (s.people || []).find((p: { id?: string }) => p.id === id);
        if (pe) pe.status = "Crisis";
      });
      store.addAlert({
        id: "a-" + id + "-crisis-btn-" + Date.now(),
        sev: "crisis",
        pid: id,
        name: P.name,
        age: P.age,
        place: (P.place || "").split(",")[0] || P.place,
        profile: P.profile || "P05",
        what: "Tocó «Estoy en crisis» y pidió que la llamen ya.",
        source: "Botón Estoy en crisis · app",
        phone: P.phone || "",
        expert: P.expert || undefined,
      });
      void Promise.all([
        fetch("/api/people", {
          credentials: "same-origin",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name: P.name, status: "Crisis" }),
        }),
        fetch("/api/patients", {
          credentials: "same-origin",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name: P.name, status: "Crisis", signal: "Crisis" }),
        }),
      ]).catch(() => {});
    },
    dianaLines: ((DP.place || "").includes("Salento") ? rosaLines : dianaLines),
    rosaLines,
    waMapped,
    waQuick: waQuick.map((label) => ({ label, go: () => waAnswer(label) })),
    waInput,
    setWaInput,
    waSendText,
    waEmpty: !waInput.trim(),
    waHasText: !!waInput.trim(),
    onBreathDone,
  };
}
