import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("NARA", {
  index: true,
  description: "Programa de acompañamiento post-sismo del Eje Cafetero.",
});

/** La portada pública vive en /landing/; el login en /ingreso. */
export default function Home() {
  redirect("/landing");
}
