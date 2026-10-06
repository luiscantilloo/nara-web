"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";

export function useRequireSession(allowedIds: string[]) {
  const store = useNaraStore();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const u = store.session();
    const allowed =
      u &&
      (allowedIds.includes(u.id) ||
        (allowedIds.includes("obs") && u.role === "Observador"));
    if (!allowed) {
      router.replace("/ingreso");
      return;
    }
    setOk(true);
  }, [store, router, allowedIds]);

  return ok ? store.session() : null;
}
