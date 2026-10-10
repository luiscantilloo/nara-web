import { ToolCardShell } from "../../ToolCardShell";
import { logoForHerramienta } from "../../toolLogos";
import type { HerramientaCardProps } from "../../types";

/** Técnicas guiadas — deshabilitada por ahora. */
export function TechToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell
      logoSrc={logoForHerramienta("tech")}
      title={item.name}
      disabled
    >
      <span>Próximamente</span>
    </ToolCardShell>
  );
}
