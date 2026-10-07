import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/requireUser";
import { loadSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/** Actualiza el perfil de la cuenta en sesión (nombre, contacto, org). */
export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as {
      name?: string;
      contact?: string;
      org?: string;
    };

    const name = String(body.name || "").trim();
    const contact = String(body.contact || "").trim();
    const org = String(body.org || "").trim();

    if (!name) {
      return NextResponse.json({ ok: false, error: "Escriba su nombre." }, { status: 400 });
    }
    if (!contact) {
      return NextResponse.json(
        { ok: false, error: "Escriba un correo o celular de contacto." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const setDoc: Record<string, unknown> = {
      name,
      contact,
      updatedAt: now,
    };
    if (org) setDoc.org = org;
    if (/@/.test(contact)) {
      const email = contact.toLowerCase();
      const clash = await db.collection("accounts").findOne({
        email,
        id: { $ne: auth.user.id },
      });
      if (clash) {
        return NextResponse.json(
          { ok: false, error: "Ese correo ya está en uso por otra cuenta." },
          { status: 409 },
        );
      }
      setDoc.email = email;
    }

    await db.collection("accounts").updateOne({ id: auth.user.id }, { $set: setDoc });

    const user = await loadSessionUser(auth.user.id);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Cuenta no disponible." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar perfil";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
