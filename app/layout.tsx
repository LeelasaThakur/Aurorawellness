import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora – Your AI Wellness Companion",
  description:
    "AI-powered mental wellness assistant for students preparing for NEET, JEE, CUET, CAT, GATE, UPSC, and Board Exams. Monitor, understand, and improve your emotional well-being during exam preparation.",
  keywords: [
    "mental wellness",
    "student wellness",
    "exam preparation",
    "NEET",
    "JEE",
    "UPSC",
    "AI companion",
    "burnout prevention",
    "stress management",
  ],
  authors: [{ name: "Aurora Wellness Team" }],
  openGraph: {
    title: "Aurora – Your AI Wellness Companion",
    description:
      "Your empathetic AI companion for exam preparation wellness. Track mood, manage stress, prevent burnout.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
