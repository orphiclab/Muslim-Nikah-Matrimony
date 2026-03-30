import type { Metadata } from "next";
import { Geist, Geist_Mono,Poppins,Andada_Pro,Aref_Ruqaa_Ink } from "next/font/google";
import "./globals.css";
import Nav from "@/components/ui/navbar/Nav";
import Footer from "@/components/ui/footer/FooterWrapper";
import TrafficBeacon from "@/components/ui/TrafficBeacon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const andadaPro = Andada_Pro({
  variable: "--font-andada-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const arefRuqaaInk = Aref_Ruqaa_Ink({
  variable: "--font-aref-ruqaa-ink",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Muslim Nikah Matrimony",
  description: "Find your perfect match in a halal way",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${andadaPro.variable} ${arefRuqaaInk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TrafficBeacon />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
