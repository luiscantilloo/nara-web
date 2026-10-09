/**
 * Catálogo de los 6 servicios.
 * Cada persona edita SOLO su archivo (mood.js, ia.js, …) para no chocar en el merge.
 */
import mood from "./mood.js";
import clin from "./clin.js";
import ia from "./ia.js";
import tech from "./tech.js";
import revisit from "./revisit.js";
import cursos from "./cursos.js";

export const NARA_SERVICES = [mood, clin, ia, tech, revisit, cursos];

export const NARA_SERVICE_BY_ID = Object.fromEntries(
  NARA_SERVICES.map((s) => [s.id, s]),
);
