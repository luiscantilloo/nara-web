import type { ComponentType } from "react";
import type { HerramientaCardProps, HerramientaId } from "../types";
import { ClinToolCard } from "./clin/ClinToolCard";
import { CursosToolCard } from "./cursos/CursosToolCard";
import { IaToolCard } from "./ia/IaToolCard";
import { MoodToolCard } from "./mood/MoodToolCard";
import { PlaceholderToolCard } from "./PlaceholderToolCard";
import { RevisitToolCard } from "./revisit/RevisitToolCard";
import { TechToolCard } from "./tech/TechToolCard";

/**
 * Registro de herramientas.
 * Cada persona desarrolla solo su carpeta bajo `tools/<id>/`.
 */
export const HERRAMIENTA_CARDS: Partial<
  Record<HerramientaId, ComponentType<HerramientaCardProps>>
> = {
  mood: MoodToolCard,
  clin: ClinToolCard,
  ia: IaToolCard,
  tech: TechToolCard,
  revisit: RevisitToolCard,
  cursos: CursosToolCard,
};

export function resolveHerramientaCard(
  id: HerramientaId,
): ComponentType<HerramientaCardProps> {
  return HERRAMIENTA_CARDS[id] || PlaceholderToolCard;
}
