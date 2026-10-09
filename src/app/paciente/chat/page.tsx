import { PacienteScreen } from "@/modules/paciente/app/PacienteScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("TEO");

export default function Page() {
  return <PacienteScreen />;
}
