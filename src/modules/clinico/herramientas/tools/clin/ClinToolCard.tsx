import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

/** Psicólogo clínico — trabajar solo en `tools/clin/`. */
export function ClinToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell>
      <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
    </ToolCardShell>
  );
}
