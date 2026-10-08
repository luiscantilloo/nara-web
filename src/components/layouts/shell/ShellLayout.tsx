"use client";

import { Suspense, useEffect } from "react";
import { RouteLoadingProvider } from "@/components/shared/nara-loading/RouteLoadingProvider";

/**
 * Shell de roles: viewport bloqueado.
 * El documento no scrollea; cada pantalla define su propia zona de scroll bajo el topbar.
 */
export function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div
      data-shell-root
      className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-nara-crema"
    >
      <Suspense fallback={null}>
        <RouteLoadingProvider>{children}</RouteLoadingProvider>
      </Suspense>
    </div>
  );
}
