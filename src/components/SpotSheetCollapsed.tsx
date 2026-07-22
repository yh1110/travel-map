import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { formatRelativeTime, formatTakenAt } from "../lib/format";
import { useRoughAddress } from "../lib/geocode";
import {
  filterByPeriod,
  type FreshnessPeriod,
  type SpotGroup,
} from "../lib/spotGroups";
import { resolvePhotoUrl } from "../lib/supabase";
import type { PhotoFrame } from "./SpotHeroPhoto";
import { ClockIcon, PinIcon } from "./SpotSheetIcons";
import { colors } from "../theme";

const PHOTO_BORDER_RADIUS = 20;

const META_COLOR = "#9a9a9a";

const PERIODS: { key: FreshnessPeriod; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "week", label: "今週" },
  { key: "all", label: "すべて" },
];

interface SpotSheetCollapsedProps {
  group: SpotGroup;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onPhotoLayout: (frame: PhotoFrame) => void;
}

export function SpotSheetCollapsed({
  group,
  currentIndex,
  onSelectIndex,
  onPhotoLayout,
}: SpotSheetCollapsedProps) {
  const place = useRoughAddress(group.lat, group.lng);
  const [period, setPeriod] = useState<FreshnessPeriod>("all");

  const spots = group.spots;
  const spot = spots[Math.min(currentIndex, spots.length - 1)] ?? spots[0];
  const multi = spots.length > 1;
  const stripSpots = multi ? filterByPeriod(spots, period) : [];

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    onPhotoLayout({ x, y, width, height, borderRadius: PHOTO_BORDER_RADIUS });
  };

  if (!spot) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {spot.title}
        </Text>
        {multi && (
          <Text style={styles.countText}>{spots.length}枚の投稿</Text>
        )}
      </View>

      <View style={styles.metaRow}>
        <PinIcon color={META_COLOR} />
        <Text style={styles.metaText} numberOfLines={1}>
          {place}
        </Text>
      </View>
      {!multi && (
        <View style={styles.metaRow}>
          <ClockIcon color={META_COLOR} />
          <Text style={styles.metaText} numberOfLines={1}>
            {formatTakenAt(spot.taken_at)} 撮影
          </Text>
        </View>
      )}

      {multi && (
        <View style={styles.chipRow}>
          {PERIODS.map(({ key, label }) => {
            const count = filterByPeriod(spots, key).length;
            const active = period === key;
            return (
              <Pressable
                key={key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPeriod(key)}
              >
                {key === "today" && count > 0 && (
                  <View style={styles.chipDot} />
                )}
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {key === "all" ? label : `${label} ${count}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View
        style={[styles.photoWrap, multi && styles.photoWrapMulti]}
        onLayout={handleLayout}
      >
        {/* The actual photo is SpotHeroPhoto, a sibling absolutely
            positioned over this slot - this is just a transparent spacer
            that reserves the layout space and reports it via onLayout. */}
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>
            {formatRelativeTime(spot.taken_at)}
            {multi && currentIndex === 0 ? "・最新" : ""}
          </Text>
        </View>
      </View>

      {multi && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
          contentContainerStyle={styles.stripContent}
        >
          {stripSpots.map((s) => {
            const index = spots.indexOf(s);
            const selected = index === currentIndex;
            // Older photos sink: fade with their position in the
            // freshness order, like the mock's gallery strip.
            const opacity = Math.max(0.5, 0.95 - index * 0.15);
            return (
              <Pressable
                key={s.id}
                style={styles.stripItem}
                onPress={() => onSelectIndex(index)}
              >
                <Image
                  source={{ uri: resolvePhotoUrl(s.photo_path) }}
                  style={[
                    styles.stripPhoto,
                    { opacity: selected ? 1 : opacity },
                    selected && styles.stripPhotoSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.stripLabel,
                    index === 0 && styles.stripLabelFresh,
                  ]}
                  numberOfLines={1}
                >
                  {formatRelativeTime(s.taken_at)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    // The sheet no longer has a layout-occupying handle (it's an overlay
    // drawn by SpotSheet), so leave room for it above the content here.
    paddingTop: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#141414",
  },
  countText: {
    color: META_COLOR,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
  },
  metaText: {
    flex: 1,
    color: META_COLOR,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#f0ede6",
  },
  chipActive: {
    backgroundColor: "#141414",
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  chipText: {
    color: "#6a6a6a",
    fontSize: 12.5,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  photoWrap: {
    height: 220,
    borderRadius: PHOTO_BORDER_RADIUS,
    marginTop: 14,
  },
  photoWrapMulti: {
    height: 190,
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
    zIndex: 1,
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
  strip: {
    marginTop: 12,
    flexGrow: 0,
  },
  stripContent: {
    gap: 10,
  },
  stripItem: {
    width: 84,
  },
  stripPhoto: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: "#e8e8e8",
  },
  stripPhotoSelected: {
    borderWidth: 2.5,
    borderColor: colors.accent,
  },
  stripLabel: {
    fontSize: 11,
    color: "#b0aca2",
    marginTop: 5,
  },
  stripLabelFresh: {
    color: "#8a8a8a",
  },
});
