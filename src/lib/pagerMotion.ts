// Tuning and math for the expanded photo pager's swipe / settle motion.
// Every "feel" knob lives here; the components only wire gestures up.
//
// The exported functions are marked "worklet" so they can run on the UI
// thread inside gesture callbacks; they stay pure so they are also unit
// testable off-device.

/**
 * Settle curve control points (ease-out cubic): a gentle initial kick that
 * glides to rest. Passed to reanimated's Easing.bezier by the components -
 * kept as plain numbers here so this module stays free of react-native
 * imports (and vitest-runnable).
 */
export const SETTLE_BEZIER = [0.33, 1, 0.68, 1] as const;

/** Horizontal movement (px) that activates the photo swipe. */
export const SWIPE_ACTIVE_OFFSET_X = 10;
/**
 * Vertical movement (px) at which the photo swipe gives up (sheet pan).
 * Generous: rapid consecutive flicks arc vertically, and a tight limit made
 * them die ("stuck" swipes).
 */
export const SWIPE_FAIL_OFFSET_Y = 22;
/**
 * Vertical movement (px) that activates the sheet's own pan. High enough
 * that a sloppy-but-horizontal flick doesn't lose the race to the sheet.
 */
export const SHEET_PAN_ACTIVE_OFFSET_Y = 14;
/** Horizontal movement (px) at which the sheet's pan gives up (swipe). */
export const SHEET_PAN_FAIL_OFFSET_X = 14;

/** Settle duration when the pager moves after a thumbnail tap (full page). */
export const TAP_SETTLE_DURATION_MS = 420;

// How far ahead (in seconds) the release velocity is projected when picking
// the page to settle on - the standard momentum-pager heuristic. 0.25s means
// a light ~600px/s flick alone is enough to flip a page.
const VELOCITY_PROJECTION = 0.25;

// Fraction of a page the projected position must cross to flip.
const FLIP_FRACTION = 0.35;

// Drag distance past the first/last page is divided by this (rubber band).
const RUBBER_BAND_FACTOR = 3;

// Settle duration = BASE + PER_PAGE * (remaining distance / page width),
// so short settles stay snappy and full-page ones don't feel rushed.
const SETTLE_DURATION_BASE_MS = 240;
const SETTLE_DURATION_PER_PAGE_MS = 220;

/**
 * Track position while dragging: 1:1 inside [minX, maxX], resisted past
 * the ends.
 */
export function rubberBandTrack(
  raw: number,
  minX: number,
  maxX: number,
): number {
  "worklet";
  if (raw > maxX) return maxX + (raw - maxX) / RUBBER_BAND_FACTOR;
  if (raw < minX) return minX + (raw - minX) / RUBBER_BAND_FACTOR;
  return raw;
}

/**
 * Page to settle on when the finger lifts: the release velocity is projected
 * ahead of the current track position, and a flip happens once that crosses
 * FLIP_FRACTION of a page - at most one page per swipe (Shorts-like, and the
 * ±1 render window never has to land on an unmounted page).
 */
export function settleTargetIndex(
  trackX: number,
  index: number,
  velocityX: number,
  screenWidth: number,
  count: number,
): number {
  "worklet";
  const projectedOffset =
    -trackX - index * screenWidth - velocityX * VELOCITY_PROJECTION;
  let target = index;
  if (projectedOffset > screenWidth * FLIP_FRACTION) target = index + 1;
  else if (projectedOffset < -screenWidth * FLIP_FRACTION) target = index - 1;
  return Math.min(count - 1, Math.max(0, target));
}

/** Settle duration for the remaining distance after the finger lifts. */
export function settleDurationMs(
  remainingPx: number,
  screenWidth: number,
): number {
  "worklet";
  return (
    SETTLE_DURATION_BASE_MS +
    Math.min(
      SETTLE_DURATION_PER_PAGE_MS,
      (remainingPx / screenWidth) * SETTLE_DURATION_PER_PAGE_MS,
    )
  );
}
