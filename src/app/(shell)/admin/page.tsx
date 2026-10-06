import { Suspense } from "react";
import AdminRedirectPage from "./AdminRedirect";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Administrador");

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

export default function AdminPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminRedirectPage />
    </Suspense>
  );
}
