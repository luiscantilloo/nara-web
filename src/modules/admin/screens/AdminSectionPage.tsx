import { Suspense } from "react";
import { AdminScreen } from "@/modules/admin";

function AdminFallback() {
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

/** Página de sección del admin (inicio, territorios, equipos, …). */
export function AdminSectionPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminScreen />
    </Suspense>
  );
}
