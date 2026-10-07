"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { applySessionUser } from "@/lib/auth/applySessionUser";
import { useNaraStore } from "@/providers/nara-provider";

type LoginUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  terr: string;
  org: string;
  contact: string;
  status: string;
  href: string;
  nk: string | null;
};

export function IngresoScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [taps, setTaps] = useState(0);
  const [panel, setPanel] = useState(false);
  const [done, setDone] = useState(false);
  const [dev, setDev] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDev(store.devMode());
  }, [store]);

  const enter = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; user?: LoginUser };
      if (!res.ok || !data.ok || !data.user) {
        setErr(data.error || "No se pudo ingresar.");
        return;
      }
      applySessionUser(data.user);
      router.push(data.user.href || "/inicio");
    } catch {
      setErr("No se pudo conectar. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-screen-label="Ingresar"
      style={{
        minHeight: "100vh",
        fontFamily: "Figtree, system-ui, sans-serif",
        color: "#161413",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        boxSizing: "border-box",
        gap: 24,
        background: "#F0ECE6",
      }}
    >
      <NaraMsgAlert msg={err} onClear={() => setErr("")} />
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div
            onClick={() => {
              if (tapTimer.current) clearTimeout(tapTimer.current);
              const n = taps + 1;
              if (n >= 5) {
                setTaps(0);
                setPanel((p) => !p);
                setDone(false);
              } else {
                setTaps(n);
                tapTimer.current = setTimeout(() => setTaps(0), 1500);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#161413",
              cursor: "default",
              userSelect: "none",
            }}
          >
            <img
              src="/nara/marca/logo/nara-logo.svg"
              alt="NARA"
              style={{ height: 64, width: "auto", display: "block" }}
            />
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #DCD6CD",
            borderRadius: 20,
            padding: "26px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500 }}>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr("");
              }}
              autoComplete="username"
              placeholder="correo@nara.com"
              style={{
                height: 52,
                borderRadius: 10,
                border: `1.5px solid ${err ? "#D9692B" : "#DCD6CD"}`,
                padding: "0 14px",
                fontSize: 16,
                color: "#161413",
                background: "#fff",
                fontFamily: "Figtree, system-ui, sans-serif",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500 }}>
            Contraseña
            <input
              type="password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setErr("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) void enter();
              }}
              autoComplete="current-password"
              style={{
                height: 52,
                borderRadius: 10,
                border: "1.5px solid #DCD6CD",
                padding: "0 14px",
                fontSize: 16,
                background: "#fff",
                color: "#161413",
                fontFamily: "Figtree, system-ui, sans-serif",
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => void enter()}
            disabled={loading}
            style={{
              fontFamily: "Figtree, system-ui, sans-serif",
              fontSize: 17,
              fontWeight: 500,
              height: 54,
              borderRadius: 14,
              border: "none",
              background: "#FDCD22",
              color: "#161413",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
          <button
            type="button"
            onClick={() =>
              setErr("Para restablecer su acceso, escriba al administrador del programa NARA.")
            }
            style={{
              alignSelf: "center",
              fontSize: 14,
              color: "#161413",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            ¿Olvidó su contraseña?
          </button>
        </div>

        {panel ? (
          <div
            style={{
              alignSelf: "center",
              background: "#fff",
              border: "1px solid #DCD6CD",
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minWidth: 240,
              fontSize: 14,
            }}
          >
            <button
              type="button"
              onClick={() => {
                store.reset();
                setDone(true);
              }}
              style={{
                fontFamily: "Figtree, system-ui, sans-serif",
                textAlign: "left",
                fontSize: 14,
                border: "none",
                background: "none",
                color: "#161413",
                cursor: "pointer",
                padding: "8px 4px",
              }}
            >
              Reiniciar datos
            </button>
            <div
              onClick={() => {
                store.setDevMode(!dev);
                setDev(!dev);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                padding: "8px 4px",
              }}
            >
              <span>Modo desarrollador</span>
              <span
                style={{
                  width: 40,
                  height: 24,
                  borderRadius: 12,
                  background: dev ? "#161413" : "#C4BDB3",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: dev ? 19 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    background: "#fff",
                  }}
                />
              </span>
            </div>
            {done ? (
              <span style={{ color: "#161413", fontWeight: 500, padding: "0 4px 4px" }}>
                Datos reiniciados
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
