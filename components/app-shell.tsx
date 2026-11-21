"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  FolderOpen,
  LayoutDashboard,
  Plus,
  RotateCcw,
  Stethoscope,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLabTrack } from "@/lib/store";
import { COMMON_TIMEZONES } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { NewCaseDialog } from "./dialogs";
import { Button, Select } from "./ui";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FolderOpen },
  { href: "/clinics", label: "Clinics", icon: Building2 },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Overview", subtitle: "Your lab at a glance" },
  "/cases": { title: "Cases", subtitle: "Track every case from receipt to delivery" },
  "/clinics": { title: "Clinics", subtitle: "Contacts and timezone settings" },
  "/notifications": {
    title: "Notifications",
    subtitle: "Test-mode delivery log and email previews",
  },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    deadlineView,
    setDeadlineView,
    labTimezone,
    setLabTimezone,
    notifications,
    resetDemo,
    hydrated,
  } = useLabTrack();
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [toast, setToast] = useState("");

  const meta = pathname.startsWith("/cases/")
    ? { title: "Case detail", subtitle: "Deadline, timeline and clinic contact" }
    : pageMeta[pathname] ?? pageMeta["/"];
  const pending = notifications.filter((n) => n.status === "Sending").length;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-tight tracking-tight text-ink-900">
              LabTrack
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
              Dental operations
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Workspace
          </p>
          <div className="space-y-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-500 hover:bg-slate-50 hover:text-ink-900",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", active && "text-brand-600")} />
                  {item.label}
                  {item.href === "/notifications" && pending > 0 ? (
                    <span className="pulse-dot ml-auto h-2 w-2 rounded-full bg-amber-400" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="px-3 pb-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <p className="text-xs font-semibold text-amber-800">Demo mode</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-amber-700/80">
              Emails are captured in the outbox. Nothing leaves the browser.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-2 h-7 text-amber-800 hover:bg-amber-100"
              onClick={() => {
                resetDemo();
                showToast("Demo data reset");
              }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset demo data
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 text-[11px] text-ink-400">
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500" />
            <div>
              <p className="font-semibold text-ink-700">Lab team</p>
              <p>LabTrack demo workspace</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="font-bold text-ink-900">LabTrack</span>
          </Link>
          <Button size="sm" onClick={() => setNewCaseOpen(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-2">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-500 hover:bg-slate-50",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <div className="min-w-0 flex-1 lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur lg:top-0">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-[72px] sm:px-7 lg:py-3">
            <div className="lg:block">
              <h1 className="text-lg font-semibold tracking-tight text-ink-900">
                {meta.title}
              </h1>
              <p className="text-xs text-ink-500">{meta.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(["clinic", "lab"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setDeadlineView(view)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition",
                      deadlineView === view
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-500 hover:text-ink-900",
                    )}
                  >
                    {view === "clinic" ? "Clinic time" : "Lab time"}
                  </button>
                ))}
              </div>
              <Select
                aria-label="Lab timezone"
                value={labTimezone}
                onChange={(e) => setLabTimezone(e.target.value)}
                className="h-9 w-[150px] text-xs"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
              <Button
                className="hidden h-9 sm:inline-flex"
                onClick={() => setNewCaseOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New case
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-7 sm:py-8">
          {hydrated ? children : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <NewCaseDialog
        open={newCaseOpen}
        onClose={() => setNewCaseOpen(false)}
        onCreated={(reference) => {
          showToast(`${reference} created`);
          router.push("/cases");
        }}
      />

      {toast ? (
        <div className="animate-in fixed bottom-5 right-5 z-[60] rounded-lg bg-ink-900 px-4 py-3 text-sm font-medium text-white shadow-pop">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
