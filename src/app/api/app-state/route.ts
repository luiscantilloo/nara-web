import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import {
  APP_STATE_KEY,
  APP_STATE_SLICES,
  pickAppStateSlices,
} from "@/lib/db/appState";

export const runtime = "nodejs";

/** Espeja rebanadas clave a colecciones tipadas (visibles en Compass). */
async function mirrorToCollections(
  db: Awaited<ReturnType<typeof getDb>>,
  slices: Record<string, unknown>,
) {
  const now = new Date();

  // notes: { [personId]: string[] }
  if (slices.notes && typeof slices.notes === "object") {
    const notes = slices.notes as Record<string, string[]>;
    for (const [personId, texts] of Object.entries(notes)) {
      if (!Array.isArray(texts)) continue;
      await db.collection("notes").deleteMany({ personId, source: "app_state" });
      if (!texts.length) continue;
      await db.collection("notes").insertMany(
        texts.map((text, i) => ({
          personId,
          text,
          i,
          source: "app_state",
          at: Date.now(),
          updatedAt: now,
          createdAt: now,
        })),
      );
    }
  }

  // referrals: array
  if (Array.isArray(slices.referrals)) {
    for (const r of slices.referrals as Array<Record<string, unknown>>) {
      const id = String(r.id || "");
      if (!id) continue;
      await db.collection("referrals").updateOne(
        { id },
        {
          $set: {
            ...r,
            personId: r.pid || r.personId || null,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }
  }

  // alerts: array
  if (Array.isArray(slices.alerts)) {
    for (const a of slices.alerts as Array<Record<string, unknown>>) {
      const id = String(a.id || "");
      if (!id) continue;
      await db.collection("alerts").updateOne(
        { id },
        { $set: { ...a, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );
    }
  }

  // consents: { [personId]: {...} }
  if (slices.consents && typeof slices.consents === "object") {
    for (const [personId, c] of Object.entries(
      slices.consents as Record<string, Record<string, unknown>>,
    )) {
      await db.collection("consents").updateOne(
        { personId },
        {
          $set: { personId, ...c, at: Date.now(), updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }
  }

  // revisits: { [expertId]: array }
  if (slices.revisits && typeof slices.revisits === "object") {
    for (const [expertId, list] of Object.entries(
      slices.revisits as Record<string, Array<Record<string, unknown>>>,
    )) {
      if (!Array.isArray(list)) continue;
      await db.collection("revisits").deleteMany({ expertId, source: "app_state" });
      if (!list.length) continue;
      await db.collection("revisits").insertMany(
        list.map((item, i) => ({
          ...item,
          expertId,
          i,
          source: "app_state",
          updatedAt: now,
          createdAt: now,
        })),
      );
    }
  }

  // notifications: { [inbox]: array }
  if (slices.notifs && typeof slices.notifs === "object") {
    for (const [inbox, list] of Object.entries(
      slices.notifs as Record<string, Array<Record<string, unknown>>>,
    )) {
      if (!Array.isArray(list)) continue;
      await db.collection("notifications").deleteMany({ inbox, source: "app_state" });
      if (!list.length) continue;
      await db.collection("notifications").insertMany(
        list.map((n) => ({
          ...n,
          inbox,
          source: "app_state",
          updatedAt: now,
          createdAt: now,
        })),
      );
    }
  }

  // path_requests — reemplazo completo (aprobar/devolver debe borrar el pendiente)
  if (Array.isArray(slices.pathRequests)) {
    await db.collection("path_requests").deleteMany({});
    const rows = (slices.pathRequests as Array<Record<string, unknown>>).map((req) => {
      const id = String(req.id || `${req.code || "path"}-${req.scope || "all"}`);
      return {
        ...req,
        id,
        status: req.status || "pending",
        at: req.at || Date.now(),
        updatedAt: now,
        createdAt: now,
      };
    });
    if (rows.length) await db.collection("path_requests").insertMany(rows);
  }

  // path_overrides — espejo 1:1 con el mapa en app_state
  if (slices.pathOverrides && typeof slices.pathOverrides === "object") {
    const entries = Object.entries(slices.pathOverrides as Record<string, unknown>);
    const codes = entries.map(([code]) => code);
    if (codes.length) {
      await db.collection("path_overrides").deleteMany({ code: { $nin: codes } });
    } else {
      await db.collection("path_overrides").deleteMany({});
    }
    for (const [code, draft] of entries) {
      await db.collection("path_overrides").updateOne(
        { code },
        { $set: { code, draft, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );
    }
  }

  // rules → program_settings main
  if (slices.rules && typeof slices.rules === "object") {
    await db.collection("program_settings").updateOne(
      { key: "main" },
      { $set: { rules: slices.rules, updatedAt: now } },
      { upsert: true },
    );
  }

  // agent / ai logs (append-style replace from slice)
  if (Array.isArray(slices.agentLog)) {
    await db.collection("agent_log").deleteMany({ source: "app_state" });
    const rows = (slices.agentLog as Array<Record<string, unknown>>).slice(-200);
    if (rows.length) {
      await db.collection("agent_log").insertMany(
        rows.map((r) => ({ ...r, source: "app_state", createdAt: now })),
      );
    }
  }
  if (Array.isArray(slices.aiLog)) {
    await db.collection("ai_log").deleteMany({ source: "app_state" });
    const rows = (slices.aiLog as Array<Record<string, unknown>>).slice(-200);
    if (rows.length) {
      await db.collection("ai_log").insertMany(
        rows.map((r) => ({ ...r, source: "app_state", createdAt: now })),
      );
    }
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection("program_settings").findOne({ key: APP_STATE_KEY });
    const slices = doc ? pickAppStateSlices(doc as Record<string, unknown>) : {};

    // rules también pueden vivir en main
    if (!slices.rules) {
      const main = await db.collection("program_settings").findOne({ key: "main" });
      if (main?.rules) slices.rules = main.rules;
    }

    return NextResponse.json({ ok: true, slices, keys: APP_STATE_SLICES });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer app-state";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { slices?: Record<string, unknown> };
    if (!body.slices || typeof body.slices !== "object") {
      return NextResponse.json({ ok: false, error: "slices obligatorio" }, { status: 400 });
    }

    const slices = pickAppStateSlices(body.slices);
    const db = await getDb();
    const now = new Date();

    await db.collection("program_settings").updateOne(
      { key: APP_STATE_KEY },
      {
        $set: { ...slices, key: APP_STATE_KEY, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    await mirrorToCollections(db, slices);

    return NextResponse.json({ ok: true, saved: Object.keys(slices).length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar app-state";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
