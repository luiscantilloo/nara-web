/** Preguntas coherentes con datos reales del programa (rotan al abrir TEO). */
export const TEO_SUGGESTIONS: Record<string, string[]> = {
  admin: [
    "¿Qué territorio va más atrasado en captación?",
    "¿Cuántos pacientes hay en el programa?",
    "¿En qué territorios hay más personas captadas?",
    "¿Qué expertos están activos y en qué territorio?",
    "¿Cómo va la captación general del programa?",
    "¿Cuántas personas captadas hay en total?",
    "¿Cuántas cuentas hay por rol?",
    "¿Hay alertas abiertas ahora?",
    "¿Qué territorios tienen expertos asignados?",
    "¿Cuántos activos (manillas o tabletas) hay registrados?",
    "Resuma el estado del programa en tres puntos.",
    "¿Qué territorio tiene mejor avance de captación?",
  ],
  clin: [
    "¿Quiénes empeoraron este mes?",
    "¿Quién no ha respondido check-ins en 7 días?",
    "¿Quiénes dejaron su curso a la mitad?",
    "¿Qué compartieron mis pacientes de los cuentos esta semana?",
  ],
  experto: [
    "¿Cómo va mi meta de la semana?",
    "¿Cuántas visitas tengo pendientes?",
    "¿Hay alertas en mi territorio?",
    "¿Cómo va la captación en mi territorio?",
  ],
  observador: [
    "¿Cuántas personas hay en el programa?",
    "¿Cómo va la captación agregada?",
    "¿Qué territorios concentran más personas?",
    "Resuma el avance del programa sin datos personales.",
  ],
};

const ROLE_ALIAS: Record<string, string> = {
  obs: "observador",
  observador: "observador",
  clin: "clin",
  clinico: "clin",
  expert: "experto",
  experto: "experto",
  admin: "admin",
};

export function pickTeoSuggestions(role: string, count = 4): string[] {
  const raw = role.split(":")[0];
  const key = ROLE_ALIAS[raw] || raw;
  const pool = TEO_SUGGESTIONS[key] || TEO_SUGGESTIONS.admin;
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}
