import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/requireUser";
import { DEFAULT_PATIENT_MODULES, normalizeModuleIds } from "@/lib/db/patientModules";

export const runtime = "nodejs";

function digits(s: unknown) {
  return String(s || "").replace(/\D/g, "");
}

function publicPatient(doc: Record<string, unknown>) {
  const modulesEnabled = Array.isArray(doc.modulesEnabled)
    ? normalizeModuleIds(doc.modulesEnabled, [])
    : DEFAULT_PATIENT_MODULES.slice();
  const modulesVisible = normalizeModuleIds(
    doc.modulesVisible ?? modulesEnabled,
    modulesEnabled,
  ).filter((id) => modulesEnabled.includes(id));
  return {
    id: doc.id,
    name: doc.name,
    email: doc.email || "",
    age: doc.age || 0,
    place: doc.place || "",
    terr: doc.terr || "",
    profile: doc.profile || "P01",
    phone: doc.phone || "",
    phq: doc.phq || [],
    phqDates: doc.phqDates || [],
    expert: doc.expert || "",
    clin: doc.clin || null,
    next: doc.next || "",
    nextShort: doc.nextShort || "",
    consent: doc.consent !== false,
    signal: doc.signal || "",
    summary: doc.summary || null,
    adherence: doc.adherence ?? null,
    sleep: doc.sleep ?? null,
    braceletStatus: doc.braceletStatus || "",
    audios: doc.audios || 0,
    timeline: doc.timeline || [],
    ctx: doc.ctx || { dano: 0, perdida: 0 },
    modulesEnabled,
    modulesVisible: modulesVisible.length ? modulesVisible : modulesEnabled,
    accountId: doc.accountId || null,
    source: doc.source || "",
  };
}

async function linkAccountToPatient(
  db: Awaited<ReturnType<typeof getDb>>,
  accountId: string,
  patient: Record<string, unknown>,
  email?: string,
) {
  const now = new Date();
  await db.collection("accounts").updateOne(
    { id: accountId },
    { $set: { patientId: patient.id, updatedAt: now } },
  );
  await db.collection("patients").updateOne(
    { id: patient.id },
    {
      $set: {
        accountId,
        email: email || patient.email || "",
        updatedAt: now,
      },
    },
  );
  return { ...patient, accountId };
}

async function resolvePatientFicha(
  db: Awaited<ReturnType<typeof getDb>>,
  account: Record<string, unknown>,
) {
  const accountId = String(account.id || "");
  const email = String(account.email || "").toLowerCase();
  const contactDigits = digits(account.contact || account.email);
  const patientId = account.patientId ? String(account.patientId) : "";
  const name = String(account.name || "").trim().toLowerCase();

  // 1) Ficha de Personas (people → patients) manda sobre sm-acc-* de la cuenta
  const people = await db.collection("people").find({}).limit(1200).toArray();
  const person =
    people.find((p) => {
      const ph = digits(p.phone);
      return (
        contactDigits.length >= 7 &&
        ph.length >= 7 &&
        (ph === contactDigits || ph.endsWith(contactDigits) || contactDigits.endsWith(ph))
      );
    }) ||
    (name.length >= 5
      ? people.find((p) => String(p.name || "").trim().toLowerCase() === name)
      : null);

  if (person?.id) {
    const clinical = await db.collection("patients").findOne({ id: String(person.id) });
    if (clinical) {
      return linkAccountToPatient(db, accountId, clinical as Record<string, unknown>, email);
    }
  }

  if (patientId) {
    const byLink = await db.collection("patients").findOne({ id: patientId });
    if (byLink) return byLink;
  }

  const byAcc = await db.collection("patients").findOne({ accountId });
  if (byAcc) return byAcc;

  if (email) {
    const byEmail = await db.collection("patients").findOne({ email });
    if (byEmail) return byEmail;
  }

  const byId = await db.collection("patients").findOne({ id: accountId });
  if (byId) return byId;

  if (name.length >= 5) {
    const byName = await db.collection("patients").findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (byName) {
      return linkAccountToPatient(db, accountId, byName as Record<string, unknown>, email);
    }
  }

  return null;
}

/** Ficha del paciente en sesión (para que la app respete módulos del admin). */
export async function GET() {
  const auth = await requireUser(["paciente", "admin", "clinico"]);
  if (auth.error) return auth.error;

  try {
    const db = await getDb();
    const account = await db.collection("accounts").findOne({ id: auth.user.id });
    if (!account) {
      return NextResponse.json({ ok: false, error: "Cuenta no encontrada." }, { status: 404 });
    }

    let patient = await resolvePatientFicha(db, account as Record<string, unknown>);

    if (!patient) {
      return NextResponse.json({ ok: false, error: "Sin ficha de paciente vinculada." }, { status: 404 });
    }

    // Solo sembrar defaults si el campo nunca existió (admin aún no configuró)
    if (!Array.isArray(patient.modulesEnabled)) {
      const modulesEnabled = DEFAULT_PATIENT_MODULES.slice();
      await db.collection("patients").updateOne(
        { id: patient.id },
        {
          $set: {
            modulesEnabled,
            modulesVisible: modulesEnabled,
            updatedAt: new Date(),
          },
        },
      );
      patient = { ...patient, modulesEnabled, modulesVisible: modulesEnabled };
    }

    return NextResponse.json({ ok: true, patient: publicPatient(patient as Record<string, unknown>) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer ficha";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
