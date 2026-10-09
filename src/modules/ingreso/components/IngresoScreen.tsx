"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { applySessionUser } from "@/lib/auth/applySessionUser";
import { apiJson } from "@/lib/api/client";
import { hydrateProgramData } from "@/lib/store/hydrateProgram";
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

type Mode = "login" | "verify" | "reset";

const inputClass =
  "h-[52px] rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3.5 font-texto text-base text-nara-tinta";
const labelClass = "flex flex-col gap-1.5 font-medium text-nara-tinta";
const primaryBtnClass =
  "h-[54px] w-full cursor-pointer rounded-[14px] border-none bg-nara-amarillo font-texto text-[17px] font-medium text-nara-tinta disabled:cursor-wait disabled:opacity-70";
const linkBtnClass =
  "cursor-pointer self-center border-none bg-transparent p-0 font-texto text-sm text-nara-tinta underline";

export function IngresoScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [taps, setTaps] = useState(0);
  const [panel, setPanel] = useState(false);
  const [done, setDone] = useState(false);
  const [dev, setDev] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDev(store.devMode());
  }, [store]);

  const goLogin = () => {
    setMode("login");
    setFirstName("");
    setLastName("");
    setResetToken("");
    setNewPass("");
    setNewPass2("");
    setErr("");
  };

  const enter = async () => {
    setErr("");
    setOkMsg("");
    setLoading(true);
    try {
      const { res, data } = await apiJson<{ ok?: boolean; error?: string; user?: LoginUser }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password: pass }),
        },
      );
      if (!res.ok || !data.ok || !data.user) {
        setErr(data.error || "No se pudo ingresar.");
        return;
      }
      applySessionUser(data.user);
      await hydrateProgramData(store, { force: true });
      router.push(data.user.href || "/inicio");
    } catch {
      setErr("No se pudo conectar. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const verifyIdentity = async () => {
    setErr("");
    setOkMsg("");
    setLoading(true);
    try {
      const { res, data } = await apiJson<{
        ok?: boolean;
        error?: string;
        resetToken?: string;
        email?: string;
      }>("/api/auth/verify-identity", {
        method: "POST",
        body: JSON.stringify({ email, firstName, lastName }),
      });
      if (!res.ok || !data.ok || !data.resetToken) {
        setErr(data.error || "No pudimos verificar su identidad. Revise correo y nombre.");
        return;
      }
      setResetToken(data.resetToken);
      if (data.email) setEmail(data.email);
      setMode("reset");
    } catch {
      setErr("No se pudo conectar. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    setErr("");
    setOkMsg("");
    if (newPass !== newPass2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    if (newPass.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { res, data } = await apiJson<{ ok?: boolean; error?: string; message?: string }>(
        "/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({ email, resetToken, password: newPass }),
        },
      );
      if (!res.ok || !data.ok) {
        setErr(data.error || "No se pudo cambiar la contraseña.");
        if (res.status === 401) {
          setMode("verify");
          setResetToken("");
          setNewPass("");
          setNewPass2("");
        }
        return;
      }
      setPass("");
      setOkMsg(data.message || "Contraseña actualizada. Ya puede ingresar.");
      goLogin();
    } catch {
      setErr("No se pudo conectar. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-screen-label="Ingresar"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
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
      className="box-border flex min-h-screen flex-col items-center justify-center gap-6 bg-nara-crema px-5 py-8 font-texto text-nara-tinta"
    >
      <NaraMsgAlert msg={err} onClear={() => setErr("")} />
      <NaraMsgAlert msg={okMsg} onClear={() => setOkMsg("")} />
      <div className="flex w-full max-w-[420px] flex-col gap-7">
        <div className="flex flex-col items-center gap-2.5">
          <Link
            href="/landing"
            aria-label="NARA, ir al inicio"
            className="flex items-center gap-3 text-nara-tinta"
          >
            <img
              src="/nara/marca/logo/nara-logo.svg"
              alt="NARA"
              className="block h-16 w-auto"
            />
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-[20px] border border-linea bg-nara-blanco px-6 py-[26px]">
          {mode === "login" ? (
            <>
              <label className={labelClass}>
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
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
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
                  className={inputClass}
                />
              </label>

              <button
                type="button"
                onClick={() => void enter()}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Ingresando…" : "Ingresar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setErr("");
                  setOkMsg("");
                  setMode("verify");
                }}
                className={linkBtnClass}
              >
                ¿Olvidó su contraseña?
              </button>
            </>
          ) : null}

          {mode === "verify" ? (
            <>
              <p className="text-[15px] leading-relaxed text-texto-secundario">
                Confirme su correo y el nombre registrado en su cuenta para continuar.
              </p>
              <label className={labelClass}>
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
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Primer nombre
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setErr("");
                  }}
                  autoComplete="given-name"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Primer apellido
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErr("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) void verifyIdentity();
                  }}
                  autoComplete="family-name"
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() => void verifyIdentity()}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Verificando…" : "Continuar"}
              </button>
              <button type="button" onClick={goLogin} className={linkBtnClass}>
                Volver a ingresar
              </button>
            </>
          ) : null}

          {mode === "reset" ? (
            <>
              <p className="text-[15px] leading-relaxed text-texto-secundario">
                Identidad verificada. Defina su nueva contraseña.
              </p>
              <label className={labelClass}>
                Nueva contraseña
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => {
                    setNewPass(e.target.value);
                    setErr("");
                  }}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Confirmar contraseña
                <input
                  type="password"
                  value={newPass2}
                  onChange={(e) => {
                    setNewPass2(e.target.value);
                    setErr("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) void changePassword();
                  }}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() => void changePassword()}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Guardando…" : "Cambiar contraseña"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("verify");
                  setResetToken("");
                  setNewPass("");
                  setNewPass2("");
                  setErr("");
                }}
                className={linkBtnClass}
              >
                Volver
              </button>
            </>
          ) : null}
        </div>

        {panel ? (
          <div className="flex min-w-60 flex-col gap-1.5 self-center rounded-xl border border-linea bg-nara-blanco px-3 py-2.5 text-sm">
            <button
              type="button"
              onClick={() => {
                store.reset();
                setDone(true);
              }}
              className="cursor-pointer border-none bg-transparent px-1 py-2 text-left font-texto text-sm text-nara-tinta"
            >
              Reiniciar datos
            </button>
            <div
              onClick={() => {
                store.setDevMode(!dev);
                setDev(!dev);
              }}
              className="flex cursor-pointer items-center justify-between px-1 py-2"
            >
              <span>Modo desarrollador</span>
              <span
                className={`relative h-6 w-10 rounded-xl ${dev ? "bg-nara-tinta" : "bg-[#C4BDB3]"}`}
              >
                <span
                  className={`absolute top-[3px] h-[18px] w-[18px] rounded-[9px] bg-nara-blanco ${dev ? "left-[19px]" : "left-[3px]"}`}
                />
              </span>
            </div>
            {done ? (
              <span className="px-1 pb-1 font-medium text-nara-tinta">Datos reiniciados</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
