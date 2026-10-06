import { PacienteScreen } from "@/modules/paciente";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Paciente");

export default function PacientePage() {
  return <PacienteScreen />;
}
