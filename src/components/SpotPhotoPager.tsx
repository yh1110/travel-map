import { useMemo } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { useBottomSheet } from "@gorhom/bottom-sheet";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { expandedFrameForRatio } from "../lib/heroFrame";
import { usePhotoAspectRatio } from "../lib/imageSize";
import type { Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";

interface SpotPhotoPagerProps {
  spots: Spot[];
  index: number;
  /** Horizontal track position: -index * screenWidth when settled. */
  trackX: SharedValue<number>;
}

// One full-screen page: the photo's own blurred backdrop edge to edge with
// the sharp centered copy on top - so a horizontal swipe visibly moves the
// WHOLE screen to the neighboring photo, not just the small sharp image.
function PagerPage({ spot, pageIndex }: { spot: Spot; pageIndex: number }) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const uri = resolvePhotoUrl(spot.photo_path);
  const ratio = usePhotoAspectRatio(uri);
  const frame = useMemo(
    () => expandedFrameForRatio(ratio, screenWidth, screenHeight),
    [ratio, screenWidth, screenHeight],
  );

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: pageIndex * screenWidth,
        width: screenWidth,
        height: screenHeight,
      }}
    >
      {/* absoluteFill is safe here (unlike directly under BottomSheetView):
          the parent has an explicit width/height to resolve against. */}
      <Image
        source={{ uri }}
        resizeMode="cover"
        blurRadius={40}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tint} />
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={{
          position: "absolute",
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
        }}
      />
    </View>
  );
}

/**
 * Full-screen horizontal pager shown only at the expanded (4b) snap point.
 * It crossfades in over the single shared-element hero photo right at full
 * expansion (both render the current photo with identical framing, so the
 * handoff is invisible), then swiping drags entire pages - backdrop and
 * all - like a native photo viewer. Windowed to the current page ±1.
 */
export function SpotPhotoPager({ spots, index, trackX }: SpotPhotoPagerProps) {
  const { animatedIndex } = useBottomSheet();
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0.9, 0.98],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [{ translateX: trackX.value }],
  }));

  const from = Math.max(0, index - 1);
  const to = Math.min(spots.length - 1, index + 1);
  const pages = spots
    .slice(from, to + 1)
    .map((spot, k) => ({ spot, pageIndex: from + k }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: screenWidth,
          height: screenHeight,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      {pages.map(({ spot, pageIndex }) => (
        <PagerPage key={spot.id} spot={spot} pageIndex={pageIndex} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFill,
    // Same tint as SpotHeroBackdrop so the pager's pages match the single
    // backdrop they replace at full expansion.
    backgroundColor: "rgba(18,14,12,0.42)",
  },
});
