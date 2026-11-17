/** The number as at least `width` digits. */
function digits(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/** The local calendar date and wall time of `date`, `YYYY-MM-DD` and `HH`, `MM`, `SS`. */
function localParts(date: Date): { readonly day: string; readonly clock: readonly string[] } {
  const day = `${date.getFullYear()}-${digits(date.getMonth() + 1)}-${digits(date.getDate())}`;
  return {
    day,
    clock: [date.getHours(), date.getMinutes(), date.getSeconds()].map((v) => digits(v)),
  };
}

/**
 * The local time of `date` in ISO 8601 with milliseconds and the UTC offset, such as
 * `2026-11-17T14:05:09.123+01:00`: the time of every run log line and every mark.
 */
export function localTime(date: Date): string {
  const { day, clock } = localParts(date);
  const east = -date.getTimezoneOffset();
  const offset = Math.abs(east);
  const sign = east < 0 ? "-" : "+";
  const zone = `${sign}${digits(Math.floor(offset / 60))}:${digits(offset % 60)}`;
  return `${day}T${clock.join(":")}.${digits(date.getMilliseconds(), 3)}${zone}`;
}

/** The run name of a run that starts at `date`: `qa-<YYYY-MM-DD>T<HH-MM-SS>` in local time. */
export function runName(date: Date): string {
  const { day, clock } = localParts(date);
  return `qa-${day}T${clock.join("-")}`;
}
