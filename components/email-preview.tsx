"use client";

import { AlertCircle, CheckCircle2, Clock3, Mail, RotateCcw } from "lucide-react";
import { useLabTrack } from "@/lib/store";
import { formatTimelineTime } from "@/lib/timezone";
import type { NotificationStatus } from "@/lib/types";
import { Button, Modal } from "./ui";

export function NotificationStatusChip({ status }: { status: NotificationStatus }) {
  const styles: Record<NotificationStatus, string> = {
    Sending: "bg-amber-50 text-amber-700 ring-amber-100",
    "Sent (Simulation)": "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Sent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Failed: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  const Icon =
    status === "Failed"
      ? AlertCircle
      : status === "Sending"
        ? Clock3
        : CheckCircle2;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

export function EmailPreviewModal({
  notificationId,
  onClose,
}: {
  notificationId: string | null;
  onClose: () => void;
}) {
  const { notifications, cases, clinics, retryNotification } = useLabTrack();
  const note = notifications.find((n) => n.id === notificationId);
  const kase = cases.find((c) => c.id === note?.caseId);
  const clinic = clinics.find((c) => c.id === note?.clinicId);

  return (
    <Modal
      open={Boolean(note)}
      onClose={onClose}
      title="Email preview"
      description="Test mode — this message was captured, not delivered."
      width="max-w-2xl"
    >
      {note ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <Mail className="h-4 w-4 text-ink-400" />
              To <strong className="font-semibold text-ink-900">{note.to}</strong>
            </div>
            <NotificationStatusChip status={note.status} />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <p className="text-sm font-semibold text-ink-900">{note.subject}</p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                {kase?.reference} · {clinic?.name} ·{" "}
                {formatTimelineTime(note.createdAt)}
              </p>
            </div>
            <pre className="whitespace-pre-wrap px-5 py-5 font-sans text-sm leading-relaxed text-ink-700">
              {note.body}
            </pre>
          </div>

          {note.error ? (
            <p className="rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {note.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            {note.status === "Failed" ? (
              <Button variant="secondary" onClick={() => retryNotification(note.id)}>
                <RotateCcw className="h-4 w-4" />
                Retry send
              </Button>
            ) : null}
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
