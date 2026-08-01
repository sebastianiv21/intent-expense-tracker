"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { DEFAULT_THEME_CHOICE } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME_CHOICE}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
