import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { formatRelativeTime, formatTakenAt } from "../lib/format";
import { useRoughAddress } from "../lib/geocode";
import type { Spot } from "../lib/spots";
import type { PhotoFrame } from "./SpotHeroPhoto";
import { ClockIcon, PinIcon } from "./SpotSheetIcons";

const PHOTO_BORDER_RADIUS = 20;

const META_COLOR = "#9a9a9a";

interface SpotSheetCollapsedProps {
  spot: Spot;
  onPhotoLayout: (frame: PhotoFrame) => void;
}

export function SpotSheetCollapsed({
  spot,
  onPhotoLayout,
}: SpotSheetCollapsedProps) {
  const place = useRoughAddress(spot.lat, spot.lng);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    onPhotoLayout({ x, y, width, height, borderRadius: PHOTO_BORDER_RADIUS });
  };

  return (
    <View style={styles.container}>
      <View style={styles.photoWrap} onLayout={handleLayout}>
        {/* The actual photo is SpotHeroPhoto, a sibling absolutely
            positioned over this slot - this is just a transparent spacer
            that reserves the layout space and reports it via onLayout. */}
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>
            {formatRelativeTime(spot.taken_at)}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
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
    borderRadius: PHOTO_BORDER_RADIUS,
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
