import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/requireUser";

export const runtime = "nodejs";

/** Asigna una tablet a un experto de campo. */
export async function POST(req: Request) {
  const auth = await requireUser(["admin"]);
  if (auth.error) return auth.error;
  try {
    const body = (await req.json()) as { expertId?: string; expertName?: string };
    const db = await getDb();
    const experts = db.collection("experts");
    const assets = db.collection("assets");

    const expert = body.expertId
      ? await experts.findOne({ id: body.expertId })
      : await experts.findOne({ name: String(body.expertName || "").trim() });

    if (!expert) {
      return NextResponse.json({ ok: false, error: "Experto no encontrado." }, { status: 404 });
    }
    if (expert.tablet) {
      return NextResponse.json({
        ok: true,
        already: true,
        expert: {
          id: expert.id,
          name: expert.name,
          terr: expert.terr,
          tablet: expert.tablet,
        },
      });
    }

    const assigned = await experts.countDocuments({
      tablet: { $exists: true, $nin: [null, ""] },
    });
    const code = "TB-" + String(assigned + 1).padStart(3, "0");
    const now = new Date();

    await experts.updateOne({ id: expert.id }, { $set: { tablet: code, updatedAt: now } });

    await assets.updateOne(
      { code },
      {
        $set: {
          id: code,
          code,
          kind: "tablet",
          type: "tablet",
          status: "Asignada",
          assignedTo: expert.id,
          assignedName: expert.name,
          terr: expert.terr || "",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return NextResponse.json({
      ok: true,
      expert: { id: expert.id, name: expert.name, terr: expert.terr, tablet: code },
      asset: { code, kind: "tablet" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al asignar tablet";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
