"use client";

import Link from "next/link";
import { ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { DeadlineDisplay, DueBadge, StatusBadge } from "@/components/domain";
import { EmptyState, Input, Select } from "@/components/ui";
import { useLabTrack } from "@/lib/store";
import { demoNow, dueInfo } from "@/lib/timezone";
import type { CaseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statuses: Array<CaseStatus | "All statuses"> = [
  "All statuses",
  "Received",
  "In progress",
  "Ready",
  "Completed",
];

type QuickFilter = "all" | "overdue" | "today" | "ready";

export default function CasesPage() {
  const { cases, clinics, deadlineView, labTimezone, referenceNow } =
    useLabTrack();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CaseStatus | "All statuses">("All statuses");
  const [clinicId, setClinicId] = useState("all");
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [sort, setSort] = useState("due-asc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = demoNow(referenceNow);
    const result = cases.filter((c) => {
      const clinic = clinics.find((cl) => cl.id === c.clinicId);
      if (!clinic) return false;
      if (status !== "All statuses" && c.status !== status) return false;
      if (clinicId !== "all" && c.clinicId !== clinicId) return false;
      if (quick === "ready" && c.status !== "Ready") return false;
      if (
        quick === "overdue" &&
        dueInfo(c.deadlineUtc, clinic.timezone, now).bucket !== "overdue"
      )
        return false;
      if (
        quick === "today" &&
        dueInfo(c.deadlineUtc, clinic.timezone, now).bucket !== "today"
      )
        return false;
      if (
        q &&
        ![c.reference, c.treatment, c.patientRef, clinic.name, clinic.country]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });

    result.sort((a, b) => {
      if (sort === "due-desc") return b.deadlineUtc.localeCompare(a.deadlineUtc);
      if (sort === "status") return a.status.localeCompare(b.status);
      if (sort === "recent") return b.receivedAt.localeCompare(a.receivedAt);
      return a.deadlineUtc.localeCompare(b.deadlineUtc);
    });
    return result;
  }, [cases, clinics, query, status, clinicId, quick, sort, referenceNow]);

  const chips: Array<{ key: QuickFilter; label: string }> = [
    { key: "all", label: "All cases" },
    { key: "overdue", label: "Overdue" },
    { key: "today", label: "Due today" },
    { key: "ready", label: "Ready" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setQuick(chip.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                quick === chip.key
                  ? "bg-ink-900 text-white"
                  : "text-ink-500 hover:bg-slate-50 hover:text-ink-900",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-500">
          Showing <strong className="font-semibold text-ink-900">{rows.length}</strong>{" "}
          of {cases.length} cases
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              className="pl-9"
              placeholder="Search by case, clinic, treatment or patient ref…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select
            aria-label="Filter by status"
            className="w-auto min-w-[140px]"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select
            aria-label="Filter by clinic"
            className="w-auto min-w-[160px]"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
          >
            <option value="all">All clinics</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="hidden items-center gap-1.5 text-xs text-ink-400 xl:flex">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Sort
          </div>
          <Select
            aria-label="Sort cases"
            className="w-auto min-w-[150px]"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="due-asc">Due soonest</option>
            <option value="due-desc">Due latest</option>
            <option value="status">Status</option>
            <option value="recent">Recently received</option>
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="No matching cases"
            description="Try a different search term or clear the filters."
            action={
              <button
                className="text-xs font-semibold text-brand-600 hover:underline"
                onClick={() => {
                  setQuery("");
                  setStatus("All statuses");
                  setClinicId("all");
                  setQuick("all");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Case</th>
                  <th className="px-4 py-3">Clinic</th>
                  <th className="px-4 py-3">Treatment</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((kase) => {
                  const clinic = clinics.find((c) => c.id === kase.clinicId)!;
                  return (
                    <tr
                      key={kase.id}
                      className="group cursor-pointer transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/cases/${kase.id}`} className="block">
                          <span className="text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                            {kase.reference}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-ink-400">
                            {kase.patientRef}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/cases/${kase.id}`} className="block">
                          <span className="block text-sm text-ink-900">{clinic.name}</span>
                          <span className="text-[11px] text-ink-400">
                            {clinic.country}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-700">
                        {kase.treatment}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/cases/${kase.id}`} className="block">
                          <DeadlineDisplay
                            kase={kase}
                            clinic={clinic}
                            view={deadlineView}
                            labTimezone={labTimezone}
                          />
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={kase.status} />
                          <DueBadge
                            deadlineUtc={kase.deadlineUtc}
                            zone={clinic.timezone}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/cases/${kase.id}`}>
                          <ChevronRight className="ml-auto h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
