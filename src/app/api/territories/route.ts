import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export const runtime = "nodejs";

export type TerritoryDoc = {
  name: string;
  dep: string;
  level: string;
  experts: number;
  cap: number;
  goal: number;
  rural: number;
  ruralG: number;
  sixty: number;
  sixtyG: number;
  br: number;
  brA?: number;
  brD?: number;
  brAv?: number;
  insts: number | string[];
  content: string[];
  places: unknown[];
  isNew?: boolean;
  pace?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

function publicTerritory(doc: TerritoryDoc & { _id?: unknown }) {
  return {
    name: doc.name,
    dep: doc.dep || "",
    level: doc.level || "",
    experts: doc.experts || 0,
    cap: doc.cap || 0,
    goal: doc.goal || 0,
    rural: doc.rural || 0,
    ruralG: doc.ruralG || 0,
    sixty: doc.sixty || 0,
    sixtyG: doc.sixtyG || 0,
    br: doc.br || 0,
    brA: doc.brA ?? doc.br ?? 0,
    brD: doc.brD || 0,
    brAv: doc.brAv ?? doc.br ?? 0,
    insts: doc.insts ?? 0,
    content: Array.isArray(doc.content) ? doc.content : [],
    places: Array.isArray(doc.places) ? doc.places : [],
    isNew: !!doc.isNew,
    pace: doc.pace || 0,
  };
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db
      .collection<TerritoryDoc>("territories")
      .find({})
      .sort({ name: 1 })
      .toArray();
    return NextResponse.json({
      ok: true,
      territories: rows.map((r) => publicTerritory(r)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar territorios";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<TerritoryDoc>;
    const name = String(body.name || "").trim();
    const goal = Number(body.goal);

    if (!name) {
      return NextResponse.json({ ok: false, error: "El municipio es obligatorio." }, { status: 400 });
    }
    if (!(goal > 0)) {
      return NextResponse.json(
        { ok: false, error: "La meta de captación debe ser mayor que cero." },
        { status: 400 },
      );
    }

    const db = await getDb();
    const col = db.collection<TerritoryDoc>("territories");
    const exists = await col.findOne({ name });
    if (exists) {
      return NextResponse.json({ ok: false, error: "Ese territorio ya existe." }, { status: 409 });
    }

    const now = new Date();
    const doc: TerritoryDoc = {
      name,
      dep: String(body.dep || "").trim() || "Quindío",
      level: String(body.level || "Veredas seleccionadas"),
      experts: 0,
      cap: 0,
      goal,
      rural: 0,
      ruralG: Number(body.ruralG) || 0,
      sixty: 0,
      sixtyG: Number(body.sixtyG) || 0,
      br: 0,
      brA: 0,
      brD: 0,
      brAv: 0,
      insts: typeof body.insts === "number" ? body.insts : Array.isArray(body.insts) ? body.insts.length : 0,
      content: Array.isArray(body.content) ? body.content.map(String) : [],
      places: [],
      isNew: true,
      pace: 0,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc as TerritoryDoc & { _id?: unknown });
    return NextResponse.json({ ok: true, territory: publicTerritory(doc) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear territorio";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
