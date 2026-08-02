import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_CHOICE,
  THEME_CHOICES,
  THEME_LABELS,
  isThemeChoice,
  resolveTheme,
  toThemeChoice,
} from "@/lib/theme";

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

describe("theme choices", () => {
  it("offers light, system and dark as three distinct options", () => {
    expect(THEME_CHOICES).toEqual(["light", "system", "dark"]);
  });

  it("labels every choice", () => {
    for (const choice of THEME_CHOICES) {
      expect(THEME_LABELS[choice]).toBeTruthy();
    }
  });

  it("defaults to dark so existing users see no change", () => {
    expect(DEFAULT_THEME_CHOICE).toBe("dark");
    expect(toThemeChoice(undefined)).toBe("dark");
    expect(toThemeChoice("chartreuse")).toBe("dark");
  });

  it("recognises only the three known choices", () => {
    expect(THEME_CHOICES.every(isThemeChoice)).toBe(true);
    expect(isThemeChoice("System")).toBe(false);
    expect(isThemeChoice(undefined)).toBe(false);
  });
});

describe("resolveTheme", () => {
  it("takes an explicit choice literally, whatever the OS says", () => {
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });

  it("follows the OS when the choice is system", () => {
    expect(resolveTheme("system", "light")).toBe("light");
    expect(resolveTheme("system", "dark")).toBe("dark");
  });

  it("falls back to the default when the OS preference is unknown", () => {
    expect(resolveTheme("system", undefined)).toBe("dark");
  });

  it("keeps system a distinct choice rather than collapsing it to a boolean", () => {
    expect(toThemeChoice("system")).toBe("system");
    expect(resolveTheme("system", "light")).not.toBe(
      resolveTheme("system", "dark"),
    );
  });
});

// The no-flash guarantee and the dark default live in JSX props rather than in
// callable code, so they are asserted against the source they must appear in.
describe("root layout wiring", () => {
  const layout = read("../app/layout.tsx");
  const provider = read("../components/theme-provider.tsx");

  it("suppresses the hydration warning the pre-paint script causes", () => {
    expect(layout).toMatch(/<html[^>]*suppressHydrationWarning/);
  });

  it("no longer hard-codes the dark class on <body>", () => {
    expect(layout).not.toMatch(/className=\{`[^`]*\bdark\b/);
  });

  it("wraps the tree in the theme provider", () => {
    expect(layout).toContain("<ThemeProvider>");
  });

  it("drives the theme through the class attribute with system enabled", () => {
    expect(provider).toContain('attribute="class"');
    expect(provider).toContain("enableSystem");
    expect(provider).toContain("defaultTheme={DEFAULT_THEME_CHOICE}");
  });
});

describe("theme toggle markup", () => {
  const toggle = read("../components/theme-toggle.tsx");

  it("is a radiogroup, not a two-state switch", () => {
    expect(toggle).toContain('role="radiogroup"');
    expect(toggle).toContain('type="radio"');
    expect(toggle).toContain("THEME_CHOICES.map");
  });

  it("waits for mount before marking a choice selected", () => {
    expect(toggle).toContain("mounted");
  });
});
