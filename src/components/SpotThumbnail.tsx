import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { formatTakenAt } from "../lib/format";
import { resolvePhotoUrl } from "../lib/supabase";

interface SpotThumbnailProps {
  photoPath: string;
  selected?: boolean;
  // TODO: replace with title when title column is restored; currently shows taken_at
  takenAt?: string | null;
}

function SpotThumbnailComponent({
  photoPath,
  selected = false,
  takenAt,
}: SpotThumbnailProps) {
  const boxSize = selected ? 66 : 50;
  const boxRadius = selected ? 19 : 15;
  const borderWidth = selected ? 3 : 2.5;
  const diamondSize = selected ? 13 : 11;

  return (
    <View style={styles.container}>
      {selected && (
        <View style={styles.label}>
          <Text style={styles.labelText} numberOfLines={1}>
            {formatTakenAt(takenAt ?? null)}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.box,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: boxRadius,
            borderWidth,
          },
          selected ? styles.boxShadowSelected : styles.boxShadowNormal,
        ]}
      >
        <Image
          source={{ uri: resolvePhotoUrl(photoPath) }}
          style={[styles.image, { borderRadius: boxRadius - borderWidth }]}
        />
      </View>
      <View
        style={[
          styles.diamond,
          {
            width: diamondSize,
            height: diamondSize,
            marginTop: -Math.floor(diamondSize / 2),
          },
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
    backgroundColor: "#141414",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 7,
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
    borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#e8e8e8",
    zIndex: 2,
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
  },
  diamond: {
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
    zIndex: 1,
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
