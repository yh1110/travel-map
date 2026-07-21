import { useEffect, useState } from "react";
import { Image } from "react-native";

// Fallback while the photo's real dimensions are still loading.
const DEFAULT_ASPECT_RATIO = 4 / 3;

/** A photo's own aspect ratio (width / height), once known (falls back to a 4:3 guess). */
export function usePhotoAspectRatio(uri: string): number {
  const [ratio, setRatio] = useState(DEFAULT_ASPECT_RATIO);

  useEffect(() => {
    let cancelled = false;
    setRatio(DEFAULT_ASPECT_RATIO);
    Image.getSize(
      uri,
      (width, height) => {
        if (!cancelled && height > 0) setRatio(width / height);
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
