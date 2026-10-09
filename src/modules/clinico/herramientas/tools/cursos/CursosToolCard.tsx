import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

/** Cursos y cuentos — trabajar solo en `tools/cursos/`. */
export function CursosToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell>
      <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
    </ToolCardShell>
  );
}
