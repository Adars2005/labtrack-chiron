import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface NotifyPayload {
  notificationId?: string;
  caseId?: string;
  to?: string;
  subject?: string;
  body?: string;
  simulateFailure?: boolean;
}

function liveMode(): boolean {
  return process.env.NOTIFY_MODE === "live" && Boolean(process.env.RESEND_API_KEY);
}

/**
 * Automatically sends a "case ready" email when the client marks a case ready.
 * With no live credentials configured it still returns a successful captured
 * result so the whole flow works in demo mode without any manual step.
 */
export async function POST(request: Request) {
  let payload: NotifyPayload;
  try {
    payload = (await request.json()) as NotifyPayload;
  } catch {
    return NextResponse.json(
      { status: "Failed", error: "Invalid notification payload" },
      { status: 400 },
    );
  }

  const { to, subject, body } = payload;
  if (!to || !subject || !body || !/^\S+@\S+\.\S+$/.test(to)) {
    return NextResponse.json(
      { status: "Failed", error: "A valid recipient, subject and body are required" },
      { status: 400 },
    );
  }

  const live = liveMode();

  if (payload.simulateFailure) {
    return NextResponse.json({
      status: "Failed",
      mode: live ? "live" : "test",
      error: "Simulated provider error (mailbox temporarily unavailable)",
    });
  }

  if (!live) {
    return NextResponse.json({ status: "Sent (Simulation)", mode: "test" });
  }

  try {
    const from = process.env.NOTIFICATION_FROM_EMAIL || "LabTrack <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text: body }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        {
          status: "Failed",
          mode: "live",
          error: `Resend rejected the message (${response.status}): ${detail.slice(0, 240)}`,
        },
        { status: 502 },
      );
    }

    const result = (await response.json()) as { id?: string };
    return NextResponse.json({ status: "Sent", mode: "live", id: result.id });
  } catch (error) {
    return NextResponse.json(
      {
        status: "Failed",
        mode: "live",
        error: error instanceof Error ? error.message : "Unknown email provider error",
      },
      { status: 502 },
    );
  }
}
