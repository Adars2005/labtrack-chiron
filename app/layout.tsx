import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { LabTrackProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "LabTrack — Dental Lab Operations",
  description:
    "Case management for dental labs: timezone-correct deadlines, clean operations dashboard and clinic notifications.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <LabTrackProvider>
          <AppShell>{children}</AppShell>
        </LabTrackProvider>
      </body>
    </html>
  );
}
