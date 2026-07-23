// Matches SpotSheet's collapsed snap point ("58%") - the fraction of the
// screen height the sheet covers once it rises, so the focused spot doesn't
// end up hidden behind it.
const SHEET_COLLAPSED_FRACTION = 0.58;
// Where in the remaining visible area (above the sheet) the spot should sit,
// as a fraction of that area's height.
const FOCUS_FRACTION_OF_VISIBLE_AREA = 0.68;
// Single-photo markers render a hair right of dead center (same small bias
// the pre-region implementation cancelled with a 6px nudge; root cause is
// somewhere in the native marker rendering, not our math). Shifting the
// camera center east by this many px moves the pin left on screen.
// Multi-photo (stacked) markers DON'T show the bias - applying the nudge to
// them pushed them left - so it's single-photo only.
const SINGLE_PHOTO_HORIZONTAL_PIXEL_NUDGE = 18;

export interface FocusRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * The region to animate to so a tapped spot renders at a fixed height in the
 * area not covered by the collapsed SpotSheet.
 *
 * Region-based on purpose: the previous approach animated the camera with a
 * zoom->altitude approximation and then offset the center by a pixel shift
 * computed from a DIFFERENT scale approximation - two inconsistent estimates
 * patched over with a hand-tuned damping factor, which drifted with latitude
 * and situation. With a region, the pin's screen offset is expressed as a
 * fraction of latitudeDelta, which the map honors vertically - so the
 * placement is exact by construction, no tuning constants.
 */
export function focusRegionAboveSheet(
  lat: number,
  lng: number,
  zoom: number,
  screenWidth: number,
  screenHeight: number,
  photoCount: number = 1,
): FocusRegion {
  // Web Mercator ground resolution at this zoom - only used to pick the
  // region SIZE (how zoomed in we are), not the pin placement.
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  const latitudeDelta = (screenHeight * metersPerPixel) / 111_320;
  const longitudeDelta =
    (screenWidth * metersPerPixel) /
    (111_320 * Math.cos((lat * Math.PI) / 180));

  // Pin sits targetY px from the top; the center is mid-screen. Shift the
  // center south by that pixel difference as a fraction of the full span.
  const visibleHeight = screenHeight * (1 - SHEET_COLLAPSED_FRACTION);
  const targetY = visibleHeight * FOCUS_FRACTION_OF_VISIBLE_AREA;
  const pinAboveCenterPx = screenHeight / 2 - targetY;
  const latitude = lat - (pinAboveCenterPx / screenHeight) * latitudeDelta;
  const nudgePx = photoCount > 1 ? 0 : SINGLE_PHOTO_HORIZONTAL_PIXEL_NUDGE;
  const longitude = lng + (nudgePx / screenWidth) * longitudeDelta;

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}
