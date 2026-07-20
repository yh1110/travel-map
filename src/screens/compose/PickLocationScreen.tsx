import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppMap, type AppMapRef, type MapRegion } from "../../components/AppMap";
import type { RootStackParamList } from "../../navigation/types";
import { colors, INITIAL_REGION } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PickLocation">;

/**
 * Step 1 of the place-first compose flow: the map center (crosshair) is the
 * point the photo was taken from.
 */
export function PickLocationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<AppMapRef>(null);
  const [locating, setLocating] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<MapRegion>(INITIAL_REGION);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === "granted");
    })();
  }, []);

  const moveToCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      setLocationGranted(true);
      setLocating(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      mapRef.current?.animateToLocation(
        position.coords.latitude,
        position.coords.longitude,
        16,
        600,
      );
    } catch (e) {
      Alert.alert(
        "現在地を取得できませんでした",
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setLocating(false);
    }
  }, []);

  const confirmPoint = useCallback(() => {
    navigation.navigate("SetBearing", {
      lat: currentRegion.latitude,
      lng: currentRegion.longitude,
    });
  }, [navigation, currentRegion]);

  return (
    <View style={styles.container}>
      <AppMap
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationGranted}
        onRegionChangeComplete={setCurrentRegion}
      />

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
    borderRadius: 16,
    backgroundColor: colors.button,
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
    color: colors.buttonIcon,
    transform: [{ rotate: "-45deg" }],
  },
  confirmButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: colors.button,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  confirmText: {
    color: colors.buttonIcon,
    fontSize: 16,
    fontWeight: "700",
  },
});
