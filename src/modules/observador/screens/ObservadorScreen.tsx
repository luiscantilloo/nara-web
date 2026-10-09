"use client";

/**
 * Observador = un solo rol.
 * Inicio = saludo TEO (igual que administrador), sin módulos laterales.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { useNaraStore } from "@/providers/nara-provider";

function ObservadorInner() {
  const store = useNaraStore();
  const router = useRouter();
  const u = store.session();
  const [agentOpen, setAgentOpen] = useState(false);
  const [pendingAsk, setPendingAsk] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);

  useEffect(() => {
    const roleId = (u as { roleId?: string } | null)?.roleId;
    if (!u || (roleId !== "observador" && u.role !== "Observador")) {
      router.replace("/ingreso");
    }
  }, [u, router]);

  const account = useMemo(() => {
    void tick;
    if (!u) return null;
    const S = store.get();
    return (
      (S.accounts || []).find((a: { id: string }) => a.id === u.id) || null
    );
  }, [store, u, tick]);

  const orgName = String(
    account?.org || (u as { org?: string } | null)?.org || u?.name || "Observador",
  );

  if (!u) {
    return <NaraLoadingScreen />;
  }

  const openAgent = (q = "") => {
    setPendingAsk(q);
    setAgentOpen(true);
  };

  const header = (
    <header className="box-border flex h-16 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-0 border-b border-linea bg-nara-blanco px-3 sm:gap-3 sm:px-5 md:px-6">
      <img
        src="/nara/marca/logo/nara-logo.svg"
        alt="NARA"
        className="block h-7 w-auto shrink-0 sm:h-[34px]"
      />

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <button
          type="button"
          onClick={() => openAgent("")}
          aria-label="Abrir TEO"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-nara-tinta bg-nara-blanco px-2.5 font-texto text-sm font-medium text-nara-tinta sm:h-11 sm:px-3.5 sm:text-[15px]"
        >
          <img
            src="/nara/marca/logo/teo-isotipo.svg"
            alt=""
            className="block h-7 w-7 sm:-ml-1.5 sm:h-8 sm:w-8"
          />
          <span className="hidden sm:inline">TEO</span>
        </button>
        <UserMenu />
      </div>
    </header>
  );

  return (
    <AgentDrawerShell
      data-screen-label="Observador"
      open={agentOpen}
      drawerWidth="480px"
      onClose={() => setAgentOpen(false)}
      header={header}
      drawer={
        <AgentPanel
          role="obs"
          mode="drawer"
          open={agentOpen}
          initialAsk={pendingAsk}
          context="home"
          contextLabel={`Sobre: ${orgName}`}
          onClose={() => setAgentOpen(false)}
          style={{
            flex: 1,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        />
      }
    >
      <div className="nara-page flex min-h-0 flex-1 flex-col bg-nara-crema">
        <div
          className={`nara-home-grid${agentOpen ? " nara-home-grid--teo" : ""}`}
          style={{ paddingTop: "var(--nara-page-pad-y, 20px)" }}
        >
          {agentOpen ? (
            <div className="nara-home-teo-standin">
              <button
                type="button"
                onClick={() => openAgent("")}
                aria-label="TEO está conversando. Mantener asistente abierto"
                className="group flex cursor-pointer flex-col items-center gap-4 border-none bg-transparent p-4"
              >
                <span className="grid size-[200px] place-items-center rounded-[52px] bg-nara-rosa shadow-[0_16px_48px_rgba(255,163,208,0.4)] transition group-hover:scale-[1.03] group-active:scale-[0.98] motion-safe:animate-[nara-float_3.6s_ease-in-out_infinite_alternate] sm:size-[260px] sm:rounded-[64px]">
                  <img
                    src="/nara/marca/logo/teo-isotipo.svg"
                    alt=""
                    className="block size-[148px] sm:size-[196px]"
                  />
                </span>
                <span className="font-titulos text-2xl font-semibold text-nara-tinta sm:text-[28px]">
                  TEO
                </span>
                <span className="max-w-[280px] text-center font-texto text-base text-texto-secundario">
                  Aquí estoy, cuando quiera.
                </span>
              </button>
            </div>
          ) : (
            <div className="nara-home-main">
              <AgentPanel
                role="obs"
                mode="home"
                onOpenDrawer={(q) => openAgent(q)}
                style={{ flex: 1, minWidth: 0, width: "100%" }}
              />
            </div>
          )}
        </div>
      </div>
    </AgentDrawerShell>
  );
}

export function ObservadorScreen() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <ObservadorInner />
    </Suspense>
  );
}
