"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { useNaraStore } from "@/providers/nara-provider";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function IngresoScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pass, setPass] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<false | true | "off">(false);
  const [taps, setTaps] = useState(0);
  const [panel, setPanel] = useState(false);
  const [done, setDone] = useState(false);
  const [dev, setDev] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDev(store.devMode());
  }, [store]);

  const accounts = store.get().accounts || [];
  const users = useMemo(() => {
    const extra = accounts
      .filter((a: { created?: boolean; role?: string }) => a.created && a.role === "Observador")
      .map((a: { id: string; name: string; orgType?: string }) => ({
        id: a.id,
        name: a.name,
        role: "Observador",
        terr: a.orgType || "Observador",
        href: "/observador",
      }));
    return store.USERS.concat(extra);
  }, [accounts, store]);

  const list = users.filter(
    (x: { name: string; role: string; terr: string }) =>
      !q.trim() ||
      normalize(`${x.name} ${x.role} ${x.terr}`).includes(normalize(q.trim())),
  );

  const pickU = (x: { id: string; name: string }) => {
    setSel(x.id);
    setQ(x.name);
    setPass("••••••••••");
    setOpen(false);
    setErr(false);
  };

  const selected =
    users.find((x: { id: string; name: string }) => x.id === sel && x.name === q) ||
    users.find((x: { name: string }) => normalize(x.name) === normalize(q.trim()));

  const enter = () => {
    if (!selected) {
      setErr(true);
      setOpen(false);
      return;
    }
    const ac = accounts.find(
      (a: { id: string; name: string }) => a.id === selected.id || a.name === selected.name,
    );
    if (ac && ac.status !== "Activo") {
      setErr("off");
      setOpen(false);
      return;
    }
    store.login(selected.id);
    router.push(selected.href);
  };

  const errMsg =
    err === "off"
      ? "Esta cuenta está desactivada. Hable con la administradora del programa."
      : err
        ? "Elija su usuario de la lista."
        : "";

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
      <NaraMsgAlert msg={errMsg} onClear={() => setErr(false)} />
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
            <span style={{ fontWeight: 500 }}>Usuario</span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSel(null);
                setOpen(true);
                setErr(false);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && open && list.length) pickU(list[0]);
                if (e.key === "Escape") setOpen(false);
              }}
              autoComplete="off"
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
            {open && list.length > 0 ? (
              <div
                style={{
                  position: "absolute",
                  top: 84,
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #DCD6CD",
                  borderRadius: 12,
                  boxShadow: "0 12px 30px rgba(22,20,19,.15)",
                  zIndex: 10,
                  maxHeight: 380,
                  overflow: "auto",
                  padding: 6,
                }}
              >
                {list.map((u: { id: string; name: string; role: string; terr: string }) => (
                  <button
                    key={u.id + u.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickU(u);
                    }}
                    style={{
                      fontFamily: "Figtree, system-ui, sans-serif",
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: u.id === sel ? "#FFF4CC" : "#fff",
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      color: "#161413",
                      whiteSpace: "normal",
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{u.name}</span>
                    <span style={{ fontSize: 13, color: "#5E5750" }}>
                      {u.role} · {u.terr}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500 }}>
            Contraseña
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onFocus={() => setOpen(false)}
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
            onClick={enter}
            style={{
              fontFamily: "Figtree, system-ui, sans-serif",
              fontSize: 17,
              fontWeight: 500,
              height: 54,
              borderRadius: 14,
              border: "none",
              background: "#FDCD22",
              color: "#161413",
              cursor: "pointer",
            }}
          >
            Ingresar
          </button>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ alignSelf: "center", fontSize: 14, color: "#161413", textDecoration: "none" }}
          >
            ¿Olvidó su contraseña?
          </a>
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
