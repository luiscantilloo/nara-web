import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/requireUser";
import { normalizeModuleIds } from "@/lib/db/patientModules";

export const runtime = "nodejs";

async function findPatient(
  db: Awaited<ReturnType<typeof getDb>>,
  opts: { accountId?: string; email?: string; patientId?: string },
) {
  if (opts.patientId) {
    const byId = await db.collection("patients").findOne({ id: opts.patientId });
    if (byId) return byId;
  }
  if (opts.accountId) {
    const byAcc = await db.collection("patients").findOne({ accountId: opts.accountId });
    if (byAcc) return byAcc;
  }
  if (opts.email) {
    const byEmail = await db.collection("patients").findOne({
      email: opts.email.toLowerCase(),
    });
    if (byEmail) return byEmail;
  }
  return null;
}

/**
 * Admin/clínico/experto: modulesEnabled (qué ofrece el programa).
 * Paciente: modulesVisible (qué quiere ver, subconjunto de lo habilitado).
 */
export async function PATCH(req: Request) {
  const auth = await requireUser(["paciente", "admin", "clinico", "experto"]);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as {
      modulesVisible?: string[];
      modulesEnabled?: string[];
      patientId?: string;
    };
    const db = await getDb();
    const isStaff = ["admin", "clinico", "experto"].includes(auth.user.roleId);

    let patient = isStaff
      ? await findPatient(db, { patientId: body.patientId })
      : await findPatient(db, {
          accountId: auth.user.id,
          email: auth.user.email,
          patientId: body.patientId,
        });

    // Admin: si solo existe en people, crear ficha clínica al primer toggle de módulos
    if (!patient && isStaff && body.patientId) {
      const person = await db.collection("people").findOne({
        $or: [{ id: body.patientId }, { code: body.patientId }],
      });
      if (person) {
        const now = new Date();
        const id = String(person.id || body.patientId);
        const modulesEnabled = normalizeModuleIds(body.modulesEnabled, []);
        await db.collection("patients").updateOne(
          { id },
          {
            $set: {
              id,
              name: person.name || id,
              age: person.age || 0,
              place: person.place || "",
              terr: person.terr || "",
              phone: person.phone || "",
              email: person.email || "",
              profile: person.profile || "P01",
              expert: person.expert || "",
              clin: person.clin || null,
              modulesEnabled,
              modulesVisible: modulesEnabled.slice(),
              signal: person.status || "Activa",
              ctx: person.ctx || { dano: 0, perdida: 0 },
              phq: [],
              timeline: [],
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true },
        );
        patient = await db.collection("patients").findOne({ id });

        // Vincular cuenta de paciente por teléfono o nombre (para /api/patients/me)
        const phoneDigits = String(person.phone || "").replace(/\D/g, "");
        const name = String(person.name || "").trim();
        if (phoneDigits.length >= 7 || name) {
          const accounts = await db.collection("accounts").find({ roleId: "paciente" }).toArray();
          const match = accounts.find((a) => {
            const c = String(a.contact || a.email || "").replace(/\D/g, "");
            if (phoneDigits.length >= 7 && c && (c === phoneDigits || c.endsWith(phoneDigits) || phoneDigits.endsWith(c))) {
              return true;
            }
            return name && String(a.name || "").trim().toLowerCase() === name.toLowerCase();
          });
          if (match) {
            await db.collection("accounts").updateOne(
              { id: match.id },
              { $set: { patientId: id, updatedAt: now } },
            );
            await db.collection("patients").updateOne(
              { id },
              {
                $set: {
                  accountId: match.id,
                  email: match.email || person.email || "",
                  updatedAt: now,
                },
              },
            );
            patient = await db.collection("patients").findOne({ id });
          }
        }
      }
    }

    if (!patient) {
      return NextResponse.json(
        { ok: false, error: "Ficha de paciente no encontrada." },
        { status: 404 },
      );
    }

    const now = new Date();
    let modulesEnabled = Array.isArray(patient.modulesEnabled)
      ? normalizeModuleIds(patient.modulesEnabled, [])
      : normalizeModuleIds(undefined);
    let modulesVisible = normalizeModuleIds(patient.modulesVisible, modulesEnabled).filter((id) =>
      modulesEnabled.includes(id),
    );

    if (isStaff && Array.isArray(body.modulesEnabled)) {
      const prevEnabled = modulesEnabled;
      modulesEnabled = normalizeModuleIds(body.modulesEnabled, []);
      if (!modulesEnabled.length) {
        return NextResponse.json(
          { ok: false, error: "Deje al menos un módulo activo en el programa." },
          { status: 400 },
        );
      }
      const newlyOn = modulesEnabled.filter((id) => !prevEnabled.includes(id));
      const keepVisible = modulesVisible.filter((id) => modulesEnabled.includes(id));
      modulesVisible = Array.from(new Set([...keepVisible, ...newlyOn]));
      if (!modulesVisible.length) modulesVisible = modulesEnabled.slice();
    } else if (Array.isArray(body.modulesVisible)) {
      modulesVisible = normalizeModuleIds(body.modulesVisible, []).filter((id) =>
        modulesEnabled.includes(id),
      );
      if (!modulesVisible.length) {
        return NextResponse.json(
          { ok: false, error: "Deje visible al menos un módulo habilitado." },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Envíe modulesEnabled o modulesVisible." },
        { status: 400 },
      );
    }

    await db.collection("patients").updateOne(
      { id: patient.id },
      { $set: { modulesEnabled, modulesVisible, updatedAt: now } },
    );

    // Staff: asegurar que la cuenta de ingreso apunte a esta ficha (mismos módulos en la app)
    if (isStaff) {
      const phoneDigits = String(patient.phone || "").replace(/\D/g, "");
      const pname = String(patient.name || "").trim().toLowerCase();
      const accounts = await db.collection("accounts").find({ roleId: "paciente" }).toArray();
      for (const a of accounts) {
        const c = String(a.contact || a.email || "").replace(/\D/g, "");
        const aname = String(a.name || "").trim().toLowerCase();
        const phoneHit =
          phoneDigits.length >= 7 &&
          c.length >= 7 &&
          (c === phoneDigits || c.endsWith(phoneDigits) || phoneDigits.endsWith(c));
        const nameHit = pname.length >= 5 && aname === pname;
        const already = String(a.patientId || "") === String(patient.id) || String(a.id) === String(patient.accountId || "");
        if (!phoneHit && !nameHit && !already) continue;
        await db.collection("accounts").updateOne(
          { id: a.id },
          { $set: { patientId: patient.id, updatedAt: now } },
        );
        await db.collection("patients").updateOne(
          { id: patient.id },
          {
            $set: {
              accountId: a.id,
              email: a.email || patient.email || "",
              modulesEnabled,
              modulesVisible,
              updatedAt: now,
            },
          },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      id: patient.id,
      modulesEnabled,
      modulesVisible,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar módulos";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
