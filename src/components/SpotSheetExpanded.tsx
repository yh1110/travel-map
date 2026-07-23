import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  runOnJS,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatRelativeTime } from "../lib/format";
import type { SpotGroup } from "../lib/spotGroups";
import { resolvePhotoUrl } from "../lib/supabase";
import { CloseIcon } from "./SpotSheetIcons";

// Film strip shows at most this many thumbnails; the rest collapse into a
// "+N" tile like the mock.
const STRIP_MAX = 4;

// Matches PAGER_SPRING in SpotSheet.tsx (not imported to avoid a require
// cycle between the sheet and its content components).
const SETTLE_SPRING = {
  damping: 30,
  stiffness: 280,
  overshootClamping: true,
};

interface SpotSheetExpandedProps {
  group: SpotGroup;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  /** Index change originating from the swipe itself (settle pre-animated). */
  onSwipeToIndex: (index: number) => void;
  /** The full-screen pager's track position, dragged directly by the swipe. */
  trackX: SharedValue<number>;
  onCollapse: () => void;
}

/**
 * Fixed navigation chrome over the full-screen pager. Everything that
 * belongs to an individual photo (backdrop, photo, scrim, title, place,
 * date, account, actions) lives inside SpotPhotoPager's pages and slides
 * with the swipe - only the controls stay put: top bar (freshness badge,
 * counter, close) and the film strip position indicator.
 */
export function SpotSheetExpanded({
  group,
  currentIndex,
  onSelectIndex,
  onSwipeToIndex,
  trackX,
  onCollapse,
}: SpotSheetExpandedProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get("window");

  const spots = group.spots;
  const count = spots.length;
  const index = Math.min(currentIndex, count - 1);
  const spot = spots[index] ?? spots[0];
  const multi = count > 1;

  // Whole-screen swipe between the photos of this location: the pager track
  // follows the finger continuously (rubber-banding past the ends), then
  // settles on the nearest page - or the next one on a fast flick. Activates
  // only on a clearly horizontal drag so it doesn't fight the sheet's own
  // vertical pan (which this fails via failOffsetY).
  const swipe = Gesture.Pan()
    .enabled(multi)
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onChange((e) => {
      "worklet";
      let tx = e.translationX;
      if ((index === 0 && tx > 0) || (index === count - 1 && tx < 0)) {
        tx = tx / 3;
      }
      trackX.value = -index * screenWidth + tx;
    })
    .onEnd((e) => {
      "worklet";
      let target = index;
      if (
        (e.translationX < -screenWidth * 0.25 || e.velocityX < -600) &&
        index < count - 1
      ) {
        target = index + 1;
      } else if (
        (e.translationX > screenWidth * 0.25 || e.velocityX > 600) &&
        index > 0
      ) {
        target = index - 1;
      }
      trackX.value = withSpring(-target * screenWidth, {
        ...SETTLE_SPRING,
        velocity: e.velocityX,
      });
      if (target !== index) runOnJS(onSwipeToIndex)(target);
    });

  if (!spot) return null;

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.container}>
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
                {index + 1} / {count}
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

        {multi && (
          <View
            style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}
            pointerEvents="box-none"
          >
            <View style={styles.strip}>
              {spots.slice(0, STRIP_MAX).map((s, i) => (
                <Pressable key={s.id} onPress={() => onSelectIndex(i)}>
                  <Image
                    source={{ uri: resolvePhotoUrl(s.photo_path) }}
                    style={[
                      styles.stripPhoto,
                      // Older photos sink like the mock's film strip.
                      {
                        opacity:
                          i === index ? 1 : Math.max(0.4, 0.85 - i * 0.15),
                      },
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
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Transparent - the pager pages (backdrop, photo, scrim, info) are
  // rendered behind this by SpotSheet and show through everywhere this
  // chrome doesn't itself paint something.
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
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
