import { ToolCardShell } from "../../ToolCardShell";
import { logoForHerramienta } from "../../toolLogos";
import type { HerramientaCardProps } from "../../types";

/** Revisita del experto — deshabilitada por ahora. */
export function RevisitToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell
      logoSrc={logoForHerramienta("revisit")}
      title={item.name}
      disabled
    >
      <span>Próximamente</span>
    </ToolCardShell>
  );
}
