"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { useNaraStore } from "@/providers/nara-provider";

/**
 * Paciente con credenciales pero sin perfil de ruta (aún no hizo el cuestionario de campo).
 */
export function PacientePendienteScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const session = store.session() as {
    name?: string;
    roleId?: string;
    role?: string;
  } | null;

  useEffect(() => {
    const ok =
      !!session &&
      (session.roleId === "paciente" || /Paciente/i.test(session.role || ""));
    if (!ok) router.replace("/ingreso");
  }, [session, router]);

  const name = String(session?.name || "Paciente").split(/\s+/)[0];

  return (
    <div
      data-screen-label="Paciente pendiente"
      className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-nara-crema font-texto text-nara-tinta"
    >
      {/* Ambiente NARA */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,163,208,0.35),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(253,205,34,0.18),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-4rem] size-64 rounded-full bg-nara-rosa/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-[-3rem] size-56 rounded-full bg-nara-amarillo/20 blur-3xl"
      />

      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-linea/80 bg-nara-blanco/90 px-4 backdrop-blur-sm sm:px-6">
        <img
          src="/nara/marca/logo/nara-logo.svg"
          alt="NARA"
          className="h-7 w-auto sm:h-[34px]"
        />
        <UserMenu compact />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-0 px-6 py-10 text-center sm:px-8">
        <div
          className="mb-7 grid size-[7.5rem] place-items-center rounded-[2rem] bg-nara-rosa shadow-[0_12px_40px_rgba(255,163,208,0.35)] animate-[naraPendIn_0.55s_cubic-bezier(0.22,1,0.36,1)_both] sm:size-36 sm:rounded-[2.5rem]"
        >
          <img
            src="/nara/marca/logo/nara-isotipo.svg"
            alt=""
            className="size-[4.75rem] sm:size-[5.5rem]"
          />
        </div>

        <p className="mb-2 font-titulos text-sm font-medium tracking-wide text-texto-secundario animate-[naraPendIn_0.55s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
          NARA
        </p>
        <h1 className="font-titulos text-[clamp(1.85rem,5vw,2.35rem)] font-semibold leading-tight animate-[naraPendIn_0.55s_cubic-bezier(0.22,1,0.36,1)_0.12s_both]">
          Hola, {name}
        </h1>

        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-texto-secundario animate-[naraPendIn_0.55s_cubic-bezier(0.22,1,0.36,1)_0.18s_both]">
          Su acceso ya está listo. Falta definir su{" "}
          <span className="font-medium text-nara-tinta">perfil de ruta</span> con
          el experto de campo (cuestionario PHQ-9 y capacidad digital).
        </p>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-texto-secundario animate-[naraPendIn_0.55s_cubic-bezier(0.22,1,0.36,1)_0.24s_both]">
          Mientras tanto no puede entrar a la app. Cuando la evaluación quede
          registrada, use el mismo correo y contraseña.
        </p>

        <button
          type="button"
          onClick={() => store.logout()}
          className="mt-8 h-12 cursor-pointer rounded-full border-[1.5px] border-nara-tinta bg-nara-blanco px-7 font-texto text-[15px] font-medium text-nara-tinta transition hover:bg-nara-crema active:scale-[0.98] animate-[naraPendIn_0.55s_cubic-bezier(0.22,1,0.36,1)_0.3s_both]"
        >
          Cerrar sesión
        </button>
      </main>

      <style>{`
@keyframes naraPendIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
`}</style>
    </div>
  );
}
