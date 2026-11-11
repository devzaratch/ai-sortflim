import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ละคร AI - ซีรีส์ AI แนวตั้ง",
    template: "%s | MOVIES AI",
  },
  description: "เว็บรวมละครสั้น AI และซีรีส์ AI แนวตั้ง ครบทุกตอน ดูฟรี พากย์ไทย คมชัด HD อัปเดตทุกวัน",
  applicationName: "MOVIES AI",
  keywords: ["ละคร AI", "ซีรีส์ AI", "ละครสั้น", "ซีรีส์แนวตั้ง", "ดูฟรี", "พากย์ไทย"],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "MOVIES AI",
    title: "ละคร AI - ซีรีส์ AI แนวตั้ง",
    description: "เว็บรวมละครสั้น AI และซีรีส์ AI แนวตั้ง ครบทุกตอน ดูฟรี พากย์ไทย คมชัด HD อัปเดตทุกวัน",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ละคร AI - ซีรีส์ AI แนวตั้ง",
    description: "เว็บรวมละครสั้น AI และซีรีส์ AI แนวตั้ง ครบทุกตอน ดูฟรี พากย์ไทย",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${notoSansThai.variable} font-sans h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0b] text-white font-sans pb-[60px] md:pb-0">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
