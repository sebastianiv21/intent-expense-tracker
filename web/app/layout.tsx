import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { FORMATS, TIME_ZONE } from "@/lib/i18n/formats";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: "/apple-icon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  // next-themes stamps the theme class onto <html> from a pre-paint inline
  // script, so the server markup it hydrates against never carries it.
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          formats={FORMATS}
          timeZone={TIME_ZONE}
        >
          <ThemeProvider>
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
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
