import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisionEcho Live",
  description: "Live Nigerian civic news, eyewitness reports, reporter stories, and editor verification.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "VisionEcho",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0e7a56",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
