import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatRelativeTime, formatTakenAt } from "../lib/format";
import { useRoughAddress } from "../lib/geocode";
import type { SpotGroup } from "../lib/spotGroups";
import { resolvePhotoUrl } from "../lib/supabase";
import {
  BookmarkIcon,
  ClockIcon,
  CloseIcon,
  PersonIcon,
  PinIcon,
  ShareIcon,
} from "./SpotSheetIcons";

const DARK = "#141210";
const META_COLOR = "rgba(255,255,255,0.6)";

// Film strip shows at most this many thumbnails; the rest collapse into a
// "+N" tile like the mock.
const STRIP_MAX = 4;

interface SpotSheetExpandedProps {
  group: SpotGroup;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onCollapse: () => void;
}

export function SpotSheetExpanded({
  group,
  currentIndex,
  onSelectIndex,
  onCollapse,
}: SpotSheetExpandedProps) {
  const insets = useSafeAreaInsets();
  const place = useRoughAddress(group.lat, group.lng);

  const spots = group.spots;
  const index = Math.min(currentIndex, spots.length - 1);
  const spot = spots[index] ?? spots[0];
  const multi = spots.length > 1;

  const step = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < spots.length) onSelectIndex(next);
  };

  // Horizontal swipe moves between the photos of this location. Activates
  // only on a clearly horizontal drag so it doesn't fight the sheet's own
  // vertical pan (which fails this gesture via failOffsetY).
  const swipe = Gesture.Pan()
    .enabled(multi)
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      "worklet";
      if (e.translationX < -50) runOnJS(step)(1);
      else if (e.translationX > 50) runOnJS(step)(-1);
    });

  if (!spot) return null;

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.container}>
        {/* The blurred backdrop and the sharp centered photo (SpotHeroPhoto)
            are both siblings rendered by SpotSheet, underneath this view. The
            photo floats in the middle over the edge-to-edge blurred copy, so
            this must NOT paint an opaque slab over it. Fixed-offset scrims
            only: a light top wash so the status bar / buttons read,
            transparent through the middle where the photo sits, and a darker
            bottom wash so the white text below is legible over the blurred
            background. */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity={0.35} />
              <Stop offset="0.18" stopColor="#000" stopOpacity={0} />
              <Stop offset="0.58" stopColor={DARK} stopOpacity={0} />
              <Stop offset="1" stopColor={DARK} stopOpacity={0.85} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroFade)" />
        </Svg>

        <View
          style={[styles.topBar, { top: insets.top + 12 }]}
          pointerEvents="box-none"
        >
          {/* Date label: coarse relative time ("たった今" / "N時間前"). */}
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>
              {formatRelativeTime(spot.taken_at)}
            </Text>
          </View>
          {multi && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1} / {spots.length}
              </Text>
            </View>
          )}
          <Pressable
            style={styles.iconButton}
            onPress={onCollapse}
            accessibilityLabel="閉じる"
          >
            <CloseIcon color="#fff" />
          </Pressable>
        </View>

        <View
          style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}
          pointerEvents="box-none"
        >
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

              {/* No profile feature yet - this is a static placeholder until
                  accounts/display names exist. Own post, so this anchors the
                  bottom-most position of the block. */}
              <View style={styles.accountRow}>
                <View style={styles.avatar}>
                  <PersonIcon color="#fff" size={14} />
                </View>
                <Text style={styles.accountText}>自分の投稿</Text>
              </View>
            </View>

            {/* Visual only for now: share/save actions are out of scope. */}
            <View style={styles.actionColumn}>
              <Pressable
                style={styles.actionButton}
                disabled
                accessibilityLabel="共有"
              >
                <ShareIcon color="#fff" />
              </Pressable>
              <Pressable
                style={styles.actionButton}
                disabled
                accessibilityLabel="保存"
              >
                <BookmarkIcon color="#fff" />
              </Pressable>
            </View>
          </View>

          {multi && (
            <View style={styles.strip}>
              {spots.slice(0, STRIP_MAX).map((s, i) => (
                <Pressable key={s.id} onPress={() => onSelectIndex(i)}>
                  <Image
                    source={{ uri: resolvePhotoUrl(s.photo_path) }}
                    style={[
                      styles.stripPhoto,
                      // Older photos sink like the mock's film strip.
                      { opacity: i === index ? 1 : Math.max(0.4, 0.85 - i * 0.15) },
                      i === index && styles.stripPhotoCurrent,
                    ]}
                  />
                </Pressable>
              ))}
              {spots.length > STRIP_MAX && (
                <View style={[styles.stripPhoto, styles.stripMore]}>
                  <Text style={styles.stripMoreText}>
                    +{spots.length - STRIP_MAX}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Transparent - the blurred backdrop + sharp photo (SpotHeroPhoto) are
  // rendered behind this by SpotSheet and show through everywhere this
  // layout doesn't itself paint something opaque.
  container: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#4ade80",
    shadowColor: "#4ade80",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  counter: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  counterText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
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
  actionColumn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 22,
    paddingBottom: 4,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  stripPhoto: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  stripPhotoCurrent: {
    width: 52,
    height: 52,
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  stripMore: {
    alignItems: "center",
    justifyContent: "center",
  },
  stripMoreText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
