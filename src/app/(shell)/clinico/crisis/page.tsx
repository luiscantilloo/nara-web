import { ClinicoScreen } from "@/modules/clinico";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Crisis");

export default function Page() {
  return <ClinicoScreen />;
}
