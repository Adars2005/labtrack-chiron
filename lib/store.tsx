"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buildReadyEmail, seedData, DEMO_ANCHOR } from "./seed";
import {
  deadlineToUtc,
  displayDeadline,
  isValidTimezone,
  todayIso,
} from "./timezone";
import type {
  AppState,
  CaseStatus,
  Clinic,
  DeadlineView,
  LabCase,
  Notification,
} from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "labtrack.demo.v2";

interface NewCaseInput {
  clinicId: string;
  treatment: string;
  patientRef: string;
  dentist: string;
  dueDate: string;
  dueTime: string;
}

interface NewClinicInput {
  name: string;
  country: string;
  timezone: string;
  contactName: string;
  contactEmail: string;
}

interface StoreValue extends AppState {
  hydrated: boolean;
  deliveryMode: "test" | "live";
  setDeadlineView: (view: DeadlineView) => void;
  setLabTimezone: (zone: string) => void;
  setSimulateFailure: (value: boolean) => void;
  addCase: (input: NewCaseInput) => LabCase;
  addClinic: (input: NewClinicInput) => Clinic;
  markReady: (caseId: string) => Notification | null;
  setCaseStatus: (caseId: string, status: Exclude<CaseStatus, "Ready">) => void;
  retryNotification: (id: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** All demo events use the seeded reference instant for consistent timelines. */
function demoTime(state: AppState): string {
  return state.referenceNow;
}

export function LabTrackProvider({ children }: { children: ReactNode }) {
  // Deterministic first render (server + client) avoids hydration mismatch.
  const [state, setState] = useState<AppState>(() => seedData(DEMO_ANCHOR));
  const [hydrated, setHydrated] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"test" | "live">("test");
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as AppState) : null;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.cases)) {
        setState(parsed);
      } else {
        setState(seedData(todayIso(parsed?.labTimezone)));
      }
    } catch {
      setState(seedData(todayIso()));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: { mode?: string }) => {
        if (active && data.mode === "live") setDeliveryMode("live");
      })
      .catch(() => {
        // No config endpoint (e.g. static export) — stay in safe test mode.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable (private mode); the in-memory demo still works.
    }
  }, [state, hydrated]);

  const setDeadlineView = useCallback((view: DeadlineView) => {
    setState((s) => ({ ...s, deadlineView: view }));
  }, []);

  const setLabTimezone = useCallback((zone: string) => {
    if (!isValidTimezone(zone)) return;
    setState((s) => ({ ...s, labTimezone: zone }));
  }, []);

  const setSimulateFailure = useCallback((value: boolean) => {
    setState((s) => ({ ...s, simulateFailure: value }));
  }, []);

  const addCase = useCallback((input: NewCaseInput): LabCase => {
    const current = stateRef.current;
    const clinic = current.clinics.find((c) => c.id === input.clinicId);
    if (!clinic) throw new Error("Select a valid clinic");

    const deadlineUtc = deadlineToUtc(
      input.dueDate,
      input.dueTime,
      clinic.timezone,
    );
    if (!deadlineUtc) throw new Error("Invalid deadline or clinic timezone");

    const maxRef = current.cases.reduce((max, c) => {
      const n = Number(c.reference.replace("LT-", ""));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 1041);

    const created: LabCase = {
      id: uid("case"),
      reference: `LT-${maxRef + 1}`,
      patientRef: input.patientRef.trim() || "PAT-XXXX",
      dentist: input.dentist.trim() || clinic.contactName,
      treatment: input.treatment,
      clinicId: clinic.id,
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      deadlineUtc,
      receivedAt: demoTime(stateRef.current),
      status: "Received",
      timeline: [
        {
          id: uid("ev"),
          label: "Case received",
          detail: `${input.treatment} sent by ${clinic.name}`,
          at: demoTime(stateRef.current),
          actor: "Clinic portal",
        },
      ],
    };

    setState((s) => ({ ...s, cases: [created, ...s.cases] }));
    return created;
  }, []);

  const addClinic = useCallback((input: NewClinicInput): Clinic => {
    if (!isValidTimezone(input.timezone)) {
      throw new Error("Enter a valid IANA timezone (e.g. Europe/London)");
    }
    const created: Clinic = {
      id: uid("clinic"),
      name: input.name.trim(),
      country: input.country.trim(),
      timezone: input.timezone,
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail.trim(),
    };
    setState((s) => ({ ...s, clinics: [...s.clinics, created] }));
    return created;
  }, []);

  /**
   * Sends the email immediately through the server API. No manual "send" step.
   * In test mode the API still confirms capture, so the UI behaves identically.
   */
  const deliverNotification = useCallback(
    async (note: Notification, fail: boolean) => {
      try {
        const response = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationId: note.id,
            caseId: note.caseId,
            to: note.to,
            subject: note.subject,
            body: note.body,
            simulateFailure: fail,
          }),
        });
        const result = (await response.json()) as {
          status?: string;
          mode?: string;
          error?: string;
        };
        const status =
          result.status === "Sent"
            ? "Sent"
            : result.status === "Failed"
              ? "Failed"
              : "Sent (Simulation)";

        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) =>
            n.id === note.id
              ? {
                  ...n,
                  status,
                  sentAt: status === "Failed" ? undefined : demoTime(s),
                  error: result.error,
                }
              : n,
          ),
        }));
        if (result.mode === "live") setDeliveryMode("live");
      } catch (error) {
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) =>
            n.id === note.id
              ? {
                  ...n,
                  status: "Failed",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Could not reach the email service",
                }
              : n,
          ),
        }));
      }
    },
    [],
  );

  const markReady = useCallback(
    (caseId: string): Notification | null => {
      const current = stateRef.current;
      const kase = current.cases.find((c) => c.id === caseId);
      if (!kase) return null;
      const clinic = current.clinics.find((c) => c.id === kase.clinicId);
      if (!clinic) return null;

      // Idempotency: one CASE_READY notification per case, ever.
      const existing = current.notifications.find(
        (n) => n.caseId === caseId && n.type === "CASE_READY",
      );
      if (existing) return existing;

      const copy = buildReadyEmail(clinic, kase);
      const deadline = displayDeadline(kase.deadlineUtc, clinic.timezone);
      const notification: Notification = {
        id: uid("note"),
        caseId: kase.id,
        clinicId: clinic.id,
        type: "CASE_READY",
        channel: "EMAIL",
        to: clinic.contactEmail,
        subject: copy.subject,
        body: copy.body.replace(
          "{DEADLINE}",
          `${deadline.dateTime} (${deadline.zone}, ${deadline.offset})`,
        ),
        status: "Sending",
        createdAt: demoTime(stateRef.current),
      };

      const wasReady = kase.status === "Ready";
      setState((s) => ({
        ...s,
        cases: s.cases.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status: "Ready",
                timeline: wasReady
                  ? c.timeline
                  : [
                      ...c.timeline,
                      {
                        id: uid("ev"),
                        label: "Marked ready for delivery",
                        detail: "Clinic notification sent automatically",
                        at: demoTime(stateRef.current),
                        actor: "Lab coordinator",
                      },
                    ],
              }
            : c,
        ),
        notifications: [notification, ...s.notifications],
      }));

      void deliverNotification(notification, current.simulateFailure);
      return notification;
    },
    [deliverNotification],
  );

  const setCaseStatus = useCallback(
    (caseId: string, status: Exclude<CaseStatus, "Ready">) => {
      const current = stateRef.current;
      const kase = current.cases.find((c) => c.id === caseId);
      if (!kase || kase.status === status) return;
      setState((s) => ({
        ...s,
        cases: s.cases.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status,
                timeline: [
                  ...c.timeline,
                  {
                    id: uid("ev"),
                    label: `Status changed to ${status}`,
                    detail: "Updated by lab coordinator",
                    at: demoTime(s),
                    actor: "Lab coordinator",
                  },
                ],
              }
            : c,
        ),
      }));
    },
    [],
  );

  const retryNotification = useCallback(
    (id: string) => {
      const current = stateRef.current;
      const note = current.notifications.find((n) => n.id === id);
      if (!note || note.status !== "Failed") return;
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.id === id
            ? { ...n, status: "Sending", error: undefined }
            : n,
        ),
      }));
      void deliverNotification(note, current.simulateFailure);
    },
    [deliverNotification],
  );

  const resetDemo = useCallback(() => {
    const fresh = seedData(todayIso(stateRef.current.labTimezone));
    setState(fresh);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      deliveryMode,
      setDeadlineView,
      setLabTimezone,
      setSimulateFailure,
      addCase,
      addClinic,
      markReady,
      setCaseStatus,
      retryNotification,
      resetDemo,
    }),
    [
      state,
      hydrated,
      deliveryMode,
      setDeadlineView,
      setLabTimezone,
      setSimulateFailure,
      addCase,
      addClinic,
      markReady,
      setCaseStatus,
      retryNotification,
      resetDemo,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useLabTrack(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useLabTrack must be used inside LabTrackProvider");
  return ctx;
}
