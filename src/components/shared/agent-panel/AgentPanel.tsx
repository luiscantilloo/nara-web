"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  createElement,
} from "react";
import { IoClose } from "react-icons/io5";
import { naraAlert } from "@/components/shared/nara-alert/naraAlert";
import { useNaraStore } from "@/providers/nara-provider";

const CTX: Record<string, string[]> = {
  terr: ["a15", "a16", "a17", "a21", "a1", "a6", "a4"],
  team: ["a11", "a12", "a13", "a2", "a8"],
  assets: ["a3"],
  paths: ["a19", "a20", "a14", "a9", "a4"],
  users: ["a9"],
  reports: ["a10", "a1"],
  people: ["a4"],
  alerts: ["c1", "c2"],
  patients: ["c6", "c7", "c2", "c3", "c4"],
  file: ["c1", "c7", "c5"],
  avance: ["f1"],
  rec: ["f2"],
  res: ["f9", "f3", "i1", "i2"],
  datos: ["i2", "i1"],
  casos: ["n2", "n1"],
};

const SHARE: Record<string, string> = { admin: "pdf", clin: "team" };

type Props = {
  role?: string;
  mode?: "home" | "drawer";
  context?: string;
  contextLabel?: string;
  initialAsk?: string;
  onAction?: (action: string, payload: unknown) => void;
  onOpenDrawer?: (q: string) => void;
  onClose?: () => void;
  style?: CSSProperties;
};

type ConvItem = Record<string, unknown> & { id: string; q: string };

