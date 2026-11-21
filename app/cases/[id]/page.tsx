"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe2,
  Mail,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { DeadlineDisplay, DueBadge, StatusBadge } from "@/components/domain";
import { EmailPreviewModal, NotificationStatusChip } from "@/components/email-preview";
import { Button, Card, EmptyState, Label, Select } from "@/components/ui";
import { useLabTrack } from "@/lib/store";
import type { CaseStatus } from "@/lib/types";
import {
  demoNow,
  displayDeadline,
  dueInfo,
  formatReceived,
  formatTimelineTime,
} from "@/lib/timezone";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    cases,
    clinics,
    notifications,
    deadlineView,
    labTimezone,
    markReady,
    setCaseStatus,
    referenceNow,
    deliveryMode,
  } = useLabTrack();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);

  const kase = cases.find((c) => c.id === params.id);
  const clinic = clinics.find((c) => c.id === kase?.clinicId);
  const note = notifications.find((n) => n.caseId === params.id);

  if (!kase || !clinic) {
    return (
      <Card>
        <EmptyState
          title="Case not found"
          description="This case may have been removed or demo data was reset."
          action={
            <Link href="/cases">
              <Button variant="secondary">Back to cases</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const clinicDeadline = displayDeadline(kase.deadlineUtc, clinic.timezone);
  const labDeadline = displayDeadline(kase.deadlineUtc, labTimezone);
  const activeZone = deadlineView === "clinic" ? clinic.timezone : labTimezone;
  const activeDeadline =
    deadlineView === "clinic" ? clinicDeadline : labDeadline;
  const due = dueInfo(kase.deadlineUtc, clinic.timezone, demoNow(referenceNow));

  function handleReady() {
    const created = markReady(kase!.id);
    if (created) {
      setJustSent(true);
      setPreviewId(created.id);
    }
  }

  function handleStatusChange(value: CaseStatus) {
    if (value === "Ready") handleReady();
    else setCaseStatus(kase!.id, value);
  }

  return (
    <div className="space-y-5">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              {kase.reference}
            </h2>
            <StatusBadge status={kase.status} />
            <DueBadge deadlineUtc={kase.deadlineUtc} zone={clinic.timezone} />
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            {kase.treatment} · {kase.patientRef} · Received {formatReceived(kase.receivedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {note ? (
            <Button variant="secondary" onClick={() => setPreviewId(note.id)}>
              <Mail className="h-4 w-4" />
              View email
            </Button>
          ) : null}
          <Button onClick={handleReady} disabled={Boolean(note)}>
            <CheckCircle2 className="h-4 w-4" />
            {note ? "Ready · clinic notified" : "Mark as ready"}
          </Button>
        </div>
      </div>

      {justSent && note ? (
        <div className="animate-in flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            {deliveryMode === "live"
              ? "Case marked ready. Clinic email sent automatically."
              : "Case marked ready. Email captured automatically in the outbox."}
          </span>
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => setPreviewId(note.id)}
          >
            Preview email
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Case deadline
                </h3>
                <p className="text-xs text-ink-500">
                  One stored instant, rendered in any timezone
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                <Globe2 className="h-3 w-3" />
                {activeZone}
              </span>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-slate-50 p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Displaying in{" "}
                    {deadlineView === "clinic" ? "clinic local time" : "lab local time"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink-900">
                    {activeDeadline.date}
                  </p>
                  <p className="mt-1 text-lg font-medium tabular-nums text-ink-700">
                    {activeDeadline.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-ink-700">
                    {activeDeadline.offsetName}
                  </p>
                  <p className="text-xs tabular-nums text-ink-500">
                    UTC{activeDeadline.offset}
                  </p>
                  <p className="mt-2 text-[11px] text-ink-400">{due.label}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Clinic · {clinic.timezone}
                  </p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-ink-900">
                    {clinicDeadline.dateTime}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-500">
                    {clinicDeadline.offsetName} · {clinicDeadline.offset}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Lab · {labTimezone}
                  </p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-ink-900">
                    {labDeadline.dateTime}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-500">
                    {labDeadline.offsetName} · {labDeadline.offset}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">
                    Clinic-local date entered
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-900">{kase.dueDate}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">
                    Clinic-local time entered
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-900">{kase.dueTime}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">
                    Stored UTC instant
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-brand-700">
                    {kase.deadlineUtc}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-900">Activity timeline</h3>
              <p className="text-xs text-ink-500">Everything that happened to this case</p>
            </div>
            <div className="px-5 py-5">
              <div className="relative space-y-6 pl-5">
                <span className="absolute bottom-3 left-[5px] top-2 w-px bg-slate-200" />
                {[...kase.timeline]
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((event) => (
                    <div key={event.id} className="relative">
                      <span className="absolute -left-5 top-1 h-[11px] w-[11px] rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-200" />
                      <p className="text-sm font-medium text-ink-900">{event.label}</p>
                      {event.detail ? (
                        <p className="mt-0.5 text-xs text-ink-500">{event.detail}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-ink-400">
                        {formatTimelineTime(event.at)} · {event.actor}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-900">Case details</h3>
            </div>
            <dl className="divide-y divide-slate-100 px-5">
              {[
                { label: "Case ID", value: kase.reference },
                { label: "Patient reference", value: kase.patientRef },
                { label: "Treatment", value: kase.treatment },
                { label: "Referring dentist", value: kase.dentist },
                { label: "Received", value: formatReceived(kase.receivedAt) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4 py-3">
                  <dt className="text-xs text-ink-500">{row.label}</dt>
                  <dd className="text-right text-xs font-medium text-ink-900">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-slate-100 px-5 py-4">
              <Label hint="Changing to Ready sends the clinic email automatically">
                Update status
              </Label>
              <Select
                aria-label="Update case status"
                value={kase.status}
                onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
              >
                <option value="Received">Received</option>
                <option value="In progress">In progress</option>
                <option value="Ready">Ready</option>
                <option value="Completed">Completed</option>
              </Select>
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-900">Clinic</h3>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-ink-400" />
                <div>
                  <p className="text-sm font-medium text-ink-900">{clinic.name}</p>
                  <p className="text-xs text-ink-500">{clinic.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe2 className="mt-0.5 h-4 w-4 text-ink-400" />
                <div>
                  <p className="text-sm font-medium text-ink-900">{clinic.timezone}</p>
                  <p className="text-xs text-ink-500">Authoritative for deadlines</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Stethoscope className="mt-0.5 h-4 w-4 text-ink-400" />
                <div>
                  <p className="text-sm font-medium text-ink-900">{clinic.contactName}</p>
                  <p className="text-xs text-ink-500">{clinic.contactEmail}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-900">Clinic notification</h3>
            </div>
            <div className="px-5 py-4">
              {note ? (
                <div className="space-y-3">
                  <NotificationStatusChip status={note.status} />
                  <p className="text-xs text-ink-500">
                    Sent to <span className="font-medium text-ink-900">{note.to}</span>
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewId(note.id)}
                  >
                    <Mail className="h-3.5 w-3.5" /> Preview email
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-ink-500">
                    No notification has been sent for this case.
                  </p>
                  <Button size="sm" onClick={handleReady}>
                    <BellRing className="h-3.5 w-3.5" /> Mark as ready & notify
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-ink-500">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Deadlines are stored as UTC instants derived from the clinic's local
            date and time. Changing your device or lab timezone never changes the
            underlying deadline.
          </div>
        </div>
      </div>

      <EmailPreviewModal
        notificationId={previewId}
        onClose={() => {
          setPreviewId(null);
          setJustSent(false);
        }}
      />
    </div>
  );
}
