import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export const runtime = "nodejs";

function publicFlag(doc: Record<string, unknown>) {
  return {
    id: doc.id,
    wid: doc.wid,
    fromVisit: !!doc.fromVisit,
    expert: doc.expert,
    expertName: doc.expertName,
    territory: doc.territory,
    person: doc.person,
    when: doc.when,
    reasons: doc.reasons || [],
    status: doc.status || "pending",
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.collection("flags").find({}).sort({ at: -1 }).toArray();
    return NextResponse.json({ ok: true, flags: rows.map((r) => publicFlag(r)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar flags";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const db = await getDb();
    const now = new Date();
    const id = String(body.id || `fv-${Date.now().toString(36)}`);

    const doc = {
      id,
      wid: body.wid || null,
      fromVisit: body.fromVisit !== false,
      expert: body.expert || "",
      expertName: body.expertName || "",
      territory: body.territory || "",
      person: body.person || "",
      when: body.when || "Hoy",
      reasons: Array.isArray(body.reasons) ? body.reasons : [],
      status: body.status || "pending",
      at: Date.now(),
      updatedAt: now,
    };

    await db.collection("flags").updateOne(
      { id },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, flag: publicFlag(doc) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar flag";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Aprobar / rechazar visita marcada */
export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { id?: string; status?: "approved" | "rejected" };
    const id = String(body.id || "");
    const status = body.status;
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "id y status son obligatorios." }, { status: 400 });
    }

    const db = await getDb();
    const flag = await db.collection("flags").findOne({ id });
    if (!flag) {
      return NextResponse.json({ ok: false, error: "Flag no encontrado." }, { status: 404 });
    }

    await db.collection("flags").updateOne(
      { id },
      { $set: { status, updatedAt: new Date() } },
    );

    if (flag.fromVisit && flag.wid && flag.expert) {
      const wlStatus = status === "approved" ? "validada" : "rechazada";
      await db.collection("worklist_items").updateOne(
        { id: flag.wid, expertId: flag.expert },
        { $set: { status: wlStatus, updatedAt: new Date() } },
      );
    }

    return NextResponse.json({ ok: true, id, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar flag";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
