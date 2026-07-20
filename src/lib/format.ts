const DIRECTION_LABELS = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];

/** Returns the Japanese 8-point compass label for a bearing in degrees. */
export function directionLabel(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360;
  return DIRECTION_LABELS[Math.round(normalized / 45) % 8];
}

/** Formats a Date as "YYYY/M/D HH:mm" in device-local time. */
export function formatDateTime(date: Date): string {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

/** Formats an ISO timestamp (or null) for display, falling back to 不明. */
export function formatTakenAt(iso: string | null): string {
  if (!iso) return "不明";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "不明";
  return formatDateTime(date);
}

/** Parses EXIF "YYYY:MM:DD HH:MM:SS" into a Date (device-local time). */
export function parseExifDate(
  exif: Record<string, unknown> | null | undefined,
): Date | null {
  const raw = exif?.["DateTimeOriginal"] ?? exif?.["DateTime"];
  if (typeof raw !== "string") return null;
  const match = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
