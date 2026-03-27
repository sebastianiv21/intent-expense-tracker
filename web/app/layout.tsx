import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intent — Expense Tracker",
  description: "Personal finance tracker with 50/30/20 budgeting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${geistMono.variable} dark antialiased`}
      >
        {children}
        <Toaster
          position="bottom-center"
          expand={false}
          offset="16px"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "bg-card border border-border rounded-xl shadow-lg p-4 flex items-center justify-between gap-3",
              title: "text-foreground font-medium",
              description: "text-muted-foreground text-sm",
              actionButton:
                "bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity",
              success: "border-l-4 border-l-income",
              error: "border-l-4 border-l-expense",
            },
          }}
        />
      </body>
    </html>
  );
}
