import { useEffect, useState } from "react";
import { Image } from "react-native";

// Fallback while the photo's real dimensions are still loading.
const DEFAULT_ASPECT_RATIO = 4 / 3;

// Resolved ratios survive component unmounts (pager pages mount and unmount
// as the window slides) so a page never re-renders at the 4:3 fallback and
// visibly pops to its real frame a beat after a swipe lands.
const ratioCache = new Map<string, number>();

/** A photo's own aspect ratio (width / height), once known (falls back to a 4:3 guess). */
export function usePhotoAspectRatio(uri: string): number {
  const [ratio, setRatio] = useState(
    () => ratioCache.get(uri) ?? DEFAULT_ASPECT_RATIO,
  );

  useEffect(() => {
    const cached = ratioCache.get(uri);
    if (cached !== undefined) {
      setRatio(cached);
      return;
    }

    let cancelled = false;
    setRatio(DEFAULT_ASPECT_RATIO);
    Image.getSize(
      uri,
      (width, height) => {
        if (height > 0) {
          ratioCache.set(uri, width / height);
          if (!cancelled) setRatio(width / height);
        }
      },
      () => {
        // Keep the fallback ratio - the photo itself will still load fine.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return ratio;
}
