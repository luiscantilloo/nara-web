import { PacienteScreen } from "@/modules/paciente";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Inicio");

export default function PacientePage() {
  return <PacienteScreen />;
}
