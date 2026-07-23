import { describe, expect, it } from "vitest";

import {
  rubberBandTrack,
  settleDurationMs,
  settleTargetIndex,
} from "./pagerMotion";

const W = 400;

describe("rubberBandTrack", () => {
  it("passes through unchanged inside the bounds", () => {
    expect(rubberBandTrack(-150, -800, 0)).toBe(-150);
  });

  it("resists dragging past the first page", () => {
    const track = rubberBandTrack(90, -800, 0);
    expect(track).toBeGreaterThan(0);
    expect(track).toBeLessThan(90);
  });

  it("resists dragging past the last page", () => {
    const track = rubberBandTrack(-890, -800, 0);
    expect(track).toBeLessThan(-800);
    expect(track).toBeGreaterThan(-890);
  });
});

describe("settleTargetIndex", () => {
  it("stays on the page after a small slow drag", () => {
    expect(settleTargetIndex(-100, 0, 0, W, 5)).toBe(0);
  });

  it("flips forward once dragged past the flip fraction", () => {
    expect(settleTargetIndex(-150, 0, 0, W, 5)).toBe(1);
  });

  it("flips forward on a light flick alone", () => {
    // 40px drag + 600px/s flick projects past the threshold.
    expect(settleTargetIndex(-40, 0, -600, W, 5)).toBe(1);
  });

  it("flips backward symmetrically", () => {
    expect(settleTargetIndex(-400 + 150, 1, 0, W, 5)).toBe(0);
  });

  it("never flips more than one page on a huge flick", () => {
    expect(settleTargetIndex(-300, 0, -20000, W, 5)).toBe(1);
  });

  it("clamps at both ends", () => {
    expect(settleTargetIndex(100, 0, 2000, W, 5)).toBe(0);
    expect(settleTargetIndex(-1700, 4, -2000, W, 5)).toBe(4);
  });
});

describe("settleDurationMs", () => {
  it("is snappy for short distances and longer for a full page", () => {
    const short = settleDurationMs(40, W);
    const full = settleDurationMs(W, W);
    expect(short).toBeLessThan(full);
    expect(full).toBe(460);
  });

  it("caps the duration beyond one page of distance", () => {
    expect(settleDurationMs(W * 3, W)).toBe(460);
  });
});
