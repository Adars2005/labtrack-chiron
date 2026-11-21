export type CaseStatus = "Received" | "In progress" | "Ready" | "Completed";

export interface Clinic {
  id: string;
  name: string;
  country: string;
  timezone: string;
  contactName: string;
  contactEmail: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  detail?: string;
  at: string; // UTC ISO instant
  actor: string;
}

export interface LabCase {
  id: string;
  reference: string;
  patientRef: string;
  dentist: string;
  treatment: string;
  clinicId: string;
  /** Clinic-local calendar date, as entered by lab staff. YYYY-MM-DD */
  dueDate: string;
  /** Clinic-local wall-clock time, as entered by lab staff. HH:mm */
  dueTime: string;
  /** Canonical deadline: a timezone-aware instant in UTC. */
  deadlineUtc: string;
  receivedAt: string;
  status: CaseStatus;
  timeline: TimelineEvent[];
}

export type NotificationStatus =
  | "Sending"
  | "Sent (Simulation)"
  | "Sent"
  | "Failed";

export interface Notification {
  id: string;
  caseId: string;
  clinicId: string;
  type: "CASE_READY";
  channel: "EMAIL";
  to: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

export type DeadlineView = "clinic" | "lab";

export interface AppState {
  version: number;
  clinics: Clinic[];
  cases: LabCase[];
  notifications: Notification[];
  deadlineView: DeadlineView;
  labTimezone: string;
  simulateFailure: boolean;
  seededOn: string;
  /** Fixed demo instant used for all "today / overdue" calculations. */
  referenceNow: string;
}
