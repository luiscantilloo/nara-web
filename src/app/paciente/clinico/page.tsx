import { PacienteScreen } from "@/modules/paciente/app/PacienteScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Psicólogo clínico");

export default function Page() {
  return <PacienteScreen />;
}
