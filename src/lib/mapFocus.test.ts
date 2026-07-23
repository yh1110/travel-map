import { describe, expect, it } from "vitest";

import { focusRegionAboveSheet } from "./mapFocus";

describe("focusRegionAboveSheet", () => {
  const lat = 35.6586;
  const lng = 139.7454;
  const zoom = 16;
  const screenWidth = 402;
  const screenHeight = 874;

  const region = focusRegionAboveSheet(lat, lng, zoom, screenWidth, screenHeight);

  it("nudges single-photo spots east by exactly 9px worth of longitude", () => {
    const nudge = (9 / screenWidth) * region.longitudeDelta;
    expect(region.longitude).toBeCloseTo(lng + nudge, 12);
  });

  it("keeps multi-photo spots un-nudged (stacked markers show no bias)", () => {
    const multi = focusRegionAboveSheet(lat, lng, zoom, screenWidth, screenHeight, 6);
    expect(multi.longitude).toBe(lng);
  });

  it("centers south of the spot so the pin renders above mid-screen", () => {
    expect(region.latitude).toBeLessThan(lat);
  });

  it("places the pin at the designed screen fraction, exactly", () => {
    // Screen-y fraction of the pin: center is at 0.5; each latitudeDelta
    // fraction north of center moves it up proportionally.
    const pinYFraction = 0.5 - (lat - region.latitude) / region.latitudeDelta;
    // Designed: 68% into the visible (non-sheet) 42% of the screen.
    const expected = ((1 - 0.58) * 0.68 * screenHeight) / screenHeight;
    expect(pinYFraction).toBeCloseTo(expected, 10);
  });

  it("spans match the screen's aspect ratio in Web Mercator", () => {
    const expectedRatio =
      screenWidth / screenHeight / Math.cos((lat * Math.PI) / 180);
    expect(region.longitudeDelta / region.latitudeDelta).toBeCloseTo(
      expectedRatio,
      10,
    );
  });

  it("halves the span per zoom level", () => {
    const zoomedIn = focusRegionAboveSheet(lat, lng, zoom + 1, screenWidth, screenHeight);
    expect(zoomedIn.latitudeDelta).toBeCloseTo(region.latitudeDelta / 2, 10);
  });
});
