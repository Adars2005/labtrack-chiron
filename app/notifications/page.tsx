"use client";

import { BellRing, CheckCircle2, Mail, RotateCcw, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EmailPreviewModal, NotificationStatusChip } from "@/components/email-preview";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { useLabTrack } from "@/lib/store";
import { formatTimelineTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const {
    notifications,
    cases,
    clinics,
    simulateFailure,
    setSimulateFailure,
    retryNotification,
    deliveryMode,
  } = useLabTrack();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "failed">("all");
  const [testEmail, setTestEmail] = useState("");
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "failed">(
    "idle",
  );
  const [testMessage, setTestMessage] = useState("");

  async function sendTestEmail(e: FormEvent) {
    e.preventDefault();
    setTestState("sending");
    setTestMessage("");
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          subject: "LabTrack — test email",
          body:
            "Hello from LabTrack.\n\nThis is a test message to verify that ready-case email delivery is working correctly.\n\nThanks,\nLabTrack team",
        }),
      });
      const result = (await response.json()) as {
        status?: string;
        error?: string;
      };
      if (result.status === "Failed") {
        setTestState("failed");
        setTestMessage(result.error ?? "Delivery failed");
      } else {
        setTestState("sent");
        setTestMessage(
          deliveryMode === "live"
            ? "Sent — check the inbox."
            : "Captured in test mode.",
        );
      }
    } catch (error) {
      setTestState("failed");
      setTestMessage(
        error instanceof Error ? error.message : "Could not reach the email service",
      );
    }
  }

  const shown = notifications.filter((n) =>
    filter === "failed" ? n.status === "Failed" : true,
  );
  const sent = notifications.filter(
    (n) => n.status === "Sent (Simulation)" || n.status === "Sent",
  ).length;
  const failed = notifications.filter((n) => n.status === "Failed").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
            <Send className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {deliveryMode === "live"
                ? "Live delivery is on — emails send automatically"
                : "Test mode is on — no real emails are sent"}
            </p>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-amber-800/80">
              Every “Mark as ready” action automatically sends the email through
              the server API and writes the delivery record here. One notification
              per case, even if the button is clicked twice.
            </p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-medium text-amber-900 shadow-sm">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-amber-600"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
          />
          Simulate delivery failure
        </label>
        <form
          onSubmit={sendTestEmail}
          className="flex w-full flex-wrap items-center gap-2 border-t border-amber-200/70 pt-3 lg:w-auto lg:border-0 lg:pt-0"
        >
          <Input
            type="email"
            required
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Send a test email to…"
            className="h-9 w-full bg-white sm:w-[230px]"
            aria-label="Test email recipient"
          />
          <Button type="submit" size="sm" disabled={testState === "sending"}>
            <Send className="h-3.5 w-3.5" />
            {testState === "sending" ? "Sending…" : "Send test"}
          </Button>
          {testState !== "idle" ? (
            <span
              className={`text-xs font-medium ${testState === "failed" ? "text-rose-700" : "text-emerald-700"}`}
            >
              {testMessage}
            </span>
          ) : null}
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total notifications", value: notifications.length, icon: BellRing },
          { label: "Captured / sent", value: sent, icon: CheckCircle2 },
          { label: "Failed", value: failed, icon: RotateCcw },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-ink-500">{m.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink-900">
                  {m.value}
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-ink-500">
                <Icon className="h-4 w-4" />
              </span>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Delivery log</h3>
            <p className="text-xs text-ink-500">All captured clinic emails</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
            {(["all", "failed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition",
                  filter === f
                    ? "bg-white text-ink-900 shadow-sm"
                    : "text-ink-500 hover:text-ink-900",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-5 w-5" />}
            title={filter === "failed" ? "No failed deliveries" : "No notifications yet"}
            description={
              filter === "failed"
                ? "Everything captured so far was successful."
                : "Open a case and click “Mark as ready” to capture a clinic email."
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {shown.map((note) => {
              const kase = cases.find((c) => c.id === note.caseId);
              const clinic = clinics.find((c) => c.id === note.clinicId);
              return (
                <div
                  key={note.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm font-semibold text-ink-900">
                      {note.subject}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {kase?.reference} · {clinic?.name} → {note.to}
                    </p>
                  </div>
                  <p className="hidden text-[11px] text-ink-400 md:block">
                    {formatTimelineTime(note.createdAt)}
                  </p>
                  <NotificationStatusChip status={note.status} />
                  {note.status === "Failed" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => retryNotification(note.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Retry
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewId(note.id)}
                  >
                    Preview
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <EmailPreviewModal
        notificationId={previewId}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}
