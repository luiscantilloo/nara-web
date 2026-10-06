import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.collection("assets").find({}).toArray();
    return NextResponse.json({
      ok: true,
      assets: rows.map((r) => ({
        id: r.id,
        type: r.type || r.kind || "",
        kind: r.kind || r.type || "",
        code: r.code || r.id,
        terr: r.terr || "",
        status: r.status || "",
        assignedTo: r.assignedTo || null,
        expertId: r.expertId || null,
        expertName: r.expertName || null,
        count: r.count ?? null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar activos";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
