"use client";

/**
 * Observador = un solo rol, distintos enfoques (orgType + modules):
 * - Financiador → avance, recursos, resultados
 * - Investigación → resultados, datos
 * - Institución de salud → casos
 *
 * Por ahora la vista queda en blanco: solo topbar (org + TEO + menú), sin nav.
 * Los módulos/enfoques se guardan al crear el usuario y se usarán después.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { useNaraStore } from "@/providers/nara-provider";

function agentRoleForOrgType(orgType: string): "fin" | "inv" | "inst" | "obs" {
  if (orgType === "Investigación") return "inv";
  if (orgType === "Institución de salud") return "inst";
  if (orgType === "Financiador") return "fin";
  return "obs";
}

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

  const orgName = String(account?.org || (u as { org?: string } | null)?.org || u?.name || "Observador");
  const rawOrgType = String(
    (account?.orgType as string) ||
      (u as { orgType?: string } | null)?.orgType ||
      "",
  ).trim();
  const orgType = (
    ["Financiador", "Investigación", "Institución de salud"] as const
  ).includes(rawOrgType as "Financiador")
    ? rawOrgType
    : "Financiador";
  const agentRole = agentRoleForOrgType(orgType);

  if (!u) {
    return <NaraLoadingScreen />;
  }

  const header = (
    <header className="box-border flex h-16 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-0 border-b border-linea bg-nara-blanco px-3 sm:gap-3 sm:px-5 md:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <img
          src="/nara/marca/logo/nara-logo.svg"
          alt="NARA"
          className="block h-7 w-auto shrink-0 sm:h-[34px]"
        />
        <div className="flex min-w-0 flex-col border-l border-linea py-0.5 pl-3 leading-tight sm:pl-4">
          <span className="truncate text-[15px] font-medium text-nara-tinta">
            {orgName}
          </span>
          <span className="truncate text-xs text-texto-secundario">
            Observador · {orgType}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <button
          type="button"
          onClick={() => {
            setPendingAsk("");
            setAgentOpen(true);
          }}
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
          role={agentRole}
          mode="drawer"
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
      {/* Contenido en blanco a propósito: enfoques/módulos se implementan después */}
      <div className="nara-page flex min-h-0 flex-1 flex-col bg-nara-crema" />
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
