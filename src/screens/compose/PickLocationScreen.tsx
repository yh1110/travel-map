import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Camera,
  type CameraRef,
  Map as MapLibreMap,
  type MapRef,
  UserLocation,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/types";
import { colors, INITIAL_VIEW, MAP_STYLE_URL } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PickLocation">;

/**
 * Step 1 of the place-first compose flow: the map center (crosshair) is the
 * point the photo was taken from.
 */
export function PickLocationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [locating, setLocating] = useState(false);

  const moveToCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    setLocating(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      cameraRef.current?.easeTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 16,
        duration: 600,
      });
    } finally {
      setLocating(false);
    }
  }, []);

  const confirmPoint = useCallback(async () => {
    const center = await mapRef.current?.getCenter();
    if (!center) return;
    navigation.navigate("SetBearing", { lat: center[1], lng: center[0] });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <MapLibreMap
        ref={mapRef}
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        touchRotate={false}
        touchPitch={false}
        attributionPosition={{ bottom: 8, left: 8 }}
      >
        <Camera ref={cameraRef} initialViewState={INITIAL_VIEW} />
        <UserLocation />
      </MapLibreMap>

      {/* Fixed crosshair marking the shooting point (always the map center) */}
      <View pointerEvents="none" style={styles.crosshairWrap}>
        <View style={styles.crosshairDot} />
        <View style={styles.crosshairRing} />
      </View>

      <View style={[styles.guide, { top: 12 }]}>
        <Text style={styles.guideText}>
          写真を撮った地点が十字の中心に来るように地図を動かしてください
        </Text>
      </View>

      <Pressable
        style={[styles.locateButton, { bottom: insets.bottom + 96 }]}
        onPress={moveToCurrentLocation}
        disabled={locating}
        accessibilityLabel="現在地にする"
      >
        <Text style={styles.locateIcon}>➤</Text>
      </Pressable>

      <Pressable
        style={[styles.confirmButton, { bottom: insets.bottom + 24 }]}
        onPress={confirmPoint}
      >
        <Text style={styles.confirmText}>ここで撮った</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  crosshairWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  crosshairRing: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  guide: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: "88%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  guideText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  locateButton: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  locateIcon: {
    fontSize: 20,
    color: colors.primary,
    transform: [{ rotate: "-45deg" }],
  },
  confirmButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
