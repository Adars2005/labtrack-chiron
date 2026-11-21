import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const live =
    process.env.NOTIFY_MODE === "live" && Boolean(process.env.RESEND_API_KEY);
  return NextResponse.json({ mode: live ? "live" : "test" });
}
