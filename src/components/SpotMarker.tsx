import { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import type { Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";
import { colors } from "../theme";

const MARKER_SIZE = 68;
const THUMB_SIZE = 42;

interface SpotMarkerProps {
  spot: Spot;
  onPress: (spot: Spot) => void;
}

/**
 * A photo pin with a wedge showing the shooting direction.
 * The wedge sits at the top of the marker box (= north) and the whole box is
 * rotated by the spot's bearing, so it only reads correctly on a north-up map
 * (map rotation is disabled on screens using this marker).
 */
function SpotMarkerComponent({ spot, onPress }: SpotMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: spot.lat, longitude: spot.lng }}
      onPress={() => onPress(spot)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.box}>
        <View
          style={[styles.rotator, { transform: [{ rotate: `${spot.bearing}deg` }] }]}
        >
          <View style={styles.wedge} />
        </View>
        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: resolvePhotoUrl(spot.photo_path) }}
            style={styles.thumb}
          />
        </View>
      </View>
    </Marker>
  );
}

export const SpotMarker = memo(SpotMarkerComponent);

const styles = StyleSheet.create({
  box: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  rotator: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  // Field-of-view cone: apex sits toward the thumbnail (camera position),
  // opening outward in the shooting direction.
  wedge: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.wedge,
  },
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
