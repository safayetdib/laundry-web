/** Formats integer minor units (BDT poisha) for display, e.g. 10050 -> "৳100.50". */
export function formatBdt(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const taka = Math.floor(abs / 100);
  const poisha = String(abs % 100).padStart(2, '0');
  return `${sign}৳${taka.toLocaleString('en-US')}.${poisha}`;
}

/** Converts a taka string/number to integer poisha (for forms). */
export function takaToMinor(taka: number): number {
  return Math.round(taka * 100);
}
