import { Image } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useBottomSheet } from "@gorhom/bottom-sheet";

import type { PhotoFrame } from "../lib/heroFrame";
import { resolvePhotoUrl } from "../lib/supabase";

export type { PhotoFrame };

interface SpotHeroPhotoProps {
  photoPath: string;
  collapsedFrame: PhotoFrame;
  expandedFrame: PhotoFrame;
}

/**
 * The single Image shared between the collapsed (4a) and expanded (4b)
 * layouts. Rendered once, absolutely positioned, with its frame
 * interpolated between the two layouts' photo slots by the sheet's
 * continuous drag position - this is what makes the photo read as one
 * continuous element scaling up rather than two photos crossfading.
 */
export function SpotHeroPhoto({
  photoPath,
  collapsedFrame,
  expandedFrame,
}: SpotHeroPhotoProps) {
  const { animatedIndex } = useBottomSheet();
  const uri = resolvePhotoUrl(photoPath);

  const animatedStyle = useAnimatedStyle(() => {
    const t = animatedIndex.value;
    const lerp = (from: number, to: number) =>
      interpolate(t, [0, 1], [from, to], Extrapolation.CLAMP);

    return {
      position: "absolute",
      left: lerp(collapsedFrame.x, expandedFrame.x),
      top: lerp(collapsedFrame.y, expandedFrame.y),
      width: lerp(collapsedFrame.width, expandedFrame.width),
      height: lerp(collapsedFrame.height, expandedFrame.height),
      borderRadius: lerp(
        collapsedFrame.borderRadius,
        expandedFrame.borderRadius,
      ),
      overflow: "hidden",
      // Hand off to SpotPhotoPager right at full expansion: it renders the
      // current photo with identical framing, so this crossfade is invisible.
      opacity: interpolate(t, [0.9, 0.98], [1, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={animatedStyle} pointerEvents="none">
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </Animated.View>
  );
}
