import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export const runtime = "nodejs";

export type ExpertDoc = {
  id: string;
  name: string;
  phone: string;
  terr: string;
  target: number;
  today: number;
  week: number;
  training: string;
  tablet?: string | null;
  active?: boolean;
  isNew?: boolean;
  accountId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function publicExpert(doc: ExpertDoc & { tablet?: string }) {
  return {
    id: doc.id,
    name: doc.name,
    phone: doc.phone || "",
    terr: doc.terr || "",
    target: doc.target || 9,
    today: doc.today || 0,
    week: doc.week || 0,
    training: doc.training || "Pendiente",
    active: doc.active !== false,
    isNew: !!doc.isNew,
    accountId: doc.accountId || null,
    tablet: doc.tablet || null,
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db
      .collection<ExpertDoc>("experts")
      .find({})
      .sort({ name: 1 })
      .toArray();
    return NextResponse.json({ ok: true, experts: rows.map((r) => publicExpert(r)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar expertos";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ExpertDoc>;
    const name = String(body.name || "").trim();
    const phoneDigits = String(body.phone || "").replace(/\D/g, "");
    const terr = String(body.terr || "").trim();
    const target = Number(body.target) || 9;

    if (!name) {
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio." }, { status: 400 });
    }
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Escriba un celular de 10 dígitos." },
        { status: 400 },
      );
    }
    if (!terr) {
      return NextResponse.json(
        { ok: false, error: "Seleccione un territorio." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const terrExists = await db.collection("territories").findOne({ name: terr });
    if (!terrExists) {
      return NextResponse.json(
        { ok: false, error: "Ese territorio no existe en la base de datos." },
        { status: 400 },
      );
    }

    const now = new Date();
    const id = String(body.id || `e${Date.now().toString(36)}`);
    const phone =
      phoneDigits.length === 10
        ? `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`
        : String(body.phone || "");

    const doc: ExpertDoc = {
      id,
      name,
      phone,
      terr,
      target,
      today: 0,
      week: 0,
      training: "Pendiente",
      active: true,
      isNew: true,
      accountId: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection<ExpertDoc>("experts").insertOne(doc as ExpertDoc & { _id?: unknown });
    await db.collection("territories").updateOne(
      { name: terr },
      { $inc: { experts: 1 }, $set: { updatedAt: now } },
    );

    return NextResponse.json({ ok: true, expert: publicExpert(doc) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear experto";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
