"use client";

import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { AdminInformesContent } from "./AdminInformesContent";
import { useAdminInformesScreen } from "./useAdminInformesScreen";

export function AdminInformesScreen() {
  const { v } = useAdminInformesScreen();

  if (!v) {
    return <div className="min-h-screen bg-nara-crema font-texto" />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Informes"
      open={!!v.agentOpen}
      drawerWidth={String(v.drawerW || "480px")}
      onClose={() => (v.closeAgent as () => void)()}
      style={{
        minWidth: 0,
        fontFamily: "Figtree, system-ui, sans-serif",
        color: "#161413",
        fontSize: 15,
        background: "#F0ECE6",
      }}
      drawer={
        <AgentPanel
          role="admin"
          mode="drawer"
          initialAsk={String(v.pendingAsk || "")}
          context="reports"
          contextLabel="Sobre: informes"
          onAction={v.agentAction as (action: string, payload: unknown) => void}
          onClose={() => (v.closeAgent as () => void)()}
          style={{
            flex: 1,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        />
      }
      header={
        <AdminTopbar
          active="reports"
          onOpenAgent={() => (v.openAgent as () => void)()}
          agentOpen={!!v.agentOpen}
        />
      }
    >
      <div className="nara-page flex flex-col gap-4 md:gap-[18px]">
        <AdminInformesContent v={v} />
      </div>
    </AgentDrawerShell>
  );
}
