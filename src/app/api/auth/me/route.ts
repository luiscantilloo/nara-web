import { NextResponse } from "next/server";
import { loadSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await loadSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de sesión";
    return NextResponse.json({ ok: false, error: message, user: null }, { status: 500 });
  }
}
