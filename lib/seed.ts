import { DateTime } from "luxon";
import { deadlineToUtc, displayDeadline } from "./timezone";
import type { AppState, Clinic, LabCase, Notification, TimelineEvent } from "./types";

export const DEFAULT_LAB_TIMEZONE = "Asia/Kolkata";
export const DEMO_ANCHOR = "2026-11-22";

const clinics: Clinic[] = [
  {
    id: "clinic_uk",
    name: "Smile Dental UK",
    country: "United Kingdom",
    timezone: "Europe/London",
    contactName: "Dr. Emily Clarke",
    contactEmail: "reception@smiledental.co.uk",
  },
  {
    id: "clinic_ae",
    name: "Pearl Dental Dubai",
    country: "United Arab Emirates",
    timezone: "Asia/Dubai",
    contactName: "Dr. Omar Haddad",
    contactEmail: "cases@pearldental.ae",
  },
  {
    id: "clinic_us",
    name: "Bright Smiles US",
    country: "United States",
    timezone: "America/New_York",
    contactName: "Dr. Sarah Miller",
    contactEmail: "lab@brightsmiles.us",
  },
  {
    id: "clinic_no",
    name: "Nordlys Klinikk",
    country: "Norway",
    timezone: "Europe/Oslo",
    contactName: "Dr. Ingrid Solberg",
    contactEmail: "post@nordlysklinikk.no",
  },
  {
    id: "clinic_sf",
    name: "Harbor Dental Group",
    country: "United States",
    timezone: "America/Los_Angeles",
    contactName: "Dr. James Park",
    contactEmail: "cases@harbordental.com",
  },
  {
    id: "clinic_au",
    name: "Azure Dental Studio",
    country: "Australia",
    timezone: "Australia/Sydney",
    contactName: "Dr. Mia Thompson",
    contactEmail: "studio@azuredental.au",
  },
  {
    id: "clinic_ca",
    name: "Clearview Dentistry",
    country: "Canada",
    timezone: "America/Toronto",
    contactName: "Dr. Liam Bennett",
    contactEmail: "orders@clearview.ca",
  },
  {
    id: "clinic_de",
    name: "Zahnstudio München",
    country: "Germany",
    timezone: "Europe/Berlin",
    contactName: "Dr. Anna Weber",
    contactEmail: "labor@zahnstudio.de",
  },
];

