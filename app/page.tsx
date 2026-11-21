"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CircleCheck,
  Clock3,
  Layers3,
} from "lucide-react";
import { useMemo } from "react";
import { DeadlineDisplay, DueBadge, StatusBadge } from "@/components/domain";
import { EmptyState } from "@/components/ui";
import { demoNow, dueInfo, displayDeadline, formatTimelineTime } from "@/lib/timezone";
import { useLabTrack } from "@/lib/store";
import type { LabCase } from "@/lib/types";

export default function OverviewPage() {
  const { cases, clinics, deadlineView, labTimezone, notifications, referenceNow } =
    useLabTrack();

  const data = useMemo(() => {
    const now = demoNow(referenceNow);
    const clinicOf = (c: LabCase) => clinics.find((cl) => cl.id === c.clinicId);
    const active = cases.filter((c) => c.status !== "Completed");
    const ready = active.filter((c) => c.status === "Ready");
    const overdue = active.filter((c) => {
      const zone = clinicOf(c)?.timezone ?? labTimezone;
      return dueInfo(c.deadlineUtc, zone, now).bucket === "overdue";
    });
    const today = active.filter((c) => {
      const zone = clinicOf(c)?.timezone ?? labTimezone;
      return dueInfo(c.deadlineUtc, zone, now).bucket === "today";
    });

    const attention = [...overdue, ...today, ...ready.filter((c) => !today.includes(c))]
      .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
      .slice(0, 6);

    const upcoming = active
      .filter((c) => {
        const zone = clinicOf(c)?.timezone ?? labTimezone;
        return dueInfo(c.deadlineUtc, zone, now).bucket !== "overdue";
      })
      .sort((a, b) => a.deadlineUtc.localeCompare(b.deadlineUtc))
      .slice(0, 5);

    const activity = cases
      .flatMap((c) =>
        c.timeline.map((e) => ({ ...e, caseRef: c.reference, caseId: c.id })),
      )
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6);

    return { active, ready, overdue, today, attention, upcoming, activity, clinicOf };
  }, [cases, clinics, labTimezone, referenceNow]);

  const metrics = [
    {
      label: "Active cases",
      value: data.active.length,
      note: "Across all clinics",
      icon: Layers3,
      tone: "bg-brand-50 text-brand-700",
    },
    {
      label: "Due today",
      value: data.today.length,
      note: "In clinic local time",
      icon: CalendarCheck2,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Overdue",
      value: data.overdue.length,
      note: "Needs attention now",
      icon: AlertTriangle,
      tone: "bg-rose-50 text-rose-700",
    },
    {
      label: "Ready for delivery",
      value: data.ready.length,
      note: "Awaiting clinic pickup",
      icon: CircleCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink-900">
            Good morning, team
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Here is what needs attention in the lab today.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-ink-500 shadow-sm">
          <Clock3 className="h-4 w-4 text-ink-400" />
          Deadlines shown in{" "}
          <strong className="font-semibold text-ink-900">
            {deadlineView === "clinic" ? "clinic local time" : `lab time (${labTimezone})`}
          </strong>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-ink-500">{m.label}</p>
                  <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight tabular-nums text-ink-900">
                    {m.value}
                  </p>
                </div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.tone}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              </div>
              <p className="mt-3 text-[11px] text-ink-400">{m.note}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Needs attention</h3>
              <p className="text-xs text-ink-500">Overdue, due today and ready cases</p>
            </div>
            <Link
              href="/cases"
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data.attention.length === 0 ? (
            <EmptyState
              title="Nothing urgent"
              description="No overdue or due-today cases, and nothing waiting for delivery."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.attention.map((kase) => {
                const clinic = data.clinicOf(kase)!;
                return (
                  <Link
                    key={kase.id}
                    href={`/cases/${kase.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50/70"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">
                          {kase.reference}
                        </span>
                        <StatusBadge status={kase.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {kase.treatment} · {clinic.name}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <DeadlineDisplay
                        kase={kase}
                        clinic={clinic}
                        view={deadlineView}
                        labTimezone={labTimezone}
                        compact
                      />
                    </div>
                    <DueBadge
                      deadlineUtc={kase.deadlineUtc}
                      zone={clinic.timezone}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-900">Upcoming deadlines</h3>
              <p className="text-xs text-ink-500">Next five cases in the queue</p>
            </div>
            <div className="divide-y divide-slate-100">
              {data.upcoming.map((kase) => {
                const clinic = data.clinicOf(kase)!;
                const zone =
                  deadlineView === "clinic" ? clinic.timezone : labTimezone;
                const d = displayDeadline(kase.deadlineUtc, zone);
                return (
                  <Link
                    key={kase.id}
                    href={`/cases/${kase.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50/70"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-[11px] font-bold text-ink-500">
                      {kase.reference.slice(-3)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink-900">
                        {kase.treatment}
                      </p>
                      <p className="truncate text-[11px] text-ink-500">{clinic.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium tabular-nums text-ink-900">
                        {d.date.replace(" 2026", "")}
                      </p>
                      <p className="text-[10px] text-ink-400">{d.time}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-ink-900">Recent activity</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                {notifications.length} emails
              </span>
            </div>
            <div className="space-y-3.5 px-5 py-4">
              {data.activity.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink-900">
                      {event.label}
                    </p>
                    <p className="truncate text-[11px] text-ink-500">
                      {event.caseRef} · {formatTimelineTime(event.at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
