import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Camera, Map as MapLibreMap } from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/types";
import { colors, MAP_STYLE_URL } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "SetBearing">;

/**
 * Step 2 of the compose flow: set the shooting direction on a north-up map.
 * The wedge opens toward where the camera was pointed.
 */
export function SetBearingScreen({ navigation, route }: Props) {
  const { lat, lng } = route.params;
  const insets = useSafeAreaInsets();
  const [bearing, setBearing] = useState(0);
  const [capturingHeading, setCapturingHeading] = useState(false);

  const captureDeviceHeading = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    setCapturingHeading(true);
    try {
      const subscription = await Location.watchHeadingAsync((heading) => {
        const value =
          heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
        setBearing(Math.round(((value % 360) + 360) % 360));
        subscription.remove();
        setCapturingHeading(false);
      });
    } catch {
      setCapturingHeading(false);
    }
  }, []);

  const confirm = useCallback(() => {
    navigation.navigate("SpotForm", { lat, lng, bearing });
  }, [navigation, lat, lng, bearing]);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapLibreMap
          style={styles.map}
          mapStyle={MAP_STYLE_URL}
          dragPan={false}
          touchRotate={false}
          touchPitch={false}
          attributionPosition={{ bottom: 8, left: 8 }}
        >
          <Camera initialViewState={{ center: [lng, lat], zoom: 15.5 }} />
        </MapLibreMap>

        {/* Direction preview overlaid on the shooting point (map center) */}
        <View pointerEvents="none" style={styles.overlay}>
          <View
            style={[styles.rotator, { transform: [{ rotate: `${bearing}deg` }] }]}
          >
            <View style={styles.wedge} />
          </View>
          <View style={styles.centerDot} />
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.bearingValue}>
          {bearing}° <Text style={styles.bearingLabel}>{directionLabel(bearing)}</Text>
        </Text>
        <Text style={styles.hint}>カメラを向けていた方向に扇を合わせてください</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={359}
          step={1}
          value={bearing}
          onValueChange={setBearing}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <View style={styles.row}>
          <Pressable
            style={styles.secondaryButton}
            onPress={captureDeviceHeading}
            disabled={capturingHeading}
          >
            <Text style={styles.secondaryText}>
              {capturingHeading ? "取得中…" : "端末の向きを使う"}
            </Text>
          </Pressable>
          <Pressable style={styles.confirmButton} onPress={confirm}>
            <Text style={styles.confirmText}>この方向で撮った</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const DIRECTION_LABELS = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];

function directionLabel(bearing: number): string {
  const index = Math.round(bearing / 45) % 8;
  return DIRECTION_LABELS[index];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  rotator: {
    position: "absolute",
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  // Wide field-of-view cone: apex at the center dot, opening outward.
  wedge: {
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderTopWidth: 110,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(26, 115, 232, 0.35)",
  },
  centerDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  panel: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bearingValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  bearingLabel: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  slider: {
    marginTop: 8,
    width: "100%",
    height: 40,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
