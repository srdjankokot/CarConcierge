import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AmbientBackground } from "@/components/redesign/AmbientBackground";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valé",
  description: "Concierge servis za vozila — Novi Sad",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Concierge" },
  icons: { icon: "/icons/favicon-32.png", apple: "/icons/favicon-32.png" },
};

export const viewport: Viewport = {
  themeColor: "#0d1410",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AmbientBackground />
        <div style={{ position: "relative", zIndex: 1 }}>
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
