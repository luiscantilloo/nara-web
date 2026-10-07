import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/requireUser";
import { geminiComplete, isGeminiConfigured } from "@/lib/ai/gemini";

export const runtime = "nodejs";

const APP_OVERVIEW = `
NARA es una plataforma de salud mental post-sismo (Eje Cafetero / Colombia).
Roles: Administrador, Experto de campo, Clínico, Paciente, Observador.
Módulos clave: territorios, captación (people), pacientes clínicos, rutas de cuidado, activos (manillas/tablets), informes, TEO (asistente).
La app del paciente tiene módulos activables: ánimo, chat TEO, cursos/cuentos, videos, técnicas, WhatsApp, llamadas, revisita, grupo, ayudas, clínica, manilla, historial.
El admin habilita módulos por paciente; el paciente puede ocultar de su vista los que no quiera ver (sin desactivarlos del programa).
`.trim();

async function buildContext(roleId: string, question: string) {
  const db = await getDb();
  const q = question.toLowerCase();
  const wantsPatient =
    /paciente|persona|usuario|correo|email|tel[eé]fono|municipio|edad|caseload|ficha/i.test(q);
  const nameHint = question.match(/["«]([^"»]+)["»]/)?.[1] || question.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,3})\b/)?.[1];

  const parts: string[] = [APP_OVERVIEW, `Rol del usuario que pregunta: ${roleId}`];

  if (roleId === "observador") {
    const nPeople = await db.collection("people").countDocuments();
    const nPatients = await db.collection("patients").countDocuments();
    const byTerr = await db
      .collection("people")
      .aggregate([{ $group: { _id: "$terr", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 12 }])
      .toArray();
    parts.push(
      "Datos agregados (sin PII):",
      `people=${nPeople}, patients=${nPatients}`,
      "territorios top: " + byTerr.map((t) => `${t._id || "—"}:${t.n}`).join(", "),
    );
    return parts.join("\n");
  }

  if (roleId === "admin" || roleId === "clinico" || roleId === "experto") {
    const nAccounts = await db.collection("accounts").countDocuments();
    const nPatients = await db.collection("patients").countDocuments();
    const nPeople = await db.collection("people").countDocuments();
    const nExperts = await db.collection("experts").countDocuments();
    const nTerr = await db.collection("territories").countDocuments();
    parts.push(
      `Resumen programa: accounts=${nAccounts}, patients=${nPatients}, people=${nPeople}, experts=${nExperts}, territories=${nTerr}`,
    );

    if (wantsPatient) {
      const filter: Record<string, unknown> = {};
      if (nameHint && nameHint.length > 2) {
        filter.$or = [
          { name: { $regex: nameHint, $options: "i" } },
          { email: { $regex: nameHint, $options: "i" } },
          { place: { $regex: nameHint, $options: "i" } },
          { municipio: { $regex: nameHint, $options: "i" } },
        ];
      }
      const rows = await db
        .collection("patients")
        .find(filter)
        .project({
          id: 1,
          name: 1,
          age: 1,
          place: 1,
          email: 1,
          phone: 1,
          profile: 1,
          signal: 1,
          expert: 1,
          modulesEnabled: 1,
          modulesVisible: 1,
          source: 1,
        })
        .limit(nameHint ? 8 : 25)
        .toArray();
      parts.push(
        "Pacientes (muestra o coincidencias):",
        JSON.stringify(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            age: r.age,
            place: r.place,
            email: r.email,
            phone: r.phone,
            profile: r.profile,
            signal: r.signal,
            modulesEnabled: r.modulesEnabled,
            source: r.source,
          })),
        ),
      );
    }

    if (/usuario|cuenta|admin|experto|cl[ií]nico|rol/i.test(q)) {
      const accounts = await db
        .collection("accounts")
        .find({})
        .project({ id: 1, name: 1, email: 1, role: 1, roleId: 1, status: 1, terr: 1 })
        .limit(40)
        .toArray();
      parts.push("Cuentas (sin secretos):", JSON.stringify(accounts));
    }
  }

  return parts.join("\n\n");
}

export async function POST(req: Request) {
  const auth = await requireUser(["admin", "experto", "clinico", "observador"]);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as { question?: string; role?: string };
    const question = String(body.question || "").trim();
    if (!question) {
      return NextResponse.json({ ok: false, error: "Escriba una pregunta." }, { status: 400 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        ok: true,
        fallback: true,
        text:
          "TEO con Gemini aún no está configurado. Agregue GEMINI_API_KEY en .env.local y reinicie el servidor. Mientras tanto use las consultas rápidas del panel.",
      });
    }

    const context = await buildContext(auth.user.roleId, question);
    const prompt = `Eres TEO, el asistente de datos de NARA (salud mental). Responde en español, claro y breve (máx. ~180 palabras).
Usa SOLO el contexto y tu conocimiento general de la app. Si no hay dato suficiente, dilo.
No inventes cifras. No des diagnósticos clínicos. No reveles contraseñas ni hashes.
Para observadores: solo datos agregados, nunca nombres ni contactos.

CONTEXTO:
${context}

PREGUNTA:
${question}`;

    const { text, model } = await geminiComplete(prompt);
    return NextResponse.json({ ok: true, text, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error en TEO";
    // Respuesta usable en el panel (evita el inglés crudo de Gemini)
    return NextResponse.json({
      ok: true,
      fallback: true,
      text: message.includes("saturado")
        ? message
        : `No pude consultar a Gemini ahora: ${message}. Intente de nuevo o use las consultas rápidas.`,
    });
  }
}
