import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const expertId = new URL(req.url).searchParams.get("expertId");
    const db = await getDb();
    const q = expertId ? { expertId } : {};
    const rows = await db.collection("worklist_items").find(q).sort({ at: -1 }).toArray();
    return NextResponse.json({
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        expertId: r.expertId,
        time: r.time || "—",
        name: r.name,
        age: r.age || 0,
        place: r.place || "",
        rural: !!r.rural,
        status: r.status || "programada",
        profile: r.profile || null,
        code: r.code || null,
        phone: r.phone || "",
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar worklists";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const expertId = String(body.expertId || "");
    const name = String(body.name || "").trim();
    if (!expertId || !name) {
      return NextResponse.json(
        { ok: false, error: "expertId y name son obligatorios." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const id = String(body.id || `p${Date.now().toString(36)}`);
    const doc = {
      id,
      expertId,
      time: body.time || "Ahora",
      name,
      age: Number(body.age) || 0,
      place: String(body.place || ""),
      rural: body.rural !== false,
      status: String(body.status || "programada"),
      profile: body.profile || null,
      code: body.code || null,
      phone: String(body.phone || ""),
      at: Date.now(),
      updatedAt: now,
    };

    await db.collection("worklist_items").updateOne(
      { id, expertId },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, item: doc }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar worklist";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { id?: string; expertId?: string; status?: string };
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: "id obligatorio" }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const $set: Record<string, unknown> = { updatedAt: now };
    if (body.status) $set.status = String(body.status);
    if (body.expertId) $set.expertId = String(body.expertId);

    const q: Record<string, unknown> = { id };
    if (body.expertId) q.expertId = String(body.expertId);

    const result = await db.collection("worklist_items").updateOne(q, { $set });
    if (!result.matchedCount) {
      return NextResponse.json({ ok: false, error: "Ítem no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar worklist";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
