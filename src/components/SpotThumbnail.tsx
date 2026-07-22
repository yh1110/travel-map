import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { resolvePhotoUrl } from "../lib/supabase";
import { colors } from "../theme";

interface SpotThumbnailProps {
  photoPath: string;
  selected?: boolean;
  /** Text shown above the thumbnail while selected (spot title etc.). */
  label?: string;
  /** Number of photos at this location; > 1 renders the stacked-cards look. */
  count?: number;
}

const BOX_SIZE = 50;
const BOX_RADIUS = 15;
const BORDER_WIDTH = 2.5;
const DIAMOND_SIZE = 11;

function SpotThumbnailComponent({
  photoPath,
  selected = false,
  label,
  count = 1,
}: SpotThumbnailProps) {
  const stacked = count > 1;

  return (
    <View style={styles.container}>
      {selected && label != null && (
        // Absolutely positioned so it floats above the thumbnail without
        // changing the container's layout height - the marker's tap target
        // (centerOffset, anchored to this view's measured height) must stay
        // put whether or not the label is showing.
        <View style={styles.label} pointerEvents="none">
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
      <View style={styles.boxArea}>
        {stacked && (
          // Fanned-out card backs behind the photo, hinting at the pile.
          // Absolute so they don't change the measured marker height.
          <>
            <View style={[styles.stackCard, styles.stackCardLeft]} />
            <View style={[styles.stackCard, styles.stackCardRight]} />
          </>
        )}
        <View
          style={[
            styles.box,
            selected && styles.boxSelected,
            selected ? styles.boxShadowSelected : styles.boxShadowNormal,
          ]}
        >
          <Image
            source={{ uri: resolvePhotoUrl(photoPath) }}
            style={styles.image}
          />
        </View>
        {stacked && (
          <View style={styles.countBadge} pointerEvents="none">
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      <View
        style={[
          styles.diamond,
          selected && styles.diamondSelected,
          selected ? styles.diamondShadowSelected : styles.diamondShadowNormal,
        ]}
      />
    </View>
  );
}

export const SpotThumbnail = memo(SpotThumbnailComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  label: {
    position: "absolute",
    top: -35,
    alignSelf: "center",
    backgroundColor: "#141414",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  labelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  boxArea: {
    width: BOX_SIZE,
    height: BOX_SIZE,
  },
  stackCard: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: BOX_RADIUS,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#cfcabd",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  stackCardLeft: {
    transform: [{ rotate: "-11deg" }],
  },
  stackCardRight: {
    backgroundColor: "#c2cbb4",
    transform: [{ rotate: "9deg" }],
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: BOX_RADIUS,
    borderWidth: BORDER_WIDTH,
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#e8e8e8",
    zIndex: 2,
  },
  boxSelected: {
    borderColor: colors.accent,
  },
  boxShadowNormal: {
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  boxShadowSelected: {
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: BOX_RADIUS - BORDER_WIDTH,
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  diamond: {
    width: DIAMOND_SIZE,
    height: DIAMOND_SIZE,
    marginTop: -Math.floor(DIAMOND_SIZE / 2),
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
    zIndex: 1,
  },
  diamondSelected: {
    backgroundColor: colors.accent,
  },
  diamondShadowNormal: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  diamondShadowSelected: {
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
