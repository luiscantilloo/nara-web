import { ClinicoScreen } from "@/modules/clinico";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Historial de crisis");

export default function Page() {
  return <ClinicoScreen />;
}
