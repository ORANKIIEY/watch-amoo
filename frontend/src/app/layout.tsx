import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "watchamoo — Kids entertainment in your child's home language",
  description:
    "Ad-free nursery rhymes, songs and stories in Sepedi, Sesotho and Setswana — plus an AI Discovery Assistant. Start your 7-day free trial.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
