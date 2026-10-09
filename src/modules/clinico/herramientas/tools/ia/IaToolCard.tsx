import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

/** Acompañante con IA (TEO) — trabajar solo en `tools/ia/`. */
export function IaToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell>
      <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
    </ToolCardShell>
  );
}
