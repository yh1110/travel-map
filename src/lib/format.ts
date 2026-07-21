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

/**
 * Formats an ISO timestamp as a coarse relative time ("たった今" / "N分前" /
 * "N時間前" / "N日前"). Anything older than a week - and null/invalid input -
 * falls back to the absolute formatTakenAt output.
 */
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return formatTakenAt(iso);
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return formatTakenAt(iso);

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days <= 7) return `${days}日前`;
  return formatTakenAt(iso);
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
