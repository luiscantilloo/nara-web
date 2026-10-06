import { Suspense } from "react";
import { PerfilScreen } from "@/modules/perfil/PerfilScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Mi perfil");

function Fallback() {
  return (
    <div className="min-h-0 flex-1 bg-nara-crema font-texto" />
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PerfilScreen />
    </Suspense>
  );
}
