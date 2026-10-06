import { Suspense } from "react";
import { AdminUsuariosScreen } from "@/modules/admin";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Usuarios y permisos");

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

export default function UsuariosPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminUsuariosScreen />
    </Suspense>
  );
}
