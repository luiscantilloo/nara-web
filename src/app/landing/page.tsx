import { LandingScreen } from "@/modules/landing/LandingScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Acompañamiento en salud mental", {
  index: true,
  description:
    "Programa de acompañamiento post-sismo del Eje Cafetero. Cada persona, en el canal que puede usar.",
});

export default function LandingPage() {
  return <LandingScreen />;
}
