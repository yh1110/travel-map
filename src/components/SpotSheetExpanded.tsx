import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Circle,
  Line,
  Path,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatRelativeTime, formatTakenAt } from "../lib/format";
import { useRoughAddress } from "../lib/geocode";
import type { Spot } from "../lib/spots";

const DARK = "#141210";
const META_COLOR = "rgba(255,255,255,0.6)";

function BackChevron() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M13.5 4.5L7 11l6.5 6.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PinIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Path
        d="M7.5 1.5c-2.35 0-4.25 1.9-4.25 4.25 0 3.1 4.25 7.5 4.25 7.5s4.25-4.4 4.25-7.5c0-2.35-1.9-4.25-4.25-4.25z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <Circle cx="7.5" cy="5.75" r="1.6" stroke={color} strokeWidth="1.3" />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
      <Circle cx="7.5" cy="7.5" r="5.75" stroke={color} strokeWidth="1.3" />
      <Line
        x1="7.5"
        y1="4.5"
        x2="7.5"
        y2="7.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <Line
        x1="7.5"
        y1="7.5"
        x2="9.9"
        y2="8.7"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface SpotSheetExpandedProps {
  spot: Spot;
  onCollapse: () => void;
  // The shared SpotHeroPhoto's target height in this layout (varies by the
  // photo's own aspect ratio) - the darkening gradient overlays exactly that
  // area, so it needs to track it instead of assuming a fixed height.
  heroHeight: number;
}

export function SpotSheetExpanded({
  spot,
  onCollapse,
  heroHeight,
}: SpotSheetExpandedProps) {
  const insets = useSafeAreaInsets();
  const place = useRoughAddress(spot.lat, spot.lng);

  const screenHeight = Dimensions.get("window").height;
  // Fade from transparent (over the photo) to opaque DARK a little before
  // the photo's own bottom edge, fully opaque by well after it.
  const fadeStart = Math.max((heroHeight - 100) / screenHeight, 0.1);
  const fadeEnd = Math.min((heroHeight + 60) / screenHeight, 0.95);

  return (
    <View style={styles.container}>
      {/* The blurred backdrop and the sharp photo (SpotHeroPhoto) are both
          siblings rendered by SpotSheet, underneath this view. This spans
          the full screen: a touch of darkening right at the top (status bar
          / buttons), transparent through the photo, then fading to fully
          opaque DARK well before the text below - and staying opaque all the
          way to the bottom, since the photo doesn't necessarily reach it. */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0.35} />
            <Stop offset={fadeStart} stopColor="#000" stopOpacity={0} />
            <Stop offset={fadeEnd} stopColor={DARK} stopOpacity={0} />
            <Stop offset="1" stopColor={DARK} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroFade)" />
      </Svg>

      <View
        style={[styles.topBar, { top: insets.top + 12 }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.backButton}
          onPress={onCollapse}
          accessibilityLabel="閉じる"
        >
          <BackChevron />
        </Pressable>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>
            {formatRelativeTime(spot.taken_at)}
          </Text>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {/* No title column yet - stand in with the absolute capture time. */}
        <Text style={styles.title} numberOfLines={2}>
          {formatTakenAt(spot.taken_at)}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <PinIcon color={META_COLOR} />
            <Text style={styles.metaText} numberOfLines={1}>
              {place}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <ClockIcon color={META_COLOR} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatTakenAt(spot.taken_at)}
            </Text>
          </View>
        </View>

        {/* Visual only for now: launching an external map app is out of scope. */}
        <Pressable
          style={styles.goButton}
          disabled
          accessibilityLabel="ここへ行く"
        >
          <PinIcon color="#141414" size={18} />
          <Text style={styles.goText}>ここへ行く</Text>
        </Pressable>
      </View>
    </View>
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
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 18,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: META_COLOR,
    fontSize: 12.5,
  },
  goButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#fff",
    marginTop: 22,
  },
  goText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#141414",
  },
});
