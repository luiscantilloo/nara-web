import { Suspense } from "react";
import type { Metadata } from "next";
import { InformeScreen } from "@/modules/informe/InformeScreen";
import { informeTitleFromParams } from "@/modules/informe/informeTitle";

export async function generateMetadata({
  searchParams,
}: PageProps<"/informe">): Promise<Metadata> {
  const sp = await searchParams;
  return { title: informeTitleFromParams(sp) };
}

function Fallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E6E1D9",
        fontFamily: "Figtree, system-ui, sans-serif",
      }}
    />
  );
}

export default function InformePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <InformeScreen />
    </Suspense>
  );
}
