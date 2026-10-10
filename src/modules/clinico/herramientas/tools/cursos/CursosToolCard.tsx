import { ToolCardShell } from "../../ToolCardShell";
import { logoForHerramienta } from "../../toolLogos";
import type { HerramientaCardProps } from "../../types";

/** Cursos y cuentos — deshabilitada por ahora. */
export function CursosToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell
      logoSrc={logoForHerramienta("cursos")}
      title={item.name}
      disabled
    >
      <span>Próximamente</span>
    </ToolCardShell>
  );
}
