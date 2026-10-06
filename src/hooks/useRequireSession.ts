"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";

function isAllowed(u: { id: string; role?: string } | null, allowedIds: string[]) {
  if (!u) return false;
  if (allowedIds.includes(u.id)) return true;
  const role = u.role || "";
  if (allowedIds.includes("obs") && role === "Observador") return true;
  if ((allowedIds.includes("paula") || allowedIds.includes("admin")) && /Admin/i.test(role)) return true;
  if (allowedIds.includes("experto") && /Experto de campo/i.test(role)) return true;
  if (allowedIds.includes("clinico") && /Cl[ií]nic/i.test(role)) return true;
  // Compat pantallas demo: andres/mj = cualquier experto; lucia = cualquier clínico
  if ((allowedIds.includes("andres") || allowedIds.includes("mj")) && /Experto de campo/i.test(role))
    return true;
  if (allowedIds.includes("lucia") && /Cl[ií]nic/i.test(role)) return true;
  return false;
}

export function useRequireSession(allowedIds: string[]) {
  const store = useNaraStore();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const u = store.session();
    if (!isAllowed(u, allowedIds)) {
      router.replace("/ingreso");
      return;
    }
    setOk(true);
  }, [store, router, allowedIds]);

  return ok ? store.session() : null;
}
