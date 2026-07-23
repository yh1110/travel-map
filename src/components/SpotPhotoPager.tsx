import { memo, useMemo } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useBottomSheet } from "@gorhom/bottom-sheet";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatTakenAt } from "../lib/format";
import { useRoughAddress } from "../lib/geocode";
import { expandedFrameForRatio } from "../lib/heroFrame";
import { usePhotoAspectRatio } from "../lib/imageSize";
import type { SpotGroup } from "../lib/spotGroups";
import type { Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";
import {
  BookmarkIcon,
  ClockIcon,
  PersonIcon,
  PinIcon,
  ShareIcon,
} from "./SpotSheetIcons";

const DARK = "#141210";
const META_COLOR = "rgba(255,255,255,0.6)";

// Vertical space the fixed film strip (rendered by SpotSheetExpanded)
// occupies below each page's info block: 52px thumbs + 16px gap.
const STRIP_SPACE = 68;

interface SpotPhotoPagerProps {
  group: SpotGroup;
  index: number;
  /** Horizontal track position: -index * screenWidth when settled. */
  trackX: SharedValue<number>;
}

// One full-screen page: the photo's own blurred backdrop, scrim, sharp
// centered photo AND the info block (title / place / date / account /
// actions) - Google-Maps-photo-viewer style, where a horizontal swipe
// visibly slides everything on screen to the neighboring photo. Only
// navigation chrome (top bar, film strip) stays fixed above this.
const PagerPage = memo(function PagerPage({
  spot,
  pageIndex,
  place,
  bottomPadding,
}: {
  spot: Spot;
  pageIndex: number;
  place: string;
  bottomPadding: number;
}) {
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
      {/* Same fixed-offset scrim the expanded overlay used to own: light on
          top for the chrome, dark at the bottom for the info text. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient
            id={`pageFade-${spot.id}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <Stop offset="0" stopColor="#000" stopOpacity={0.35} />
            <Stop offset="0.18" stopColor="#000" stopOpacity={0} />
            <Stop offset="0.58" stopColor={DARK} stopOpacity={0} />
            <Stop offset="1" stopColor={DARK} stopOpacity={0.85} />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#pageFade-${spot.id})`}
        />
      </Svg>

      <View style={[styles.bottom, { paddingBottom: bottomPadding }]}>
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <Text style={styles.title} numberOfLines={2}>
              {spot.title}
            </Text>

            <View style={styles.metaRow}>
              <PinIcon color={META_COLOR} />
              <Text style={styles.metaText} numberOfLines={1}>
                {place}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <ClockIcon color={META_COLOR} />
              <Text style={styles.metaText} numberOfLines={1}>
                {formatTakenAt(spot.taken_at)}
              </Text>
            </View>

            {/* No profile feature yet - static placeholder until accounts
                exist. Own post, so it anchors the bottom of the block. */}
            <View style={styles.accountRow}>
              <View style={styles.avatar}>
                <PersonIcon color="#fff" size={14} />
              </View>
              <Text style={styles.accountText}>自分の投稿</Text>
            </View>
          </View>

          {/* Visual only for now: share/save actions are out of scope. */}
          <View style={styles.actionColumn}>
            <ShareIcon color="#fff" />
            <BookmarkIcon color="#fff" />
          </View>
        </View>
      </View>
    </View>
  );
});

/**
 * Full-screen horizontal pager shown only at the expanded (4b) snap point.
 * It crossfades in over the single shared-element hero photo right at full
 * expansion (both render the current photo with identical framing, so the
 * handoff is invisible), then swiping drags entire pages - backdrop, photo,
 * scrim and info block. Windowed to the current page ±1.
 */
export function SpotPhotoPager({ group, index, trackX }: SpotPhotoPagerProps) {
  const { animatedIndex } = useBottomSheet();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const place = useRoughAddress(group.lat, group.lng);

  const spots = group.spots;
  const multi = spots.length > 1;
  const bottomPadding = insets.bottom + 24 + (multi ? STRIP_SPACE : 0);

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
        <PagerPage
          key={spot.id}
          spot={spot}
          pageIndex={pageIndex}
          place={place}
          bottomPadding={bottomPadding}
        />
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
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bottomLeft: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    flexShrink: 1,
    color: META_COLOR,
    fontSize: 12.5,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  actionColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 22,
    paddingBottom: 4,
  },
});
