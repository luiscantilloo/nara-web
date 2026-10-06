import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export const runtime = "nodejs";

/** Asigna un lote de manillas a un territorio (bodega local). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { terr?: string; count?: number };
    const terr = String(body.terr || "").trim();
    const count = Number(body.count) > 0 ? Number(body.count) : 100;

    if (!terr) {
      return NextResponse.json({ ok: false, error: "Territorio obligatorio." }, { status: 400 });
    }

    const db = await getDb();
    const territories = db.collection("territories");
    const t = await territories.findOne({ name: terr });
    if (!t) {
      return NextResponse.json({ ok: false, error: "Territorio no encontrado." }, { status: 404 });
    }

    const now = new Date();
    await territories.updateOne(
      { name: terr },
      {
        $set: {
          br: count,
          brA: count,
          brAv: count,
          updatedAt: now,
        },
      },
    );

    await db.collection("assets").updateOne(
      { id: `BR-LOT-${terr}` },
      {
        $set: {
          id: `BR-LOT-${terr}`,
          code: `BR-LOT-${terr}`,
          kind: "manilla-lote",
          type: "manilla",
          status: "En bodega",
          terr,
          count,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return NextResponse.json({
      ok: true,
      territory: { name: terr, br: count, brA: count, brAv: count },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al asignar manillas";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
