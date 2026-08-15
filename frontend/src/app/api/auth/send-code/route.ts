import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import path from "path";
import { sendAuthCodeEmail, type EmailCodeType } from "@watchamoo/backend/email";

// Load backend/.env so one place holds email secrets
dotenv.config({ path: path.join(process.cwd(), "../backend/.env") });
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      code?: string;
      type?: EmailCodeType;
    };

    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const code = String(body.code || "").trim();
    const type: EmailCodeType = body.type === "reset" ? "reset" : "verification";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid email is required." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "Invalid code." }, { status: 400 });
    }

    await sendAuthCodeEmail({ to: email, code, type });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
