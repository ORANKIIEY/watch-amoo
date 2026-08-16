import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "watchamoo — Kids entertainment in your child's home language",
    template: "%s · watchamoo",
  },
  description:
    "Ad-free nursery rhymes, songs and stories in Sepedi, Sesotho and Setswana — plus an AI Discovery Assistant. Create a free account to watch.",
  openGraph: {
    title: "watchamoo",
    description:
      "Ad-free nursery rhymes in Sepedi, Sesotho and Setswana with an AI Discovery Assistant.",
    type: "website",
    locale: "en_ZA",
    siteName: "watchamoo",
  },
  twitter: {
    card: "summary_large_image",
    title: "watchamoo",
    description: "Kids entertainment in Sepedi, Sesotho and Setswana.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <LocaleProvider>
            <SiteHeader />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
