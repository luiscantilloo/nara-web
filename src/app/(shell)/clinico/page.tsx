import { ClinicoScreen } from "@/modules/clinico";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Clínico");

export default function ClinicoPage() {
  return <ClinicoScreen />;
}
