import { Suspense } from "react";
import { AdminInformesScreen } from "@/modules/admin";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Informes");

function Fallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F0ECE6",
        fontFamily: "Figtree, system-ui, sans-serif",
      }}
    />
  );
}

export default function InformesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminInformesScreen />
    </Suspense>
  );
}
