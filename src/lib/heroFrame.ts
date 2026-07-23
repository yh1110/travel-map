export interface PhotoFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

// Keep the expanded hero within a sane range regardless of the photo's own
// aspect ratio - a very wide pano or a very tall portrait would otherwise
// end up absurdly short or crowd out the text below it.
const MIN_HERO_FRACTION = 0.35;
const MAX_HERO_FRACTION = 0.72;

/**
 * Where a photo of the given aspect ratio sits in the expanded (4b) view:
 * aspect-fit at full width, height clamped, centered on both axes -
 * Google-Maps-photo-viewer style. Shared by the single hero photo (the
 * collapse/expand shared element) and every page of the full-screen pager
 * so the crossfade between them is seamless.
 */
export function expandedFrameForRatio(
  aspectRatio: number,
  screenWidth: number,
  screenHeight: number,
): PhotoFrame {
  const rawHeight = screenWidth / aspectRatio;
  const height = Math.min(
    Math.max(rawHeight, screenHeight * MIN_HERO_FRACTION),
    screenHeight * MAX_HERO_FRACTION,
  );
  const width = Math.min(height * aspectRatio, screenWidth);
  return {
    x: (screenWidth - width) / 2,
    y: (screenHeight - height) / 2,
    width,
    height,
    borderRadius: 0,
  };
}
