import type { Metadata, Viewport } from "next";
import { Geist_Mono, Work_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { themeInitScript } from "@/components/shell/ThemeController";

// Work Sans matches Syllabus Sync's primary typeface.
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sylla — the AI study assistant for Syllabus Sync",
    template: "%s · Sylla",
  },
  description:
    "Sylla helps turn your units, notes, and study goals into summaries, flashcards, quizzes, and study plans. Part of the Syllabus Sync ecosystem.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edeade" },
    { media: "(prefers-color-scheme: dark)", color: "#262826" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the stored theme before first paint (no flash).
            themeInitScript is a static compile-time constant — no user or
            external input reaches it. */}
        <Script id="sylla-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
