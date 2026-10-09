import { ExpertoScreen } from "@/modules/experto/screens/ExpertoScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Nueva persona");

export default function Page() {
  return <ExpertoScreen />;
}
