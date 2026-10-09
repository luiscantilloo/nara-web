import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

/**
 * Estado de ánimo — respuestas / resultados del paciente en la app.
 *
 * Desarrollar SOLO en esta carpeta (`tools/mood/`) para evitar conflictos
 * con otras herramientas en el merge.
 *
 * Próximos pasos sugeridos:
 * - Leer check-ins de ánimo del paciente (`patientId`)
 * - Mostrar último valor / tendencia en la casilla
 * - Abrir detalle (modal o panel) al hacer click
 */
export function MoodToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId; // se usará al conectar datos reales

  return (
    <ToolCardShell>
      <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
      {/* TODO mood: resumen (ej. último check-in) */}
    </ToolCardShell>
  );
}
