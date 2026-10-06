import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Administrador");

export default function Page() {
  redirect("/admin");
}
