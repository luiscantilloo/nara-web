import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { geminiComplete, isGeminiConfigured } from "@/lib/ai/gemini";
import { getDb } from "@/lib/db/mongodb";

export const runtime = "nodejs";

const TEO_VOICE = `
Eres TEO, acompañante con IA de NARA (salud mental post-sismo, Eje Cafetero, Colombia).
Trata de usted, con calidez, frases cortas y palabras sencillas, sin jerga clínica.
No das diagnósticos ni reemplazas a la psicóloga. No finjas ser humano ni sentir emociones.
Una sola pregunta por mensaje. Máximo 3 frases.
Nunca minimices, culpes, prometas mejoría ni hables de medicamentos.
Si detectas riesgo suicida o peligro inmediato, responde SOLO con la palabra CRISIS.
`.trim();

export async function POST(req: Request) {
  const auth = await requireUser(["paciente"]);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as {
      message?: string;
      history?: string;
      patientName?: string;
      place?: string;
      profile?: string;
      age?: number | string;
    };
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ ok: false, error: "Escriba un mensaje." }, { status: 400 });
    }

    const db = await getDb();
    const account = await db.collection("accounts").findOne({ id: auth.user.id });
    const patientId = account?.patientId ? String(account.patientId) : auth.user.id;
    const patient =
      (await db.collection("patients").findOne({ accountId: auth.user.id })) ||
      (await db.collection("patients").findOne({ id: patientId })) ||
      null;

    const name = String(body.patientName || patient?.name || auth.user.name || "Paciente");
    const fname = name.split(/\s+/)[0] || "Paciente";
    const place = String(body.place || patient?.place || "Quindío").split(",")[0];
    const profile = String(body.profile || patient?.profile || "P01");
    const age = body.age ?? patient?.age ?? "—";
    const history = String(body.history || "").slice(-2000);

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        ok: true,
        fallback: true,
        text: "",
      });
    }

    const prompt = `${TEO_VOICE}

Hablas con ${name}, ${age} años, de ${place}. Perfil ${profile}.
Puedes ofrecer la respiración 4-6, anotar un tema para la sesión o un recurso de Mi ruta.
Si solo saluda (hola, buenas), responde el saludo y pregunta cómo se siente, sin decir «gracias por contármelo».

Historial reciente:
${history || "(inicio de conversación)"}

${fname}: ${message}
TEO:`;

    const { text, model } = await geminiComplete(prompt, { temperature: 0.55, maxTokens: 400 });
    return NextResponse.json({ ok: true, text: text.trim(), model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error en TEO";
    return NextResponse.json({
      ok: true,
      fallback: true,
      text: "",
      error: message,
    });
  }
}
