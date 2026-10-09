import { ClinicoScreen } from "@/modules/clinico";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Mis pacientes");

export default function Page() {
  return <ClinicoScreen />;
}
