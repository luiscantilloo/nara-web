"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";
import { roleIdFromLabel, type NaraRoleId } from "@/lib/db/roles";

function resolveRoleId(u: { id: string; role?: string; roleId?: string | null }) {
  return u.roleId || roleIdFromLabel(u.role || "") || null;
}

/** Acepta roleIds canónicos (`admin`, `experto`…) y aliases legacy de pantallas demo. */
function isAllowed(
  u: { id: string; role?: string; roleId?: string | null } | null,
  allowed: string[],
) {
  if (!u) return false;
  if (allowed.includes(u.id)) return true;

  const roleId = resolveRoleId(u);
  if (roleId && allowed.includes(roleId)) return true;

  // Aliases legacy → roleId
  const aliases: Record<string, NaraRoleId> = {
    paula: "admin",
    admin: "admin",
    andres: "experto",
    mj: "experto",
    experto: "experto",
    lucia: "clinico",
    clinico: "clinico",
    obs: "observador",
    observador: "observador",
    paciente: "paciente",
  };
  return allowed.some((a) => aliases[a] && aliases[a] === roleId);
}

export function useRequireSession(allowedIds: string[]) {
  const store = useNaraStore();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const u = store.session();
    if (!isAllowed(u, allowedIds)) {
      // H-015: con sesión de otro rol, a su propio panel con aviso; sin sesión, al ingreso.
      const href = (u as { href?: string } | null)?.href;
      router.replace(u && href ? `${href}?acceso=denegado` : "/ingreso");
      return;
    }
    setOk(true);
  }, [store, router, allowedIds]);

  return ok ? store.session() : null;
}
