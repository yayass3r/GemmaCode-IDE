import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#11111b",
};

export const metadata: Metadata = {
  title: "GemmaCode — بيئة تطوير ذكية بالكامل",
  description:
    "بيئة تطوير متكاملة (IDE) تعمل بالمتصفح مع مساعد ذكاء اصطناعي Gemma 4 للتطوير الكامل Full-Stack. محرر أكواد، معاينة حية، طرفية، ومساعد برمجي ذكي.",
  keywords: [
    "GemmaCode",
    "IDE",
    "محرر أكواد",
    "Online IDE",
    "AI Assistant",
    "Gemma 4",
    "Full-Stack Development",
    "Next.js",
    "Monaco Editor",
    "Live Preview",
    "Code Editor",
    "AI Coding",
  ],
  authors: [{ name: "GemmaCode Team" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "GemmaCode — بيئة تطوير ذكية بالكامل",
    description:
      "محرر أكواد احترافي مع مساعد AI Gemma 4 للتطوير المتكامل Full-Stack",
    type: "website",
    locale: "ar_SA",
    siteName: "GemmaCode",
  },
  twitter: {
    card: "summary_large_image",
    title: "GemmaCode IDE",
    description:
      "محرر أكواد احترافي مع مساعد AI Gemma 4 للتطوير المتكامل",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
