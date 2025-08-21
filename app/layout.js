import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PasswordGate from "@/components/PasswordGate";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata = {
  title: "Multi-Video Stream Dashboard",
  description: "Professional video management for large displays"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PasswordGate>{children}</PasswordGate>
        <Toaster />
      </body>
    </html>
  );
}
