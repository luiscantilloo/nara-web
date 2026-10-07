import { NextResponse } from "next/server";
import { getDb, pingDb } from "@/lib/db/mongodb";
import { NARA_COLLECTIONS } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/requireUser";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser(["admin"]);
  if (auth.error) return auth.error;
  try {
    const ping = await pingDb();
    const db = await getDb();
    const names = (await db.listCollections().toArray()).map((c) => c.name).sort();
    const expected = NARA_COLLECTIONS.map((c) => c.name);
    const missing = expected.filter((n) => !names.includes(n));

    return NextResponse.json({
      ok: true,
      db: ping.db,
      collections: names.length,
      missing,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de conexión";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
