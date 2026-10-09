/** Herramienta de la ruta del paciente (ids = SERVICES del store). */
export type HerramientaId =
  | "mood"
  | "clin"
  | "ia"
  | "tech"
  | "revisit"
  | "cursos"
  | string;

export type HerramientaItem = {
  id: HerramientaId;
  name: string;
  freq?: string;
  channel?: string;
};

export type HerramientaCardProps = {
  item: HerramientaItem;
  /** Id del paciente de la ficha (para cargar respuestas / historial). */
  patientId: string;
};
