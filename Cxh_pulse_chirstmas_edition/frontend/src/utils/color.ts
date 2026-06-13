import tinycolor from 'tinycolor2';

/**
 * Returns either '#000000' or '#ffffff' (or the best contrasting color) for readability
 * against the provided background color. It prefers returning a color that meets the
 * requested minimum contrast ratio (WCAG). If neither black nor white meets the
 * threshold, it returns the one with higher contrast.
 */
export function getContrastingTextColor(bgColor: string, minRatio = 4.5): string {
  const bg = tinycolor(bgColor || '#ffffff');
  if (!bg.isValid()) return '#000000';

  // Candidate colors: black, white, darker and lighter variants of bg, complement and some neutral grays
  const candidates = [
    '#ffffff',
    '#000000',
    bg.clone().darken(60).toHexString(),
    bg.clone().darken(30).toHexString(),
    bg.clone().lighten(30).toHexString(),
    bg.clone().lighten(60).toHexString(),
    bg.clone().complement().toHexString(),
    bg.clone().desaturate(20).toHexString(),
    '#222222',
    '#444444',
    '#666666',
    '#888888',
    '#aaaaaa',
  ];

  // Let tinycolor pick the most readable color among candidates, preferring AA-level readability
  const mostReadable = tinycolor.mostReadable(bg, candidates, {
    includeFallbackColors: true,
    level: 'AA',
    size: 'small',
  });

  if (mostReadable && tinycolor.readability(bg, mostReadable) >= minRatio) {
    return mostReadable.toHexString();
  }

  // If nothing met the minRatio, pick the candidate with maximum contrast
  let best = candidates[0];
  let bestRatio = 0;
  for (const c of candidates) {
    const ratio = tinycolor.readability(bg, tinycolor(c));
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = c;
    }
  }

  return best;
}

/**
 * Return the contrast ratio between two colors using tinycolor's readability.
 */
export function getContrastRatio(colorA: string, colorB: string): number {
  const a = tinycolor(colorA);
  const b = tinycolor(colorB);
  if (!a.isValid() || !b.isValid()) return 0;
  return tinycolor.readability(a, b);
}

/**
 * Temperature color constant - Yellow (#FFD700)
 * Used consistently across all temperature visualizations
 */
export const TEMPERATURE_COLOR = '#f39b03';

/**
 * Precipitation color constant - Light Blue (#ADD8E6)
 * Used consistently across all precipitation visualizations
 */
export const PRECIPITATION_COLOR = '#5995f8';

export default {
  getContrastingTextColor,
  getContrastRatio,
  TEMPERATURE_COLOR,
  PRECIPITATION_COLOR,
};
