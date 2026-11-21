import { describe, expect, it } from "vitest";
import { buildReadyEmail, seedData, DEMO_ANCHOR } from "../lib/seed";

describe("ready email copy", () => {
  const state = seedData(DEMO_ANCHOR);
  const kase = state.cases.find((c) => c.reference === "LT-1042")!;
  const clinic = state.clinics.find((c) => c.id === kase.clinicId)!;
  const email = buildReadyEmail(clinic, kase);

  it("includes everything the clinic needs to identify the case", () => {
    expect(email.subject).toContain(kase.reference);
    expect(email.body).toContain(kase.reference);
    expect(email.body).toContain(kase.patientRef);
    expect(email.body).toContain(kase.treatment);
    expect(email.body).toContain(clinic.name);
    expect(email.body.toLowerCase()).toContain("ready for delivery");
    expect(email.body).toContain("{DEADLINE}");
  });

  it("does not leak the placeholder into the sent message", () => {
    const seeded = state.notifications[0];
    const seededCase = state.cases.find((c) => c.id === seeded.caseId)!;
    const seededClinic = state.clinics.find((c) => c.id === seeded.clinicId)!;
    expect(seeded.body).not.toContain("{DEADLINE}");
    expect(seeded.body).toContain(seededClinic.timezone);
    expect(seeded.body).toContain(seededCase.reference);
  });

  it("never seeds more than one ready notification per case", () => {
    const counts = new Map<string, number>();
    for (const note of state.notifications) {
      counts.set(note.caseId, (counts.get(note.caseId) ?? 0) + 1);
    }
    expect([...counts.values()].every((n) => n === 1)).toBe(true);
    expect(state.notifications.length).toBeGreaterThan(0);
  });
});
