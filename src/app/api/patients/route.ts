import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/requireUser";
import { DEFAULT_PATIENT_MODULES, normalizeModuleIds } from "@/lib/db/patientModules";

export const runtime = "nodejs";

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
    departamento: doc.departamento || "",
    municipio: doc.municipio || "",
    profile: doc.profile || "P01",
    phone: doc.phone || "",
    sexo: doc.sexo || "",
    genero: doc.genero || "",
    estadoCivil: doc.estadoCivil || "",
    estrato: doc.estrato || "",
    phq: doc.phq || [],
    phqDates: doc.phqDates || [],
    expert: doc.expert || "",
    clin: doc.clin || null,
    next: doc.next || "Primera llamada dentro de 7 días",
    nextShort: doc.nextShort || "Primera llamada",
    consent: doc.consent !== false,
    signal: doc.signal || "Nueva",
    summary: doc.summary || null,
    adherence: doc.adherence ?? null,
    sleep: doc.sleep ?? null,
    braceletStatus: doc.braceletStatus || "",
    audios: doc.audios || 0,
    timeline: doc.timeline || [],
    ctx: doc.ctx || { dano: 0, perdida: 0 },
    modulesEnabled,
    modulesVisible: modulesVisible.length ? modulesVisible : modulesEnabled,
    source: doc.source || "",
    accountId: doc.accountId || null,
  };
}

export async function GET() {
  const auth = await requireUser(["admin", "experto", "clinico"]);
  if (auth.error) return auth.error;
  try {
    const db = await getDb();
    const rows = await db.collection("patients").find({}).toArray();
    return NextResponse.json({ ok: true, patients: rows.map((r) => publicPatient(r)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar pacientes";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser(["admin", "experto", "clinico"]);
  if (auth.error) return auth.error;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    if (!id || !name) {
      return NextResponse.json({ ok: false, error: "id y name son obligatorios." }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const modulesEnabled = normalizeModuleIds(body.modulesEnabled);
    const modulesVisible = normalizeModuleIds(body.modulesVisible ?? modulesEnabled).filter((id) =>
      modulesEnabled.includes(id),
    );

    const doc = {
      id,
      name,
      email: String(body.email || "").trim().toLowerCase(),
      age: Number(body.age) || 0,
      place: String(body.place || ""),
      terr: String(body.terr || body.place || ""),
      departamento: String(body.departamento || ""),
      municipio: String(body.municipio || ""),
      profile: String(body.profile || "P01"),
      phone: String(body.phone || ""),
      sexo: String(body.sexo || ""),
      genero: String(body.genero || ""),
      estadoCivil: String(body.estadoCivil || ""),
      estrato: String(body.estrato || ""),
      phq: Array.isArray(body.phq) ? body.phq : [],
      phqDates: Array.isArray(body.phqDates) ? body.phqDates : ["Hoy"],
      expert: String(body.expert || ""),
      clin: body.clin || "Dra. Lucía Marín",
      next: body.next || "Primera llamada dentro de 7 días",
      nextShort: body.nextShort || "Primera llamada",
      consent: body.consent !== false,
      signal: body.signal || "Nueva",
      summary: body.summary || null,
      adherence: body.adherence ?? null,
      sleep: body.sleep ?? null,
      braceletStatus: body.braceletStatus || "Según la ruta",
      audios: body.audios || 0,
      timeline: Array.isArray(body.timeline) ? body.timeline : [],
      ctx: body.ctx || { dano: 0, perdida: 0 },
      modulesEnabled,
      modulesVisible: modulesVisible.length ? modulesVisible : modulesEnabled,
      accountId: body.accountId || null,
      updatedAt: now,
    };

    await db.collection("patients").updateOne(
      { id },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );

    await db.collection("caseload").updateOne(
      { id },
      {
        $set: {
          id,
          name: doc.name,
          age: doc.age,
          place: doc.place,
          profile: doc.profile,
          phq: Array.isArray(doc.phq) ? doc.phq[doc.phq.length - 1] : 7,
          expert: doc.expert,
          clin: doc.clin,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, patient: publicPatient(doc) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar paciente";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
