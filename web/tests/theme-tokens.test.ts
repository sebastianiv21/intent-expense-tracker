import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CONTRAST_REQUIREMENTS,
  contrastRatio,
  hexToRgb,
  parseThemeTokens,
  relativeLuminance,
  type ThemeName,
} from "@/lib/theme-tokens";

const css = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);
const themes = parseThemeTokens(css);
const THEME_NAMES: ThemeName[] = ["light", "dark"];

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("is order-independent", () => {
    expect(contrastRatio("#171210", "#c4714a")).toBeCloseTo(
      contrastRatio("#c4714a", "#171210"),
      10,
    );
  });

  it("expands three-digit hex", () => {
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
  });
});

describe("globals.css palette", () => {
  it("defines both themes", () => {
    expect(Object.keys(themes.light).length).toBeGreaterThan(20);
    expect(Object.keys(themes.dark).length).toBeGreaterThan(20);
  });

  it("gives every colour token a counterpart in the other theme", () => {
    // --radius and the font tokens are theme-independent, so only the light
    // block declares them.
    const themeIndependent = new Set(["radius"]);
    const light = Object.keys(themes.light).filter(
      (name) => !themeIndependent.has(name),
    );
    expect(light.sort()).toEqual(Object.keys(themes.dark).sort());
  });

  it("keeps the two themes genuinely distinct", () => {
    for (const name of Object.keys(themes.dark)) {
      expect(
        themes.light[name],
        `${name} is identical in both themes`,
      ).not.toBe(themes.dark[name]);
    }
  });

  it("inverts the light/dark relationship on the page background", () => {
    expect(relativeLuminance(themes.light.background)).toBeGreaterThan(0.8);
    expect(relativeLuminance(themes.dark.background)).toBeLessThan(0.05);
  });
});

describe.each(THEME_NAMES)("%s theme contrast", (theme) => {
  const tokens = themes[theme];

  it.each(CONTRAST_REQUIREMENTS)(
    "$foreground on $background clears $minimum:1 ($usage)",
    ({ foreground, background, minimum }) => {
      const fg = tokens[foreground];
      const bg = tokens[background];
      expect(fg, `--${foreground} missing from ${theme}`).toBeDefined();
      expect(bg, `--${background} missing from ${theme}`).toBeDefined();

      const ratio = contrastRatio(fg, bg);
      expect(
        Math.round(ratio * 100) / 100,
        `--${foreground} (${fg}) on --${background} (${bg})`,
      ).toBeGreaterThanOrEqual(minimum);
    },
  );
});
