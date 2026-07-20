import { memo } from "react";
import { Image, StyleSheet, View } from "react-native";

import { resolvePhotoUrl } from "../lib/supabase";
import { colors } from "../theme";

const THUMB_SIZE = 42;

interface SpotThumbnailProps {
  photoPath: string;
}

function SpotThumbnailComponent({ photoPath }: SpotThumbnailProps) {
  return (
    <View style={styles.thumbWrap}>
      <Image
        source={{ uri: resolvePhotoUrl(photoPath) }}
        style={styles.thumb}
      />
    </View>
  );
}

export const SpotThumbnail = memo(SpotThumbnailComponent);

const styles = StyleSheet.create({
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.markerBorder,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
});
