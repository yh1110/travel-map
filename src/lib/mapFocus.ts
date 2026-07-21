// Matches SpotSheet's collapsed snap point ("58%") - the fraction of the
// screen height the sheet covers once it rises, so the focused spot doesn't
// end up hidden behind it.
const SHEET_COLLAPSED_FRACTION = 0.58;
// Where in the remaining visible area (above the sheet) the spot should sit,
// as a fraction of that area's height.
const FOCUS_FRACTION_OF_VISIBLE_AREA = 0.45;
// The meters-per-pixel -> altitude conversion AppMap.ios.tsx uses for `zoom`
// is itself an untuned approximation, so the pixel shift computed from it
// overshoots. Damp it down; tune this if the spot still isn't positioned
// right (0 = no shift/back to dead center, 1 = full computed shift).
const OFFSET_STRENGTH = 0.25;
// Small rightward screen-space bias to correct for (nudge positive = left).
const HORIZONTAL_PIXEL_SHIFT = 6;

export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Shifts a focus coordinate south (and a touch east/west) of a spot so the
 * spot itself renders higher on screen - in the area not covered by the
 * collapsed SpotSheet - instead of dead center. Web Mercator meters-per-pixel
 * approximation, same one AppMap.ios.tsx uses for zoom->altitude - tune the
 * constants above if the spot isn't positioned right.
 */
export function focusCoordinateAboveSheet(
  lat: number,
  lng: number,
  zoom: number,
  screenHeight: number,
): Coordinate {
  const visibleHeight = screenHeight * (1 - SHEET_COLLAPSED_FRACTION);
  const targetY = visibleHeight * FOCUS_FRACTION_OF_VISIBLE_AREA;
  const verticalPixelShift = (screenHeight / 2 - targetY) * OFFSET_STRENGTH;
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  const latOffset = (verticalPixelShift * metersPerPixel) / 111_320;
  const lngOffset =
    (HORIZONTAL_PIXEL_SHIFT * metersPerPixel) /
    (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat - latOffset, lng: lng + lngOffset };
}