export function AgentPanel({
  role = "admin",
  mode = "home",
  context = "",
  contextLabel = "",
  initialAsk = "",
  onAction,
  onOpenDrawer,
  onClose,
  style,
}: Props) {
  const store = useNaraStore();
  const [conv, setConv] = useState<ConvItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<Record<string, boolean>>({});
  const [sug, setSug] = useState<Record<string, string>>({});
  const [shareOpen, setShareOpen] = useState<Record<string, boolean>>({});
  const [more, setMore] = useState(false);
  const [ready, setReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const askedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await import("@/lib/agent/agent.js");
      await import("@/lib/agent/agent-chart.js");
      if (cancelled || typeof window === "undefined") return;
      const mk = (window as unknown as { makeAlientoChart?: (r: typeof React) => unknown }).makeAlientoChart;
      if (mk) ChartRef.current = mk(React);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "drawer") return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [mode, onClose]);

  useEffect(() => {
    if (mode === "drawer" && initialAsk && ready && !askedRef.current) {
      askedRef.current = true;
      void ask(initialAsk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAsk, mode, ready]);

  useEffect(() => {
    if (mode === "drawer" && scrollRef.current) scrollRef.current.scrollTop = 1e6;
  }, [conv.length, mode]);

  const ask = async (text: string) => {
    if (!text.trim() || loading) return;
    if (mode !== "drawer" && onOpenDrawer) {
      setInput("");
      onOpenDrawer(text);
      return;
    }
    setInput("");
    setLoading(true);
    const G = (window as unknown as { AlientoAgent?: { ask: (r: string, t: string) => Promise<ConvItem> } }).AlientoAgent;
    let a: ConvItem;
    try {
      a = (await G?.ask(role, text)) as ConvItem;
      if (!a) throw new Error("vacía");
      // Si no hay consulta fija, TEO pregunta a Gemini con contexto de la app/datos
      if (a.none) {
        try {
          const res = await fetch("/api/teo/ask", {
            method: "POST",
            credentials: "same-origin",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ question: text, role }),
          });
          const data = (await res.json()) as { ok?: boolean; text?: string; error?: string };
          if (data.ok && data.text) {
            a = {
              id: "q" + Date.now(),
              q: text,
              text: data.text,
              basis: "TEO · Gemini + datos del programa",
              method: "Respuesta generada con Gemini a partir del contexto autorizado para su rol.",
              none: false,
            };
          } else if (data.error || data.text) {
            a = {
              id: "q" + Date.now(),
              q: text,
              text: data.text || data.error || "No pude consultar a Gemini. Intente de nuevo en unos segundos.",
              basis: "TEO · Gemini",
              none: false,
            };
          }
        } catch {
          /* deja la respuesta none del motor local */
        }
      }
    } catch {
      a = { id: "q" + Date.now(), q: text, err: true, text: "No pude consultar los datos en este momento. Revise la conexión e intente de nuevo." };
    }
    a.id = "q" + Date.now();
    setConv((s) => [...s, a]);
    setLoading(false);
  };

  const act = (action: string, payload: unknown) => onAction?.(action, payload);

  if (!ready || !ChartRef.current) {
    return <div style={{ ...style, minHeight: 120 }} />;
  }

  const G = (window as unknown as { AlientoAgent: typeof import("@/lib/agent/agent.js") extends infer T ? T : never }).AlientoAgent;
  const S = store.get();
  const R = G.ROLE[role.split(":")[0] as keyof typeof G.ROLE];
  const L = G.list(role) || [];
  const pref = CTX[context] || [];
  const allChips = L.slice()
    .sort((x, y) => Number(pref.indexOf(y.id) > -1) - Number(pref.indexOf(x.id) > -1))
    .map((x) => ({ q: x.q, go: () => void ask(x.q) }));
  const ctxList = pref
    .map((id) => L.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => ({ q: x!.q, go: () => void ask(x!.q) }));
  const genList = allChips.filter((c) => !ctxList.find((x) => x.q === c.q));
  const chips =
    mode === "drawer" && ctxList.length
      ? more
        ? genList
        : genList.slice(0, 3)
      : more
        ? allChips
        : allChips.slice(0, 4);
  const pins = (S.pins[role] || []) as string[];
  const mk = (spec: unknown, key: string) => createElement(ChartRef.current, { spec, key });
  const spark = (v: number[]) =>
    v.map((x, i) => `${(4 + (i * 72) / Math.max(1, v.length - 1)).toFixed(1)},${(24 - (x / 27) * 22).toFixed(1)}`).join(" ");

  const convUi = conv.map((a) => {
    const id = a.id;
    const pinned = pins.includes(a.qid as string);
    const sg = sug[id];
    const buttons: { label: string; go: () => void; bd?: string; bg?: string; fg?: string }[] = [];
    if (!a.none && !a.err) {
      if (a.detail) buttons.push({ label: "Ver detalle", go: () => act("detail", a.detail) });
      ((a.extra as { label: string; action: string }[]) || []).forEach((e) =>
        buttons.push({
          label: e.label,
          go: () => {
            act(e.action, a);
            if (e.action === "add-board") void naraAlert("Agregado al informe mensual.");
          },
        }),
      );
      if (a.report !== false)
        buttons.push({
          label: "Convertir en informe",
          go: () => {
            const rid = "r" + Date.now();
            store.set((s: { reports: Record<string, unknown> }) => {
              s.reports[rid] = { type: "answer", role, qid: a.qid, q: a.q, at: Date.now() };
            });
            act("report", rid);
          },
        });
      if (a.qid)
        buttons.push({
          label: pinned ? "Fijada ✓" : "Fijar",
          go: () => {
            store.set((s: { pins: Record<string, string[]> }) => {
              const p = (s.pins[role] = s.pins[role] || []);
              const i = p.indexOf(a.qid as string);
              if (i > -1) p.splice(i, 1);
              else p.push(a.qid as string);
            });
            void naraAlert(pinned ? "Quitada de su inicio." : "Fijada en su inicio.");
          },
        });
      if (SHARE[role.split(":")[0]] === "pdf")
        buttons.push({ label: "Compartir · Descargar PDF", go: () => buttons.find((b) => b.label === "Convertir en informe")?.go() });
      if (SHARE[role.split(":")[0]] === "team")
        buttons.push({ label: "Compartir", go: () => setShareOpen((o) => ({ ...o, [id]: !o[id] })) });
    }
    buttons.forEach((b) => {
      const prim = b.label === "Ver detalle" || b.label === "Preparar sesión";
      b.bd = "#161413";
      b.bg = prim ? "#161413" : "#fff";
      b.fg = prim ? "#fff" : "#161413";
    });
    const shareTo = ["Otro clínico del equipo", "Líder clínica"].map((label) => ({
      label,
      go: () => {
        setShareOpen((o) => ({ ...o, [id]: false }));
        void naraAlert("Compartido con: " + label.toLowerCase() + ". Queda registrado.");
      },
    }));
    return { a, id, sg, buttons, shareTo, pinned };
  });

  const pinList =
    mode === "home"
      ? pins
          .map((qid) => {
            const a = G.runById(role, qid);
            if (!a) return null;
            return {
              q: a.q,
              text: a.text || (a.lines || [])[0],
              basis: a.basis,
              chart: a.charts?.[0] ? mk(a.charts[a.charts.length - 1], "pin" + qid) : null,
              unpin: () =>
                store.set((s: { pins: Record<string, string[]> }) => {
                  s.pins[role] = s.pins[role].filter((x) => x !== qid);
                }),
            };
          })
          .filter(Boolean)
      : [];

  let brief: {
    text: string;
    dots: { bg: string }[];
    dotsLabel: string;
    revisits: unknown[];
    crisis: unknown[];
    basis: string;
  } | null = null;
  if (role.indexOf("expert") === 0 && mode === "home") {
    const ex = role.split(":")[1];
    const b = G.briefing(ex!, S);
    const ok = b.dots.filter((d: { ok: boolean }) => d.ok).length;
    brief = {
      text: b.text,
      dots: b.dots.map((d: { ok: boolean }) => ({ bg: d.ok ? "#161413" : "#fff" })),
      dotsLabel: ok + " de " + b.dots.length + " hechas",
      revisits: b.revisits,
      crisis: b.crisis,
      basis: ex === "andres" ? "Con los datos de la última sincronización · hoy 7:05" : "Datos al momento",
    };
  }

  const sessionUser = store.session() as { name?: string } | null;
  const greetName = (() => {
    const full = String(sessionUser?.name || "").trim();
    if (!full) return "";
    // Conserva título profesional + primer nombre (p. ej. "Dra. Lucía"); si no, el primer nombre del login.
    const withTitle = full.match(/^(Dra?\.)\s+(\S+)/i);
    if (withTitle) return `${withTitle[1]} ${withTitle[2]}`;
    return full.split(/\s+/)[0] || "";
  })();
  const greetHour = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  })();
  const greetLine = greetName ? `${greetHour}, ${greetName}.` : `${greetHour}.`;
  const bg = mode === "drawer" ? "#F0ECE6" : "transparent";
  const pad = mode === "drawer" ? "16px 18px" : "0";

  return (
    <div
      style={{
        fontFamily: "Figtree, system-ui, sans-serif",
        color: "#161413",
        fontSize: 15,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: bg,
        ...style,
      }}
    >
      {mode === "drawer" ? (
        <div
          className="box-border flex h-16 shrink-0 items-center justify-between border-b border-linea bg-nara-blanco px-5"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <img src="/nara/marca/logo/teo-isotipo.svg" alt="" style={{ width: 34, height: 34, display: "block", flex: "none" }} />
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.2 }}>{R.name}</span>
              <span style={{ fontSize: 13, color: "#5E5750", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {contextLabel || "Pregunte sobre lo que ve en pantalla"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Cerrar"
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-linea bg-nara-blanco text-nara-tinta"
          >
            <IoClose size={22} aria-hidden />
          </button>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: pad,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {mode === "home" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/nara/marca/logo/teo-isotipo.svg" alt="" style={{ width: 40, height: 40, display: "block" }} />
              <span style={{ fontSize: 14, color: "#5E5750", fontWeight: 500 }}>{R.name}</span>
            </div>
            <span
              style={{
                fontFamily: "Fredoka, Figtree, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(22px, 4vw, 30px)",
                lineHeight: 1.2,
              }}
            >
              {greetLine}
            </span>
            <span
              style={{
                fontSize: 16,
                color: "#5E5750",
                maxWidth: 760,
                textWrap: "pretty" as const,
                overflowWrap: "anywhere",
              }}
            >
              {R.sub}
            </span>
          </div>
        ) : null}

        {brief ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #DCD6CD",
              borderRadius: 20,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1.5 }}>{brief.text}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {brief.dots.map((d, i) => (
                <span
                  key={i}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: d.bg,
                    border: "2px solid #161413",
                    boxSizing: "border-box",
                  }}
                />
              ))}
              <span style={{ fontSize: 14, color: "#5E5750", marginLeft: 6 }}>{brief.dotsLabel}</span>
            </div>
            <span style={{ fontSize: 13, color: "#5E5750" }}>{brief.basis}</span>
          </div>
        ) : null}

        {mode === "drawer" && ctxList.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#5E5750" }}>{contextLabel}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ctxList.map((c, i) => (
                <button key={i} type="button" onClick={c.go} style={chipStyle}>
                  {c.q}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#5E5750", marginTop: 4 }}>Otras preguntas</span>
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minWidth: 0, width: "100%" }}>
          {chips.map((c, i) => (
            <button key={i} type="button" onClick={c.go} style={{ ...chipStyle, background: "#fff" }}>
              {c.q}
            </button>
          ))}
          {(mode === "drawer" && ctxList.length ? genList.length > 3 : allChips.length > 4) ? (
            <button type="button" onClick={() => setMore(!more)} style={moreBtnStyle}>
              {more ? "Menos preguntas" : "Ver todas las preguntas"}
            </button>
          ) : null}
        </div>

        {convUi.map(({ a, id, sg, buttons, shareTo, pinned }) => (
          <div key={id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "80%",
                background: "#FFF4CC",
                borderRadius: "14px 4px 14px 14px",
                padding: "10px 14px",
                fontSize: 15,
              }}
            >
              {a.q as string}
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #DCD6CD",
                borderRadius: 20,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {a.understood ? (
                <span style={{ fontSize: 13, color: "#5E5750" }}>{a.understood as string}</span>
              ) : null}
              {a.text ? (
                <span style={{ fontSize: 16, lineHeight: 1.5, textWrap: "pretty" as const }}>{a.text as string}</span>
              ) : null}
              {((a.lines as string[]) || []).map((l, i) => (
                <span key={i} style={{ fontSize: 15, lineHeight: 1.45, display: "flex", gap: 8 }}>
                  <span style={{ color: "#161413" }}>•</span>
                  {l}
                </span>
              ))}
              {a.aiNote ? (
                <div
                  style={{
                    background: "#D8FBE3",
                    border: "1.5px dashed #3FEA73",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 15,
                    lineHeight: 1.45,
                  }}
                >
                  {a.aiNote as string}
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {buttons.map((b, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={b.go}
                    style={{
                      fontFamily: "Figtree, system-ui, sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      height: 38,
                      padding: "0 14px",
                      borderRadius: 9,
                      border: `1.5px solid ${b.bd}`,
                      background: b.bg,
                      color: b.fg,
                      cursor: "pointer",
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {shareOpen[id] ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", background: "#F0ECE6", borderRadius: 10, padding: 10 }}>
                  <span style={{ fontSize: 14, alignSelf: "center" }}>Compartir con:</span>
                  {shareTo.map((s, i) => (
                    <button key={i} type="button" onClick={s.go} style={shareBtnStyle}>
                      {s.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {loading ? <span style={{ fontSize: 15, color: "#5E5750" }}>Consultando los datos del programa…</span> : null}

        {pinList.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontFamily: "Fredoka, Figtree, system-ui, sans-serif", fontWeight: 600, fontSize: 20 }}>
              Respuestas fijadas
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 12 }}>
              {pinList.map((p, i) =>
                p ? (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid #DCD6CD",
                      borderRadius: 20,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontWeight: 500 }}>{p.q}</span>
                      <button type="button" onClick={p.unpin} style={moreBtnStyle}>
                        Quitar
                      </button>
                    </div>
                    <span style={{ fontSize: 14, lineHeight: 1.45 }}>{p.text}</span>
                    {p.chart}
                    <span style={{ fontSize: 12, color: "#5E5750" }}>{p.basis} · se actualiza con los datos</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-linea bg-nara-blanco p-3 sm:flex-row sm:items-center sm:gap-2 sm:px-4 sm:py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") void ask(input);
          }}
          placeholder={role === "inst" ? "Pregunte sobre sus casos remitidos" : "Escriba su pregunta"}
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            height: 46,
            borderRadius: 10,
            border: "1.5px solid #DCD6CD",
            padding: "0 14px",
            fontSize: 15,
            fontFamily: "Figtree, system-ui, sans-serif",
            color: "#161413",
          }}
        />
        <button
          type="button"
          onClick={() => void ask(input)}
          className="w-full shrink-0 sm:w-auto"
          style={sendBtnStyle}
        >
          Preguntar
        </button>
      </div>
    </div>
  );
}

const chipStyle: CSSProperties = {
  fontFamily: "Figtree, system-ui, sans-serif",
  fontSize: 15,
  padding: "9px 14px",
  borderRadius: 999,
  border: "1.5px solid #161413",
  background: "#FFF4CC",
  color: "#161413",
  cursor: "pointer",
  textAlign: "left",
  whiteSpace: "normal",
  lineHeight: 1.3,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflowWrap: "anywhere",
};

const moreBtnStyle: CSSProperties = {
  fontFamily: "Figtree, system-ui, sans-serif",
  fontSize: 14,
  padding: "9px 12px",
  border: "none",
  background: "none",
  color: "#161413",
  cursor: "pointer",
  textDecoration: "underline",
};

const shareBtnStyle: CSSProperties = {
  fontFamily: "Figtree, system-ui, sans-serif",
  fontSize: 14,
  height: 36,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #DCD6CD",
  background: "#fff",
  cursor: "pointer",
};

const sendBtnStyle: CSSProperties = {
  fontFamily: "Figtree, system-ui, sans-serif",
  fontSize: 15,
  fontWeight: 500,
  height: 46,
  padding: "0 18px",
  borderRadius: 14,
  border: "none",
  background: "#FDCD22",
  color: "#161413",
  cursor: "pointer",
};
