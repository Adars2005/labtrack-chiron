"use client";

import { Globe2 } from "lucide-react";
import { demoNow, dueInfo, displayDeadline } from "@/lib/timezone";
import { useLabTrack } from "@/lib/store";
import type { CaseStatus, Clinic, LabCase, DeadlineView } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<CaseStatus, string> = {
  Received: "bg-slate-100 text-slate-600 ring-slate-200",
  "In progress": "bg-brand-50 text-brand-700 ring-brand-100",
  Ready: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Completed: "bg-slate-50 text-slate-400 ring-slate-100",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "Ready"
            ? "bg-emerald-500"
            : status === "In progress"
              ? "bg-brand-500"
              : status === "Received"
                ? "bg-slate-400"
                : "bg-slate-300",
        )}
      />
      {status}
    </span>
  );
}

export function DueBadge({
  deadlineUtc,
  zone,
}: {
  deadlineUtc: string;
  zone: string;
}) {
  const { referenceNow } = useLabTrack();
  const info = dueInfo(deadlineUtc, zone, demoNow(referenceNow));
  const styles: Record<string, string> = {
    overdue: "bg-rose-50 text-rose-700 ring-rose-100",
    today: "bg-amber-50 text-amber-700 ring-amber-100",
    soon: "bg-amber-50/70 text-amber-700 ring-amber-100",
    later: "bg-slate-50 text-slate-500 ring-slate-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset",
        styles[info.bucket],
      )}
    >
      {info.label}
    </span>
  );
}

export function DeadlineDisplay({
  kase,
  clinic,
  view,
  labTimezone,
  compact = false,
}: {
  kase: LabCase;
  clinic: Clinic;
  view: DeadlineView;
  labTimezone: string;
  compact?: boolean;
}) {
  const zone = view === "clinic" ? clinic.timezone : labTimezone;
  const d = displayDeadline(kase.deadlineUtc, zone);

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "font-medium tabular-nums text-ink-900",
          compact ? "text-[13px]" : "text-sm",
        )}
      >
        {d.date}
      </span>
      <span className="flex items-center gap-1 text-[11px] tabular-nums text-ink-500">
        {d.time}
        <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">
          <Globe2 className="h-2.5 w-2.5" />
          {zone}
        </span>
      </span>
    </div>
  );
}
