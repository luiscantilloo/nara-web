import { IngresoScreen } from "@/modules/ingreso/components/IngresoScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Ingresar", {
  index: true,
  description:
    "Ingreso a NARA, plataforma de acompañamiento en salud mental post-sismo del Eje Cafetero.",
});

export default function IngresoPage() {
  return <IngresoScreen />;
}
