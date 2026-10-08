"use client";

import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { ClinicoBody, ClinicoTopbar } from "@/modules/clinico/components/ClinicoBody";
import { useClinicoScreen } from "@/modules/clinico/hooks/useClinicoScreen";

export function ClinicoScreen() {
  const { v, session } = useClinicoScreen();

  if (!session || !v) return null;

  return (
    <>
      <style>{`
        body { margin: 0; background: #F0ECE6 }
        a { color: #161413; text-decoration: none }
        textarea, select, input { font-family: Figtree, system-ui, sans-serif }
      `}</style>
      <AgentDrawerShell
        open={!!v.agentOpen}
        drawerWidth={String(v.drawerW || "480px")}
        onClose={() => v.closeAgent?.()}
        drawer={
          <AgentPanel
            role="clin"
            mode="drawer"
            open={!!v.agentOpen}
            initialAsk={String(v.pendingAsk || "")}
            context={String(v.view || "")}
            contextLabel={String(v.ctxLabel || "")}
            onAction={v.agentAction as (action: string, payload: unknown) => void}
            onClose={() => v.closeAgent?.()}
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          />
        }
        header={<ClinicoTopbar v={v} />}
      >
        <ClinicoBody v={v} />
      </AgentDrawerShell>
    </>
  );
}
