import { Dimensions, Image, StyleSheet, View } from "react-native";
import { useBottomSheet } from "@gorhom/bottom-sheet";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { resolvePhotoUrl } from "../lib/supabase";

interface SpotHeroBackdropProps {
  photoPath: string;
}

// Fills the letterboxed space around the (possibly narrower) sharp photo
// with the same image, blurred and darkened, edge to edge, instead of plain
// dark bars - the same technique Google Maps' photo viewer uses. Sits behind
// SpotHeroPhoto and only fades in for the expanded (4b) layout.
export function SpotHeroBackdrop({ photoPath }: SpotHeroBackdropProps) {
  const { animatedIndex } = useBottomSheet();
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const animatedStyle = useAnimatedStyle(() => ({
    // Fades in through the expand drag, then hands off to SpotPhotoPager
    // (whose pages carry their own identical backdrop) at full expansion.
    opacity: interpolate(
      animatedIndex.value,
      [0.4, 0.9, 0.98],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    // Size this explicitly to the screen instead of StyleSheet.absoluteFill.
    // absoluteFill derives its height from the parent (top:0/bottom:0), but this
    // sits in the BottomSheetView content, which measures height 0 here (gorhom
    // with enableDynamicSizing off doesn't stretch the flex:1 content), so
    // absoluteFill collapsed to width:screen, height:0 - the Image (also
    // absoluteFill) inherited height 0 and never drew, which is why the backdrop
    // read as plain black. SpotHeroPhoto avoids this by using explicit Dimensions
    // too. Verified via onLayout: absoluteFill -> {width:402,height:0}.
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
      <Image
        source={{ uri: resolvePhotoUrl(photoPath) }}
        resizeMode="cover"
        blurRadius={40}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tint} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFill,
    // Light enough that the blurred photo still reads as the photo (not a
    // near-black slab), dark enough that the sharp centered photo and the
    // white chrome/text on top of it stay legible.
    backgroundColor: "rgba(18,14,12,0.42)",
  },
});