const treatments = [
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

const dueTimes = ["09:00", "12:00", "17:00", "17:00", "16:30", "15:00"];

const readySet = new Set([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]);
const overdueSet = new Set([2, 9, 15, 21]);
const dueTodaySet = new Set([0, 3, 5, 8, 11, 14, 17]);
const overdueOffsets: Record<number, number> = { 2: -4, 9: -3, 15: -2, 21: -1 };
const readyOffsets = [2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 7, 8];

function shiftDate(isoDate: string, days: number): string {
  return DateTime.fromISO(isoDate, { zone: "utc" }).plus({ days }).toISODate()!;
}

function toInstant(date: string, time: string): string {
  return DateTime.fromISO(`${date}T${time}`, { zone: "utc" }).toISO({
    suppressMilliseconds: true,
  })!;
}

export function buildReadyEmail(clinic: Clinic, kase: LabCase) {
  // Rendered by the caller with displayDeadline(); kept here as pure copy.
  const firstName = clinic.contactName.replace(/^Dr\.\s*/i, "").split(" ")[0];

  return {
    subject: `${kase.reference} is ready for delivery — LabTrack`,
    body: `Hi ${firstName},\n\nGood news: case ${kase.reference} (${kase.treatment}) for ${kase.patientRef} is ready for delivery.\n\nClinic: ${clinic.name}\nStatus: Ready\nOriginal clinic deadline: {DEADLINE}\n\nPlease reply to this email to arrange collection or delivery.\n\nThanks,\nLabTrack team\n\n(You are receiving this because ${clinic.contactEmail} is configured as the case contact.)`,
  };
}

export function seedData(anchor: string = DEMO_ANCHOR): AppState {
  const cases: LabCase[] = [];
  let readyCounter = 0;

  for (let i = 0; i < 56; i++) {
    const clinic = clinics[i % clinics.length];
    const completed = i >= 48;
    let offset: number;

    if (overdueSet.has(i)) offset = overdueOffsets[i];
    else if (dueTodaySet.has(i)) offset = 0;
    else if (readySet.has(i)) offset = readyOffsets[readyCounter++];
    else offset = 1 + ((i * 7) % 12);

    const dueDate = shiftDate(anchor, offset);
    const dueTime = dueTimes[i % dueTimes.length];
    const deadlineUtc = deadlineToUtc(dueDate, dueTime, clinic.timezone)!;
    const receivedAt = toInstant(
      shiftDate(anchor, -(5 + (i % 8))),
      "08:30",
    );
    const status = completed
      ? "Completed"
      : readySet.has(i)
        ? "Ready"
        : i % 3 === 0
          ? "Received"
          : "In progress";

    const timeline: TimelineEvent[] = [
      {
        id: `ev_${i}_created`,
        label: "Case received",
        detail: `${kaseTreatment(i)} sent by ${clinic.name}`,
        at: receivedAt,
        actor: "Clinic portal",
      },
    ];
    if (status === "In progress") {
      timeline.push({
        id: `ev_${i}_progress`,
        label: "Production started",
        detail: "Case assigned to the laboratory bench",
        at: toInstant(shiftDate(anchor, -1), "10:15"),
        actor: "Lab coordinator",
      });
    }
    if (status === "Ready") {
      timeline.push({
        id: `ev_${i}_ready`,
        label: "Marked ready for delivery",
        detail: "Clinic notification captured in test mode",
        at: toInstant(shiftDate(anchor, -1), "16:40"),
        actor: "Lab coordinator",
      });
    }
    if (completed) {
      timeline.push({
        id: `ev_${i}_done`,
        label: "Case completed",
        detail: "Delivered and signed off",
        at: toInstant(shiftDate(anchor, -1), "11:20"),
        actor: "Lab coordinator",
      });
    }

    cases.push({
      id: `case_${1042 + i}`,
      reference: `LT-${1042 + i}`,
      patientRef: `PAT-${2100 + i}`,
      dentist: clinic.contactName,
      treatment: kaseTreatment(i),
      clinicId: clinic.id,
      dueDate,
      dueTime,
      deadlineUtc,
      receivedAt,
      status,
      timeline,
    });
  }

  const notifications: Notification[] = cases
    .filter((c) => c.status === "Ready")
    .slice(0, 3)
    .map((c, i) => {
      const clinic = clinics.find((cl) => cl.id === c.clinicId)!;
      const copy = buildReadyEmail(clinic, c);
      return {
        id: `note_seed_${i}`,
        caseId: c.id,
        clinicId: clinic.id,
        type: "CASE_READY" as const,
        channel: "EMAIL" as const,
        to: clinic.contactEmail,
        subject: copy.subject,
        body: copy.body.replace(
          "{DEADLINE}",
          deadlineLabelForSeed(c, clinic.timezone),
        ),
        status: "Sent (Simulation)" as const,
        createdAt: toInstant(shiftDate(anchor, -1), "16:45"),
        sentAt: toInstant(shiftDate(anchor, -1), "16:45"),
      };
    });

  return {
    version: 2,
    clinics,
    cases,
    notifications,
    deadlineView: "clinic",
    labTimezone: DEFAULT_LAB_TIMEZONE,
    simulateFailure: false,
    seededOn: anchor,
    referenceNow: `${anchor}T06:00:00.000Z`,
  };
}

function kaseTreatment(i: number): string {
  return treatments[i % treatments.length];
}

function deadlineLabelForSeed(kase: LabCase, zone: string): string {
  const d = displayDeadline(kase.deadlineUtc, zone);
  return `${d.dateTime} (${d.zone})`;
}
