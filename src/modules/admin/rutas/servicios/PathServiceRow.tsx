"use client";

import { ix } from "@/modules/admin/screens/inlineStyle";
import type { PathServiceRowModel } from "./types";

/** Fila de un interruptor en Rutas. Shell compartido; el contenido viene del modelo. */
export function PathServiceRow({ s }: { s: PathServiceRowModel }) {
  const locked = !!s.locked;
  return (
    <div
      style={ix`display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:10px 0;border-top:1px solid #E6E1D9;opacity:${s.op}`}
      title={s.lockHint || undefined}
    >
      <div
        role="switch"
        aria-checked={s.x === "25px"}
        aria-disabled={locked || undefined}
        onClick={() => {
          if (!locked) s.toggle();
        }}
        style={ix`flex:none;width:52px;height:30px;border-radius:15px;background:${s.swBg};position:relative;cursor:${s.cur};pointer-events:${locked ? "none" : "auto"}`}
      >
        <div
          style={ix`position:absolute;top:3px;left:${s.x};width:24px;height:24px;border-radius:12px;background:#fff`}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: "1 1 140px",
          minWidth: 0,
        }}
      >
        <span style={{ fontWeight: 500 }}>
          {s.name}
          {locked ? (
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                fontWeight: 500,
                color: "#8C857C",
              }}
            >
              Próximamente
            </span>
          ) : null}
        </span>
        <span style={{ fontSize: 13, color: "#5E5750" }}>{s.note}</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          flex: "1 1 200px",
        }}
      >
        {s.freqs?.map((q) => (
          <button
            key={q.label}
            type="button"
            disabled={locked}
            onClick={() => q.pick()}
            style={ix`font-family:Figtree,system-ui,sans-serif;font-size:14px;height:38px;padding:0 12px;border-radius:8px;border:1.5px solid ${q.bd};background:${q.bg};color:${q.fg};cursor:${locked ? "not-allowed" : "pointer"};opacity:${locked ? 0.5 : 1}`}
          >
            {q.label}
          </button>
        ))}
        {s.libBtn ? (
          <button
            type="button"
            onClick={() => s.libBtn!.go()}
            style={ix`font-family:Figtree,system-ui,sans-serif;font-size:14px;font-weight:500;height:38px;padding:0 14px;border-radius:8px;border:1.5px solid #161413;background:#FDCD22;color:#161413;cursor:pointer`}
          >
            {s.libBtn.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
