import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

/** Revisita del experto — trabajar solo en `tools/revisit/`. */
export function RevisitToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell>
      <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
    </ToolCardShell>
  );
}
