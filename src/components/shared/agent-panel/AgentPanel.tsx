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
import { TeoRichText } from "./TeoRichText";
import { pickTeoSuggestions } from "./teoSuggestions";

const SHARE: Record<string, string> = { clin: "team" };

type Props = {
  role?: string;
  mode?: "home" | "drawer";
  /** true cuando el drawer de TEO está abierto — rota sugerencias al abrir */
  open?: boolean;
  /** @deprecated Las sugerencias ya no dependen del contexto de pantalla */
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
  open = true,
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
  const [shareOpen, setShareOpen] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [suggestQs, setSuggestQs] = useState<string[]>(() => pickTeoSuggestions(role));
  const scrollRef = useRef<HTMLDivElement>(null);
  const askedRef = useRef(false);
  const wasOpenRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartRef = useRef<any>(null);

  useEffect(() => {
    if (mode !== "drawer") return;
    if (open && !wasOpenRef.current) {
      setSuggestQs(pickTeoSuggestions(role));
    }
    wasOpenRef.current = open;
  }, [open, mode, role]);

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
  }, [conv.length, mode, loading]);

  const ask = async (text: string) => {
    if (!text.trim() || loading) return;
    if (mode !== "drawer" && onOpenDrawer) {
      setInput("");
      onOpenDrawer(text);
      return;
    }
    const id = "q" + Date.now();
    setInput("");
    setConv((s) => [...s, { id, q: text }]);
    setLoading(true);
    let a: ConvItem;
    try {
      const res = await fetch("/api/teo/ask", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, role }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        text?: string;
        error?: string;
        message?: string;
        model?: string;
        provider?: string;
      };
      if (data.ok && data.text) {
        a = {
          id,
          q: text,
          text: data.text,
          basis: `TEO · ${data.provider || "openai"} (${data.model || "gpt-6-luna"})`,
          method: "Respuesta generada con el modelo a partir del contexto autorizado del programa.",
          none: false,
        };
      } else {
        a = {
          id,
          q: text,
          err: true,
          text:
            data.text ||
            data.error ||
            data.message ||
            "TEO no respondió. Compruebe que nara-api (gateway :4000 y ai :4004) esté en marcha.",
        };
      }
    } catch {
      a = {
        id,
        q: text,
        err: true,
        text: "No pude contactar a TEO. Revise la conexión con nara-api e intente de nuevo.",
      };
    }
    setConv((s) => s.map((x) => (x.id === id ? a : x)));
    setLoading(false);
  };

  const act = (action: string, payload: unknown) => onAction?.(action, payload);

  if (!ready || !ChartRef.current) {
    return <div style={{ ...style, minHeight: 120 }} />;
  }

  const G = (window as unknown as { AlientoAgent: typeof import("@/lib/agent/agent.js") extends infer T ? T : never }).AlientoAgent;
  const S = store.get();
  const R = G.ROLE[role.split(":")[0] as keyof typeof G.ROLE];
  const chips = suggestQs.map((q) => ({ q, go: () => void ask(q) }));
  const pins = (S.pins[role] || []) as string[];
  const mk = (spec: unknown, key: string) => createElement(ChartRef.current, { spec, key });

  const convUi = conv.map((a) => {
    const id = a.id;
    const pinned = pins.includes(a.qid as string);
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
    return { a, id, buttons, shareTo };
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

        {mode === "drawer" ? (
          <div className="flex w-full min-w-0 flex-col gap-2">
            {contextLabel ? (
              <span className="text-[13px] font-medium text-[#5E5750]">{contextLabel}</span>
            ) : null}
            <div className="flex w-full min-w-0 flex-wrap gap-2">
              {chips.map((c, i) => (
                <button key={`${c.q}-${i}`} type="button" onClick={c.go} style={{ ...chipStyle, background: "#fff" }}>
                  {c.q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {convUi.map(({ a, id, buttons, shareTo }) => (
          <div key={id} className="flex flex-col gap-2.5">
            <div className="max-w-[80%] self-end rounded-[14px_4px_14px_14px] bg-[#FFF4CC] px-3.5 py-2.5 text-[15px]">
              {a.q as string}
            </div>
            {a.text || a.err || a.lines || a.aiNote || a.understood ? (
              <div className="flex items-start gap-2.5">
                <img
                  src="/nara/marca/logo/teo-isotipo.svg"
                  alt="TEO"
                  className="mt-0.5 h-8 w-8 shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-[4px_20px_20px_20px] border border-linea bg-nara-blanco px-[18px] py-4">
                  {a.understood ? (
                    <span className="text-[13px] text-[#5E5750]">{a.understood as string}</span>
                  ) : null}
                  {a.text ? <TeoRichText text={String(a.text)} /> : null}
                  {((a.lines as string[]) || []).map((l, i) => (
                    <span key={i} className="flex gap-2 text-[15px] leading-[1.45]">
                      <span className="text-nara-tinta">•</span>
                      {l}
                    </span>
                  ))}
                  {a.aiNote ? (
                    <div className="rounded-[10px] border-[1.5px] border-dashed border-nara-curiosidad bg-[#D8FBE3] px-3 py-2.5 text-[15px] leading-[1.45]">
                      {a.aiNote as string}
                    </div>
                  ) : null}
                  {buttons.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {buttons.map((b, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={b.go}
                          className="h-[38px] cursor-pointer rounded-[9px] border-[1.5px] px-3.5 font-texto text-sm font-medium"
                          style={{
                            borderColor: b.bd,
                            background: b.bg,
                            color: b.fg,
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {shareOpen[id] ? (
                    <div className="flex flex-wrap gap-2 rounded-[10px] bg-nara-crema p-2.5">
                      <span className="self-center text-sm">Compartir con:</span>
                      {shareTo.map((s, i) => (
                        <button key={i} type="button" onClick={s.go} style={shareBtnStyle}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="flex items-start gap-2.5" aria-live="polite" aria-label="TEO está pensando">
            <img
              src="/nara/marca/logo/teo-isotipo.svg"
              alt=""
              className="mt-0.5 h-8 w-8 shrink-0"
            />
            <div className="flex items-center gap-2.5 rounded-[4px_20px_20px_20px] border border-linea bg-nara-blanco px-4 py-3">
              <span className="text-[15px] text-[#5E5750]">Pensando</span>
              <span className="flex items-center gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nara-tinta [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nara-tinta [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nara-tinta [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        ) : null}

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

      {mode === "drawer" ? (
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
      ) : null}
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
