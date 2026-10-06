import { IngresoScreen } from "@/modules/ingreso/components/IngresoScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Ingresar");

export default function IngresoPage() {
  return <IngresoScreen />;
}
