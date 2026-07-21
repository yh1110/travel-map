import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { formatRelativeTime, formatTakenAt } from "../lib/format";
import { useRoughAddress } from "../lib/geocode";
import type { Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";
import { colors } from "../theme";

const META_COLOR = "#9a9a9a";

function PinIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
      <Path
        d="M7.5 1.5c-2.35 0-4.25 1.9-4.25 4.25 0 3.1 4.25 7.5 4.25 7.5s4.25-4.4 4.25-7.5c0-2.35-1.9-4.25-4.25-4.25z"
        stroke={META_COLOR}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <Circle cx="7.5" cy="5.75" r="1.6" stroke={META_COLOR} strokeWidth="1.3" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
      <Circle cx="7.5" cy="7.5" r="5.75" stroke={META_COLOR} strokeWidth="1.3" />
      <Line
        x1="7.5"
        y1="4.5"
        x2="7.5"
        y2="7.5"
        stroke={META_COLOR}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <Line
        x1="7.5"
        y1="7.5"
        x2="9.9"
        y2="8.7"
        stroke={META_COLOR}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface SpotSheetCollapsedProps {
  spot: Spot;
}

export function SpotSheetCollapsed({ spot }: SpotSheetCollapsedProps) {
  const place = useRoughAddress(spot.lat, spot.lng);

  return (
    <View style={styles.container}>
      <View style={styles.photoWrap}>
        <Image
          source={{ uri: resolvePhotoUrl(spot.photo_path) }}
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>
            {formatRelativeTime(spot.taken_at)}
          </Text>
        </View>
      </View>

      {/* No title column yet - stand in with the absolute capture time, the
          same placeholder SpotThumbnail uses. */}
      <Text style={styles.title} numberOfLines={1}>
        {formatTakenAt(spot.taken_at)}
      </Text>

      <View style={styles.metaRow}>
        <PinIcon />
        <Text style={styles.metaText} numberOfLines={1}>
          {place}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <ClockIcon />
        <Text style={styles.metaText} numberOfLines={1}>
          {formatTakenAt(spot.taken_at)} 撮影
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  photoWrap: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#141414",
    marginTop: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 8,
  },
  metaText: {
    flex: 1,
    color: META_COLOR,
    fontSize: 13,
  },
});
