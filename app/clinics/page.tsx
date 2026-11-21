"use client";

import {
  Building2,
  Clock3,
  Globe2,
  Mail,
  Plus,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NewClinicDialog } from "@/components/dialogs";
import { Button, Card } from "@/components/ui";
import { useLabTrack } from "@/lib/store";
import { localDateNow, localTimeNow } from "@/lib/timezone";

export default function ClinicsPage() {
  const { clinics, cases, labTimezone } = useLabTrack();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs text-ink-500 shadow-sm">
          <Globe2 className="h-4 w-4 text-brand-600" />
          Lab timezone:{" "}
          <strong className="font-semibold text-ink-900">{labTimezone}</strong>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add clinic
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clinics.map((clinic) => {
          const count = cases.filter((c) => c.clinicId === clinic.id).length;
          return (
            <Card key={clinic.id} className="p-5 transition hover:border-slate-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{clinic.name}</p>
                    <p className="text-xs text-ink-500">{clinic.country}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-ink-500">
                  {count} cases
                </span>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <Clock3 className="h-3.5 w-3.5" /> Local time now
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums text-ink-900">
                  {localTimeNow(clinic.timezone)}
                </p>
                <p className="text-[11px] text-ink-500">
                  {localDateNow(clinic.timezone)} · {clinic.timezone}
                </p>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center gap-2 text-ink-500">
                  <UserRound className="h-3.5 w-3.5 text-ink-400" />
                  {clinic.contactName}
                </div>
                <div className="flex items-center gap-2 text-ink-500">
                  <Mail className="h-3.5 w-3.5 text-ink-400" />
                  <span className="truncate">{clinic.contactEmail}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-wrap items-start gap-4 border-brand-100 bg-brand-50/40 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
          <Globe2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">
            Why each clinic needs a timezone
          </p>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-500">
            A deadline like “25 Nov 2026, 5:00 PM” only means one thing once you
            know whose clock it is on. LabTrack interprets that entry in the
            clinic's IANA timezone, stores a single UTC instant, and renders it
            correctly for the clinic and for the lab — including daylight-saving
            changes. Device and server timezones never affect the deadline.
          </p>
        </div>
      </Card>

      <NewClinicDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
