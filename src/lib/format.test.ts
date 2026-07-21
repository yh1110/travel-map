import { describe, expect, it } from "vitest";

import { formatRelativeTime, formatTakenAt, parseExifDate } from "./format";

describe("parseExifDate", () => {
  it("parses DateTimeOriginal in EXIF format", () => {
    const date = parseExifDate({ DateTimeOriginal: "2026:07:09 14:30:05" });
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(9);
    expect(date?.getHours()).toBe(14);
    expect(date?.getMinutes()).toBe(30);
  });

  it("falls back to DateTime when DateTimeOriginal is missing", () => {
    const date = parseExifDate({ DateTime: "2025:01:02 03:04:05" });
    expect(date?.getFullYear()).toBe(2025);
  });

  it("returns null for missing or malformed input", () => {
    expect(parseExifDate(null)).toBeNull();
    expect(parseExifDate(undefined)).toBeNull();
    expect(parseExifDate({})).toBeNull();
    expect(parseExifDate({ DateTimeOriginal: "not a date" })).toBeNull();
    expect(parseExifDate({ DateTimeOriginal: 12345 })).toBeNull();
  });
});

describe("formatTakenAt", () => {
  it("formats a valid ISO timestamp", () => {
    const iso = new Date(2026, 6, 9, 7, 5).toISOString();
    expect(formatTakenAt(iso)).toBe("2026/7/9 07:05");
  });

  it("returns 不明 for null or invalid input", () => {
    expect(formatTakenAt(null)).toBe("不明");
    expect(formatTakenAt("garbage")).toBe("不明");
  });
});

describe("formatRelativeTime", () => {
  it("returns たった今 for a moment ago", () => {
    expect(formatRelativeTime(new Date(Date.now() - 5_000).toISOString())).toBe(
      "たった今",
    );
  });

  it("formats minutes, hours, and days within a week", () => {
    expect(
      formatRelativeTime(new Date(Date.now() - 5 * 60_000).toISOString()),
    ).toBe("5分前");
    expect(
      formatRelativeTime(new Date(Date.now() - 3 * 3_600_000).toISOString()),
    ).toBe("3時間前");
    expect(
      formatRelativeTime(new Date(Date.now() - 2 * 86_400_000).toISOString()),
    ).toBe("2日前");
  });

  it("falls back to the absolute time past a week and for invalid input", () => {
    const old = new Date(2020, 0, 1, 9, 30).toISOString();
    expect(formatRelativeTime(old)).toBe(formatTakenAt(old));
    expect(formatRelativeTime(null)).toBe("不明");
    expect(formatRelativeTime("garbage")).toBe("不明");
  });
});
