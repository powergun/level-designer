/** One sRGB channel in 0 to 1 decoded to linear light by the sRGB transfer curve. */
function linearChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** A `#rrggbb` sRGB colour text of the finish table as linear RGB numbers. */
export function linearFromSrgbHex(text: string): readonly [number, number, number] {
  const channel = (start: number): number =>
    linearChannel(Number.parseInt(text.slice(start, start + 2), 16) / 255);
  return [channel(1), channel(3), channel(5)];
}
