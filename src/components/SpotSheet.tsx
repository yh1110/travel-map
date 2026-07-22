import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
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

import { usePhotoAspectRatio } from "../lib/imageSize";
import type { SpotGroup } from "../lib/spotGroups";
import { resolvePhotoUrl } from "../lib/supabase";
import { SpotHeroBackdrop } from "./SpotHeroBackdrop";
import { SpotHeroPhoto, type PhotoFrame } from "./SpotHeroPhoto";
import { SpotSheetCollapsed } from "./SpotSheetCollapsed";
import { SpotSheetExpanded } from "./SpotSheetExpanded";

interface SpotSheetProps {
  group: SpotGroup | null;
  onClose: () => void;
}

// 4a (collapsed) peeks from the bottom; dragging up to 4b (expanded) fills
// the screen. enableDynamicSizing is off so only these points are used.
const SNAP_POINTS = ["58%", "100%"];

// Keep the expanded hero within a sane range regardless of the photo's own
// aspect ratio - a very wide pano or a very tall portrait would otherwise
// end up absurdly short or crowd out the text below it.
const MIN_HERO_FRACTION = 0.35;
const MAX_HERO_FRACTION = 0.72;

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
// Rendered as an overlay INSIDE the content instead of via gorhom's
// handleComponent: a handle component occupies layout height above the
// content (BottomSheetBody is column-reverse), which at the 100% snap point
// left a content-free strip at the very top of the screen where only the
// dark sheet background showed - a black band above the backdrop.
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
    <Animated.View
      style={[styles.handleContainer, animatedStyle]}
      pointerEvents="none"
    >
      <View style={styles.handleIndicator} />
    </Animated.View>
  );
}

const EMPTY_FRAME: PhotoFrame = { x: 0, y: 0, width: 0, height: 0, borderRadius: 0 };

// The photo (SpotHeroPhoto) is one element shared between both layouts, its
// frame interpolated by the sheet's continuous drag position so it reads as
// scaling up continuously rather than two photos crossfading. The rest of
// each layout (badges, text, buttons) still crossfades via opacity.
function SpotSheetContent({
  group,
  currentIndex,
  onSelectIndex,
  onCollapse,
  expanded,
}: {
  group: SpotGroup;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onCollapse: () => void;
  expanded: boolean;
}) {
  const { animatedIndex } = useBottomSheet();
  const spot =
    group.spots[Math.min(currentIndex, group.spots.length - 1)] ??
    group.spots[0];
  const aspectRatio = usePhotoAspectRatio(
    spot ? resolvePhotoUrl(spot.photo_path) : "",
  );
  const [collapsedFrame, setCollapsedFrame] = useState<PhotoFrame>(EMPTY_FRAME);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  // Explicit size instead of StyleSheet.absoluteFill: absoluteFill derives its
  // height from the parent via top:0/bottom:0, but this sits in the
  // BottomSheetView content, which measures height 0 here (gorhom with
  // enableDynamicSizing off doesn't stretch the flex:1 content). A fixed-height
  // child like the photo still renders past that zero-height bound, but
  // natural-flow content below it (title/meta text) was clipping - same root
  // cause as the SpotHeroBackdrop black-background bug.
  const fullScreenStyle = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  };

  const expandedFrame = useMemo<PhotoFrame>(() => {
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

  if (!spot) return null;

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
        style={[fullScreenStyle, collapsedStyle]}
        pointerEvents={expanded ? "none" : "box-none"}
      >
        <SpotSheetCollapsed
          group={group}
          currentIndex={currentIndex}
          onSelectIndex={onSelectIndex}
          onPhotoLayout={setCollapsedFrame}
        />
      </Animated.View>
      <Animated.View
        style={[fullScreenStyle, expandedStyle]}
        pointerEvents={expanded ? "box-none" : "none"}
      >
        <SpotSheetExpanded
          group={group}
          currentIndex={currentIndex}
          onSelectIndex={onSelectIndex}
          onCollapse={onCollapse}
        />
      </Animated.View>
      <SpotSheetHandle />
    </View>
  );
}

export function SpotSheet({ group, onClose }: SpotSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => SNAP_POINTS, []);
  // Keep the last non-null group rendered so content doesn't blank out during
  // the close animation when `group` flips to null.
  const [renderedGroup, setRenderedGroup] = useState<SpotGroup | null>(group);
  // Which photo of the group is currently shown (0 = newest).
  const [currentIndex, setCurrentIndex] = useState(0);
  // Settled snap index, used only to gate which content layer can receive
  // touches - the crossfade itself is driven by the continuous animatedIndex
  // inside SpotSheetContent, not this.
  const [index, setIndex] = useState(-1);

  // React to the selected group *identity*, not object reference: a
  // background refetch hands back new group objects, and depending on those
  // would yank an expanded sheet back to collapsed.
  useEffect(() => {
    if (group) {
      setRenderedGroup(group);
      setCurrentIndex(0);
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [group?.id]);

  // A refetch can still shrink the group (e.g. a spot deleted elsewhere) -
  // keep the rendered data fresh without resetting the sheet position.
  useEffect(() => {
    if (group) setRenderedGroup(group);
  }, [group]);

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
      handleComponent={null}
    >
      <BottomSheetView style={styles.content}>
        {renderedGroup != null && (
          <SpotSheetContent
            group={renderedGroup}
            currentIndex={currentIndex}
            onSelectIndex={setCurrentIndex}
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
  background: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  handleContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  handleIndicator: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d8d5cd",
  },
});
