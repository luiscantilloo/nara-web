import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { hashPassword } from "@/lib/auth/password";
import { NARA_ROLES } from "@/lib/db/roles";

export const runtime = "nodejs";

const ROLE_TO_ID: Record<string, string> = {
  Administrador: "admin",
  Administradora: "admin",
  "Experto de campo": "experto",
  "Experta de campo": "experto",
  Clínico: "clinico",
  Clínica: "clinico",
  Observador: "observador",
  Paciente: "paciente",
};

function publicAccount(doc: Record<string, unknown>) {
  return {
    id: doc.id,
    name: doc.name,
    email: doc.email || "",
    contact: doc.contact || doc.email || "",
    role: doc.role,
    roleId: doc.roleId,
    terr: doc.terr || "",
    org: doc.org || "",
    orgType: doc.orgType || undefined,
    modules: doc.modules || undefined,
    ethics: doc.ethics || undefined,
    status: doc.status || "Activo",
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.collection("accounts").find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ ok: true, accounts: rows.map((r) => publicAccount(r)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar cuentas";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      name?: string;
      contact?: string;
      email?: string;
      password?: string;
      role?: string;
      terr?: string;
      org?: string;
      orgType?: string;
      modules?: string[];
      ethics?: string;
      status?: string;
    };

    const name = String(body.name || "").trim();
    const contact = String(body.contact || body.email || "").trim();
    const role = String(body.role || "").trim();
    const password = String(body.password || "");
    const emailRaw = String(body.email || (/@/.test(contact) ? contact : "")).trim().toLowerCase();

    if (!name || !contact) {
      return NextResponse.json(
        { ok: false, error: "Escriba el nombre y un correo o celular." },
        { status: 400 },
      );
    }
    if (!emailRaw || !/@/.test(emailRaw)) {
      return NextResponse.json(
        { ok: false, error: "Para crear acceso con contraseña use un correo (ej. nombre@nara.com)." },
        { status: 400 },
      );
    }
    if (!ROLE_TO_ID[role]) {
      return NextResponse.json({ ok: false, error: "Rol no válido." }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection("accounts");
    const existingById = body.id ? await col.findOne({ id: body.id }) : null;
    const existingByEmail = await col.findOne({ email: emailRaw });

    if (!existingById && !password) {
      return NextResponse.json(
        { ok: false, error: "Defina una contraseña para el nuevo usuario." },
        { status: 400 },
      );
    }
    if (password && password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }
    if (existingByEmail && (!existingById || existingByEmail.id !== existingById.id)) {
      return NextResponse.json(
        { ok: false, error: "Ya existe una cuenta con ese correo." },
        { status: 409 },
      );
    }

    const roleId = ROLE_TO_ID[role];
    const roleDoc = NARA_ROLES.find((r) => r.id === roleId);
    const now = new Date();
    const id = String(existingById?.id || body.id || `u${Date.now().toString(36)}`);

    const setDoc: Record<string, unknown> = {
      id,
      name,
      email: emailRaw,
      contact,
      role,
      roleId,
      terr: String(body.terr || "").trim() || "Todos",
      org: role === "Observador" ? String(body.org || "").trim() : "Programa NARA",
      status: body.status || "Activo",
      updatedAt: now,
    };
    if (role === "Observador") {
      setDoc.orgType = body.orgType || "Financiador";
      setDoc.modules = Array.isArray(body.modules) ? body.modules : [];
      if (body.ethics) setDoc.ethics = body.ethics;
    }
    if (password) {
      setDoc.passwordHash = await hashPassword(password);
    }

    await col.updateOne(
      { id },
      { $set: setDoc, $setOnInsert: { createdAt: now, created: true } },
      { upsert: true },
    );

    if (roleId === "experto") {
      await db.collection("experts").updateOne(
        { name },
        {
          $set: {
            accountId: id,
            phone: contact,
            terr: setDoc.terr,
            updatedAt: now,
          },
          $setOnInsert: {
            id,
            name,
            target: 9,
            today: 0,
            week: 0,
            training: "Pendiente",
            active: true,
            createdAt: now,
          },
        },
        { upsert: true },
      );
    }

    const saved = await col.findOne({ id });
    return NextResponse.json({
      ok: true,
      account: publicAccount(saved || setDoc),
      href: roleDoc?.href || "/ingreso",
      passwordSet: !!password,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar cuenta";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
