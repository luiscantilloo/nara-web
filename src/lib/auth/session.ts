import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { NARA_ROLES } from "@/lib/db/roles";

export const SESSION_COOKIE = "nara_sid";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 días

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  terr: string;
  org: string;
  contact: string;
  status: string;
  href: string;
  nk: string | null;
};

export function attachSessionCookie(res: NextResponse, accountId: string) {
  res.cookies.set(SESSION_COOKIE, accountId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function readSessionAccountId(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  return id ? String(id) : null;
}

export async function loadSessionUser(accountId?: string | null): Promise<SessionUser | null> {
  const id = accountId ?? (await readSessionAccountId());
  if (!id) return null;

  const db = await getDb();
  const account = await db.collection("accounts").findOne({ id, status: "Activo" });
  if (!account) return null;

  const roleDoc =
    (await db.collection("roles").findOne({ id: account.roleId })) ||
    NARA_ROLES.find((r) => r.id === account.roleId) ||
    null;

  return {
    id: String(account.id),
    name: String(account.name || ""),
    email: String(account.email || ""),
    role: String(account.role || ""),
    roleId: String(account.roleId || ""),
    terr: String(account.terr || ""),
    org: String(account.org || ""),
    contact: String(account.contact || account.email || ""),
    status: String(account.status || "Activo"),
    href: roleDoc?.href || "/ingreso",
    nk: roleDoc?.nk ?? null,
  };
}
