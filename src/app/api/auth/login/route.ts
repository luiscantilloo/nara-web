import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { verifyPassword } from "@/lib/auth/password";
import { attachSessionCookie, loadSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Correo y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const account = await db.collection("accounts").findOne({ email });

    if (!account || account.status !== "Activo") {
      return NextResponse.json(
        { ok: false, error: "Correo o contraseña incorrectos." },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(password, String(account.passwordHash || ""));
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Correo o contraseña incorrectos." },
        { status: 401 },
      );
    }

    const user = await loadSessionUser(String(account.id));
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Cuenta no disponible." },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ ok: true, user });
    return attachSessionCookie(res, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de autenticación";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
