import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Ingresar", { index: true });

export default function Home() {
  redirect("/ingreso");
}
