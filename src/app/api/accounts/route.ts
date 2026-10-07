import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { hashPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/requireUser";
import { NARA_ROLES, ROLE_LABEL_TO_ID } from "@/lib/db/roles";
import { DEFAULT_PATIENT_MODULES, normalizeModuleIds } from "@/lib/db/patientModules";

export const runtime = "nodejs";

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
    patientModules: doc.patientModules || undefined,
    ethics: doc.ethics || undefined,
    status: doc.status || "Activo",
    patientId: doc.patientId || undefined,
  };
}

export async function GET() {
  const auth = await requireUser(["admin"]);
  if (auth.error) return auth.error;

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
  const auth = await requireUser(["admin"]);
  if (auth.error) return auth.error;

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
      patientModules?: string[];
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
    if (!ROLE_LABEL_TO_ID[role]) {
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

    const roleId = ROLE_LABEL_TO_ID[role];
    const roleDoc = NARA_ROLES.find((r) => r.id === roleId);
    const now = new Date();
    const id = String(existingById?.id || body.id || `u${Date.now().toString(36)}`);
    const status = body.status === "Inactivo" ? "Inactivo" : body.status === "Activo" ? "Activo" : (existingById?.status as string) || "Activo";

    const setDoc: Record<string, unknown> = {
      id,
      name,
      email: emailRaw,
      contact,
      role,
      roleId,
      terr: String(body.terr || "").trim() || "Todos",
      org: role === "Observador" ? String(body.org || "").trim() : "Programa NARA",
      status,
      updatedAt: now,
    };
    if (role === "Observador") {
      setDoc.orgType = body.orgType || "Financiador";
      setDoc.modules = Array.isArray(body.modules) ? body.modules : [];
      if (body.ethics) setDoc.ethics = body.ethics;
    }
    let patientModules = DEFAULT_PATIENT_MODULES.slice();
    if (role === "Paciente") {
      patientModules = normalizeModuleIds(body.patientModules);
      setDoc.patientModules = patientModules;
    }
    if (password) {
      setDoc.passwordHash = await hashPassword(password);
    }

    await col.updateOne(
      { id },
      { $set: setDoc, $setOnInsert: { createdAt: now, created: true } },
      { upsert: true },
    );

    if (roleId === "paciente") {
      const patientId = String(existingById?.patientId || `sm-acc-${id}`);
      const existingPatient =
        (await db.collection("patients").findOne({ accountId: id })) ||
        (await db.collection("patients").findOne({ email: emailRaw })) ||
        (await db.collection("patients").findOne({ id: patientId }));
      const pid = String(existingPatient?.id || patientId);
      const prevVisible = normalizeModuleIds(existingPatient?.modulesVisible);
      const modulesVisible = prevVisible.filter((m) => patientModules.includes(m));
      await db.collection("patients").updateOne(
        { id: pid },
        {
          $set: {
            id: pid,
            accountId: id,
            name,
            email: emailRaw,
            phone: /@/.test(contact) ? String(existingPatient?.phone || "") : contact,
            terr: setDoc.terr,
            place: String(existingPatient?.place || setDoc.terr || ""),
            modulesEnabled: patientModules,
            modulesVisible: modulesVisible.length ? modulesVisible : patientModules,
            updatedAt: now,
          },
          $setOnInsert: {
            age: 0,
            profile: "P01",
            phq: [],
            phqDates: [],
            expert: "",
            clin: null,
            next: "Primera llamada dentro de 7 días",
            nextShort: "Primera llamada",
            consent: true,
            signal: "Nueva",
            ctx: { dano: 0, perdida: 0 },
            timeline: [],
            createdAt: now,
          },
        },
        { upsert: true },
      );
      await col.updateOne({ id }, { $set: { patientId: pid } });
    }

    if (roleId === "experto") {
      const existingExpert =
        (await db.collection("experts").findOne({ accountId: id })) ||
        (await db.collection("experts").findOne({ name }));
      const expertKey = existingExpert ? { id: existingExpert.id } : { name };
      await db.collection("experts").updateOne(
        expertKey,
        {
          $set: {
            accountId: id,
            name,
            phone: contact,
            terr: setDoc.terr,
            active: status === "Activo",
            updatedAt: now,
          },
          $setOnInsert: {
            id: existingExpert?.id || id,
            target: 9,
            today: 0,
            week: 0,
            training: "Pendiente",
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
