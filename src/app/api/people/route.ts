import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/requireUser";

export const runtime = "nodejs";

function publicPerson(doc: Record<string, unknown>) {
  return {
    id: doc.id,
    code: doc.code || "",
    name: doc.name,
    age: doc.age || 0,
    place: doc.place || "",
    rural: !!doc.rural,
    terr: doc.terr || "",
    profile: doc.profile || "P01",
    week: doc.week || 0,
    weeks: doc.weeks || 13,
    expert: doc.expert || "",
    expertId: doc.expertId || null,
    status: doc.status || "Activa",
    clin: doc.clin || null,
    phone: doc.phone || "",
  };
}

export async function GET() {
  const auth = await requireUser(["admin", "experto", "clinico", "observador"]);
  if (auth.error) return auth.error;
  try {
    const db = await getDb();
    const rows = await db.collection("people").find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ ok: true, people: rows.map((r) => publicPerson(r)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar personas";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser(["admin", "experto", "clinico"]);
  if (auth.error) return auth.error;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio." }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const id = String(body.id || `p${Date.now().toString(36)}`);
    const terr = String(body.terr || "").trim();
    const pre =
      ({ Salento: "SAL", Armenia: "ARM", Calarcá: "CAL" } as Record<string, string>)[terr] ||
      terr.slice(0, 3).toUpperCase() ||
      "NAR";
    const code = String(body.code || `${pre}-${1000 + (await db.collection("people").countDocuments()) + 1}`);

    const doc = {
      id,
      code,
      name,
      age: Number(body.age) || 0,
      place: String(body.place || ""),
      rural: body.rural !== false,
      terr,
      profile: String(body.profile || "P01"),
      week: Number(body.week) || 0,
      weeks: Number(body.weeks) || 13,
      expert: String(body.expert || ""),
      expertId: body.expertId || null,
      status: String(body.status || "Activa"),
      clin: body.clin || null,
      phone: String(body.phone || ""),
      updatedAt: now,
    };

    await db.collection("people").updateOne(
      { id },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );

    // captación del territorio
    if (terr) {
      await db.collection("territories").updateOne(
        { name: terr },
        { $inc: { cap: 1 }, $set: { updatedAt: now } },
      );
    }

    return NextResponse.json({ ok: true, person: publicPerson(doc) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar persona";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
