import { describe, expect, it } from "vitest";

import { directionLabel, formatTakenAt, parseExifDate } from "./format";

describe("directionLabel", () => {
  it("maps cardinal bearings to Japanese labels", () => {
    expect(directionLabel(0)).toBe("北");
    expect(directionLabel(45)).toBe("北東");
    expect(directionLabel(90)).toBe("東");
    expect(directionLabel(180)).toBe("南");
    expect(directionLabel(270)).toBe("西");
  });

  it("rounds to the nearest 8-point direction and wraps at 360", () => {
    expect(directionLabel(359)).toBe("北");
    expect(directionLabel(337.5)).toBe("北");
    expect(directionLabel(22)).toBe("北");
    expect(directionLabel(23)).toBe("北東");
  });

  it("normalizes out-of-range bearings", () => {
    expect(directionLabel(450)).toBe("東");
    expect(directionLabel(-90)).toBe("西");
  });
});

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
