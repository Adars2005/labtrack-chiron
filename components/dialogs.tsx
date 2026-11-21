"use client";

import { ArrowRight, Building2, CalendarClock, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { displayDeadline, COMMON_TIMEZONES, deadlineToUtc } from "@/lib/timezone";
import { useLabTrack } from "@/lib/store";
import type { Clinic } from "@/lib/types";
import { Button, Input, Label, Modal, Select } from "./ui";

const TREATMENTS = [
  "Zirconia Crown",
  "Bridge",
  "Implant Abutment",
  "Porcelain Veneer",
  "CEREC Crown",
  "Night Guard",
  "Inlay",
  "Full Denture",
  "Onlay",
  "Aligner Retainer",
];

export function NewCaseDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (reference: string) => void;
}) {
  const { clinics, labTimezone, addCase } = useLabTrack();
  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? "");
  const [treatment, setTreatment] = useState(TREATMENTS[0]);
  const [patientRef, setPatientRef] = useState("");
  const [dentist, setDentist] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("17:00");
  const [error, setError] = useState("");

  const clinic = clinics.find((c) => c.id === clinicId);
  const previewUtc = dueDate && clinic ? deadlineToUtc(dueDate, dueTime, clinic.timezone) : null;
  const clinicPreview = previewUtc ? displayDeadline(previewUtc, clinic!.timezone) : null;
  const labPreview = previewUtc ? displayDeadline(previewUtc, labTimezone) : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = addCase({
        clinicId,
        treatment,
        patientRef,
        dentist,
        dueDate,
        dueTime,
      });
      onCreated?.(created.reference);
      onClose();
      setPatientRef("");
      setDentist("");
      setDueDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create case");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New case"
      description="The deadline is captured in the clinic's timezone and stored as one UTC instant."
      width="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Clinic</Label>
            <Select
              value={clinicId}
              onChange={(e) => {
                setClinicId(e.target.value);
                const next = clinics.find((c) => c.id === e.target.value);
                setDentist(next?.contactName ?? "");
              }}
              required
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.country}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Treatment</Label>
            <Select value={treatment} onChange={(e) => setTreatment(e.target.value)}>
              {TREATMENTS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label hint="De-identified">Patient reference</Label>
            <Input
              value={patientRef}
              onChange={(e) => setPatientRef(e.target.value)}
              placeholder="PAT-2148"
            />
          </div>
          <div>
            <Label>Referring dentist</Label>
            <Input
              value={dentist}
              onChange={(e) => setDentist(e.target.value)}
              placeholder={clinic?.contactName ?? "Dr. Name"}
            />
          </div>
          <div>
            <Label hint="Clinic local date">Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label hint="Clinic local time">Due time</Label>
            <Input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              required
            />
          </div>
        </div>

        {clinicPreview && labPreview ? (
          <div className="animate-in rounded-xl border border-brand-100 bg-brand-50/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <CalendarClock className="h-4 w-4" />
              Timezone preview — same instant, two local views
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-[11px] text-ink-500">Clinic · {clinic!.timezone}</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {clinicPreview.dateTime}
                </p>
                <p className="text-[11px] text-ink-500">{clinicPreview.offsetName}</p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-[11px] text-ink-500">Lab · {labTimezone}</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {labPreview.dateTime}
                </p>
                <p className="text-[11px] text-ink-500">{labPreview.offsetName}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-brand-700">
              Stored UTC instant <ArrowRight className="h-3 w-3" />
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">
                {previewUtc}
              </code>
            </p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!clinic || !dueDate}>
            <Plus className="h-4 w-4" />
            Create case
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewClinicDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (clinic: Clinic) => void;
}) {
  const { addClinic } = useLabTrack();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Europe/London");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = addClinic({
        name,
        country,
        timezone,
        contactName,
        contactEmail,
      });
      onCreated?.(created);
      onClose();
      setName("");
      setCountry("");
      setContactName("");
      setContactEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add clinic");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add clinic"
      description="The clinic timezone is authoritative for its case deadlines."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Clinic name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Country</Label>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="United Kingdom"
            required
          />
        </div>
        <div>
          <Label hint="IANA zone">Timezone</Label>
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
          <Input
            className="mt-2"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Or type any IANA zone"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Contact</Label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Dr. Emily Clarke"
              required
            />
          </div>
          <div>
            <Label>Notification email</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="reception@clinic.com"
              required
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-ink-500">
          <Building2 className="h-4 w-4 shrink-0" />
          Deadlines entered for this clinic will be interpreted in {timezone}.
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Add clinic
          </Button>
        </div>
      </form>
    </Modal>
  );
}
