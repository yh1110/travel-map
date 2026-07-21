import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetView,
  useBottomSheet,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";

import type { Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";
import { SpotHeroPhoto, type PhotoFrame } from "./SpotHeroPhoto";
import { SpotSheetCollapsed } from "./SpotSheetCollapsed";
import { SpotSheetExpanded } from "./SpotSheetExpanded";

interface SpotSheetProps {
  spot: Spot | null;
  onClose: () => void;
}

// 4a (collapsed) peeks from the bottom; dragging up to 4b (expanded) fills
// the screen. enableDynamicSizing is off so only these points are used.
const SNAP_POINTS = ["58%", "100%"];

// Fallback while the photo's real dimensions are still loading.
const DEFAULT_ASPECT_RATIO = 4 / 3;
// Keep the expanded hero within a sane range regardless of the photo's own
// aspect ratio - a very wide pano or a very tall portrait would otherwise
// end up absurdly short or crowd out the text below it.
const MIN_HERO_FRACTION = 0.35;
const MAX_HERO_FRACTION = 0.72;

/** The photo's own aspect ratio, once known (falls back to a 4:3 guess). */
function usePhotoAspectRatio(photoPath: string): number {
  const [ratio, setRatio] = useState(DEFAULT_ASPECT_RATIO);

  useEffect(() => {
    let cancelled = false;
    setRatio(DEFAULT_ASPECT_RATIO);
    Image.getSize(
      resolvePhotoUrl(photoPath),
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
  }, [photoPath]);

  return ratio;
}

// Background swaps from the light collapsed card to the dark expanded page
// as the drag crosses the midpoint between snap points 0 and 1.
function SpotSheetBackground(props: BottomSheetBackgroundProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      props.animatedIndex.value,
      [0, 1],
      ["#ffffff", "#141210"],
    );
    const radius = interpolate(
      props.animatedIndex.value,
      [0, 1],
      [26, 0],
      Extrapolation.CLAMP,
    );
    return {
      backgroundColor,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    };
  });

  return (
    <Animated.View
      pointerEvents={props.pointerEvents}
      style={[props.style, styles.background, animatedStyle]}
    />
  );
}

// The drag handle only makes sense on the collapsed card - fade it out
// early so it's gone well before the dark expanded page takes over.
function SpotSheetHandle() {
  const { animatedIndex } = useBottomSheet();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 0.4],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={[styles.handleContainer, animatedStyle]}>
      <View style={styles.handleIndicator} />
    </Animated.View>
  );
}

// Fills the letterboxed space around the (possibly narrower) sharp photo
// with the same image, blurred and darkened, edge to edge, instead of plain
// dark bars - the same technique Google Maps' photo viewer uses. Sits behind
// SpotHeroPhoto and only fades in for the expanded (4b) layout.
function SpotHeroBackdrop({ photoPath }: { photoPath: string }) {
  const { animatedIndex } = useBottomSheet();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0.4, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, animatedStyle]}
      pointerEvents="none"
    >
      <Image
        source={{ uri: resolvePhotoUrl(photoPath) }}
        resizeMode="cover"
        blurRadius={40}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backdropTint} />
    </Animated.View>
  );
}

const EMPTY_FRAME: PhotoFrame = { x: 0, y: 0, width: 0, height: 0, borderRadius: 0 };

// The photo (SpotHeroPhoto) is one element shared between both layouts, its
// frame interpolated by the sheet's continuous drag position so it reads as
// scaling up continuously rather than two photos crossfading. The rest of
// each layout (badges, text, buttons) still crossfades via opacity.
function SpotSheetContent({
  spot,
  onCollapse,
  expanded,
}: {
  spot: Spot;
  onCollapse: () => void;
  expanded: boolean;
}) {
  const { animatedIndex } = useBottomSheet();
  const aspectRatio = usePhotoAspectRatio(spot.photo_path);
  const [collapsedFrame, setCollapsedFrame] = useState<PhotoFrame>(EMPTY_FRAME);

  const expandedFrame = useMemo<PhotoFrame>(() => {
    const { width: screenWidth, height: screenHeight } =
      Dimensions.get("window");
    const rawHeight = screenWidth / aspectRatio;
    const height = Math.min(
      Math.max(rawHeight, screenHeight * MIN_HERO_FRACTION),
      screenHeight * MAX_HERO_FRACTION,
    );
    // Keep this exact aspect ratio at that height. For portrait photos this
    // comes out narrower than the screen once height gets capped - center
    // it instead of stretching/cropping it to fill the full width.
    const width = Math.min(height * aspectRatio, screenWidth);
    // Center in the full viewport (both axes), Google-Maps-photo-viewer style:
    // the sharp photo floats in the middle with the blurred copy filling every
    // edge around it, rather than being pinned to the top over a dark slab.
    const x = (screenWidth - width) / 2;
    const y = (screenHeight - height) / 2;
    return { x, y, width, height, borderRadius: 0 };
  }, [aspectRatio]);

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0.4, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={styles.content}>
      <SpotHeroBackdrop photoPath={spot.photo_path} />
      {collapsedFrame.width > 0 && (
        <SpotHeroPhoto
          photoPath={spot.photo_path}
          collapsedFrame={collapsedFrame}
          expandedFrame={expandedFrame}
        />
      )}
      <Animated.View
        style={[StyleSheet.absoluteFill, collapsedStyle]}
        pointerEvents={expanded ? "none" : "box-none"}
      >
        <SpotSheetCollapsed spot={spot} onPhotoLayout={setCollapsedFrame} />
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, expandedStyle]}
        pointerEvents={expanded ? "box-none" : "none"}
      >
        <SpotSheetExpanded spot={spot} onCollapse={onCollapse} />
      </Animated.View>
    </View>
  );
}

export function SpotSheet({ spot, onClose }: SpotSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => SNAP_POINTS, []);
  // Keep the last non-null spot rendered so content doesn't blank out during
  // the close animation when `spot` flips to null.
  const [renderedSpot, setRenderedSpot] = useState<Spot | null>(spot);
  // Settled snap index, used only to gate which content layer can receive
  // touches - the crossfade itself is driven by the continuous animatedIndex
  // inside SpotSheetContent, not this.
  const [index, setIndex] = useState(-1);

  // React to the selected spot *identity*, not object reference: a background
  // refetch hands back new Spot objects, and depending on those would yank an
  // expanded sheet back to collapsed. A spot's data is immutable per id.
  useEffect(() => {
    if (spot) {
      setRenderedSpot(spot);
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [spot?.id]);

  const handleChange = useCallback(
    (i: number) => {
      setIndex(i);
      if (i === -1) onClose();
    },
    [onClose],
  );

  const collapse = useCallback(() => {
    sheetRef.current?.snapToIndex(0);
  }, []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      onChange={handleChange}
      backgroundComponent={SpotSheetBackground}
      handleComponent={SpotSheetHandle}
    >
      <BottomSheetView style={styles.content}>
        {renderedSpot != null && (
          <SpotSheetContent
            spot={renderedSpot}
            onCollapse={collapse}
            expanded={index >= 1}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  backdropTint: {
    ...StyleSheet.absoluteFill,
    // Light enough that the blurred photo still reads as the photo (not a
    // near-black slab), dark enough that the sharp centered photo and the
    // white chrome/text on top of it stay legible.
    backgroundColor: "rgba(18,14,12,0.42)",
  },
  background: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleIndicator: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d8d5cd",
  },
});
