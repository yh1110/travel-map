import { describe, expect, it } from "vitest";

import { focusCoordinateAboveSheet } from "./mapFocus";

describe("focusCoordinateAboveSheet", () => {
  const lat = 35.6586;
  const lng = 139.7454;
  const zoom = 16;
  const screenHeight = 844;

  it("shifts south so the spot renders above the collapsed sheet", () => {
    const focus = focusCoordinateAboveSheet(lat, lng, zoom, screenHeight);
    expect(focus.lat).toBeLessThan(lat);
  });

  it("shifts east so the spot renders slightly left of center", () => {
    const focus = focusCoordinateAboveSheet(lat, lng, zoom, screenHeight);
    expect(focus.lng).toBeGreaterThan(lng);
  });

  it("shifts more at a taller screen height", () => {
    const short = focusCoordinateAboveSheet(lat, lng, zoom, 700);
    const tall = focusCoordinateAboveSheet(lat, lng, zoom, 1000);
    expect(lat - tall.lat).toBeGreaterThan(lat - short.lat);
  });
});
