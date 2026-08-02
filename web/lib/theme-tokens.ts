/**
 * The palette's accessibility contract, expressed as data so it can be checked
 * against app/globals.css rather than asserted by hand. Floors come from
 * docs/UI_VIEWS_SPECIFICATION.md: 4.5:1 for body text, 3:1 for large text and
 * for UI components that must be identifiable (the focus ring).
 */

export type ThemeName = "light" | "dark";

export type ContrastRequirement = {
  /** Token painted on top. */
  foreground: string;
  /** Token painted underneath. */
  background: string;
  minimum: number;
  /** Why the pair exists — surfaces in the failure message. */
  usage: string;
};

export const BODY_TEXT_MINIMUM = 4.5;
export const UI_COMPONENT_MINIMUM = 3;

export const CONTRAST_REQUIREMENTS: ContrastRequirement[] = [
  req("foreground", "background", "page copy"),
  req("card-foreground", "card", "copy inside cards"),
  req("popover-foreground", "popover", "copy inside popovers and sheets"),
  req("secondary-foreground", "secondary", "copy on secondary fills"),
  req("muted-foreground", "background", "captions and helper text"),
  req("muted-foreground", "card", "captions inside cards"),
  req("muted-foreground", "muted", "captions on muted fills"),
  req("primary-foreground", "primary", "primary button label"),
  req("primary-foreground", "primary-strong", "primary CTA gradient, deep end"),
  req("accent-foreground", "accent", "floating action button glyph"),
  req("destructive-foreground", "destructive", "destructive button label"),
  req("income-foreground", "income", "income pill and CTA label"),
  req("primary", "background", "accented text and links"),
  req("primary", "card", "accented text inside cards"),
  req("destructive", "background", "destructive text buttons"),
  req("destructive", "card", "destructive text inside cards"),
  req("warning", "background", "warning copy"),
  req("warning", "card", "warning copy inside cards"),
  req("income", "background", "income amounts"),
  req("income", "card", "income amounts inside cards"),
  req("expense", "background", "expense amounts"),
  req("expense", "card", "expense amounts inside cards"),
  req("bucket-needs", "background", "Needs label and chart series"),
  req("bucket-needs", "card", "Needs label inside cards"),
  req("bucket-wants", "background", "Wants label and chart series"),
  req("bucket-wants", "card", "Wants label inside cards"),
  req("bucket-future", "background", "Future label and chart series"),
  req("bucket-future", "card", "Future label inside cards"),
  req("ring", "background", "focus indicator", UI_COMPONENT_MINIMUM),
  req("ring", "card", "focus indicator inside cards", UI_COMPONENT_MINIMUM),
];

function req(
  foreground: string,
  background: string,
  usage: string,
  minimum = BODY_TEXT_MINIMUM,
): ContrastRequirement {
  return { foreground, background, minimum, usage };
}

/**
 * Reads the `:root` (light) and `.dark` blocks out of globals.css. Deliberately
 * naive — it only understands the flat `--name: #hex;` shape those blocks use,
 * and ignores derived values such as color-mix().
 */
export function parseThemeTokens(
  css: string,
): Record<ThemeName, Record<string, string>> {
  return {
    light: parseBlock(css, ":root"),
    dark: parseBlock(css, ".dark"),
  };
}

function parseBlock(css: string, selector: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blocks = css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"));
  for (const block of blocks) {
    for (const [, name, value] of block[1].matchAll(
      /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g,
    )) {
      tokens[name.slice(2)] = value.toLowerCase();
    }
  }
  return tokens;
}

export function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, always >= 1, order-independent. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
