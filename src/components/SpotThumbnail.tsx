import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { formatTakenAt } from "../lib/format";
import { resolvePhotoUrl } from "../lib/supabase";
import { colors } from "../theme";

interface SpotThumbnailProps {
  photoPath: string;
  selected?: boolean;
  // TODO: replace with title when title column is restored; currently shows taken_at
  takenAt?: string | null;
}

const BOX_SIZE = 50;
const BOX_RADIUS = 15;
const BORDER_WIDTH = 2.5;
const DIAMOND_SIZE = 11;

function SpotThumbnailComponent({
  photoPath,
  selected = false,
  takenAt,
}: SpotThumbnailProps) {
  return (
    <View style={styles.container}>
      {selected && (
        // Absolutely positioned so it floats above the thumbnail without
        // changing the container's layout height - the marker's tap target
        // (centerOffset, anchored to this view's measured height) must stay
        // put whether or not the label is showing.
        <View style={styles.label} pointerEvents="none">
          <Text style={styles.labelText} numberOfLines={1}>
            {formatTakenAt(takenAt ?? null)}
          </Text>
        </View>
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
