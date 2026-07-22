import { describe, expect, it } from "vitest";

import type { Spot } from "./spots";
import {
  distanceMeters,
  filterByPeriod,
  groupSpotsByLocation,
  sortByFreshness,
} from "./spotGroups";

function makeSpot(overrides: Partial<Spot> & { id: string }): Spot {
  return {
    created_at: "2026-07-01T00:00:00+09:00",
    user_id: null,
    title: "spot",
    lat: 35.0,
    lng: 135.0,
    photo_path: "p.jpg",
    taken_at: null,
    ...overrides,
  };
}

describe("distanceMeters", () => {
  it("is zero for the same point", () => {
    expect(distanceMeters(35, 135, 35, 135)).toBe(0);
  });

  it("is roughly 111km per degree of latitude", () => {
    const d = distanceMeters(35, 135, 36, 135);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("sortByFreshness", () => {
  it("sorts newest taken_at first, falling back to created_at", () => {
    const spots = [
      makeSpot({ id: "old", taken_at: "2026-07-01T00:00:00+09:00" }),
      makeSpot({ id: "new", taken_at: "2026-07-20T00:00:00+09:00" }),
      makeSpot({
        id: "untaken",
        taken_at: null,
        created_at: "2026-07-10T00:00:00+09:00",
      }),
    ];
    expect(sortByFreshness(spots).map((s) => s.id)).toEqual([
      "new",
      "untaken",
      "old",
    ]);
  });
});

describe("groupSpotsByLocation", () => {
  it("clusters spots within ~100m and keeps distant spots separate", () => {
    const groups = groupSpotsByLocation([
      makeSpot({ id: "a", lat: 35.0, lng: 135.0 }),
      // ~30m north of a
      makeSpot({ id: "b", lat: 35.00027, lng: 135.0 }),
      // ~5km away
      makeSpot({ id: "c", lat: 35.045, lng: 135.0 }),
    ]);
    expect(groups).toHaveLength(2);
    const big = groups.find((g) => g.spots.length === 2);
    expect(big?.spots.map((s) => s.id).sort()).toEqual(["a", "b"]);
  });

  it("anchors each group on its newest spot", () => {
    const groups = groupSpotsByLocation([
      makeSpot({ id: "old", taken_at: "2026-07-01T00:00:00+09:00" }),
      makeSpot({
        id: "new",
        lat: 35.0001,
        taken_at: "2026-07-20T00:00:00+09:00",
      }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("new");
    expect(groups[0]?.spots.map((s) => s.id)).toEqual(["new", "old"]);
  });
});

describe("filterByPeriod", () => {
  const now = new Date("2026-07-23T12:00:00+09:00");
  const spots = [
    makeSpot({ id: "today", taken_at: "2026-07-23T08:00:00+09:00" }),
    makeSpot({ id: "thisWeek", taken_at: "2026-07-19T08:00:00+09:00" }),
    makeSpot({ id: "older", taken_at: "2026-06-01T08:00:00+09:00" }),
  ];

  it("today keeps only same-calendar-day spots", () => {
    expect(filterByPeriod(spots, "today", now).map((s) => s.id)).toEqual([
      "today",
    ]);
  });

  it("week keeps the last 7 days", () => {
    expect(filterByPeriod(spots, "week", now).map((s) => s.id)).toEqual([
      "today",
      "thisWeek",
    ]);
  });

  it("all keeps everything", () => {
    expect(filterByPeriod(spots, "all", now)).toHaveLength(3);
  });
});
