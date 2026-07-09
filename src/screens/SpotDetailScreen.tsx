import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, Map as MapLibreMap } from "@maplibre/maplibre-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SpotMarker } from "../components/SpotMarker";
import { fetchSpot, type Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";
import type { RootStackParamList } from "../navigation/types";
import { colors, MAP_STYLE_URL } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "SpotDetail">;

function formatDateTime(iso: string | null): string {
  if (!iso) return "不明";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "不明";
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

const DIRECTION_LABELS = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];

function directionLabel(bearing: number): string {
  return DIRECTION_LABELS[Math.round(bearing / 45) % 8];
}

/** "Stand here, look this way, and this is what you see." */
export function SpotDetailScreen({ route }: Props) {
  const { spotId } = route.params;
  const [spot, setSpot] = useState<Spot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await fetchSpot(spotId);
        if (!cancelled) setSpot(loaded);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  if (error != null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={{ uri: resolvePhotoUrl(spot.photo_path) }}
        style={styles.photo}
      />
      <View style={styles.body}>
        <Text style={styles.title}>{spot.title}</Text>
        <Text style={styles.meta}>
          撮影方向: {Math.round(spot.bearing)}°（{directionLabel(spot.bearing)}向き）
        </Text>
        <Text style={styles.meta}>撮影日時: {formatDateTime(spot.taken_at)}</Text>
        <Text style={styles.meta}>
          地点: {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
        </Text>

        <Text style={styles.sectionLabel}>ここに立つと、この向きに見えます</Text>
        <View style={styles.mapWrap}>
          <MapLibreMap
            style={styles.map}
            mapStyle={MAP_STYLE_URL}
            dragPan={false}
            touchZoom={false}
            doubleTapZoom={false}
            touchRotate={false}
            touchPitch={false}
            attributionPosition={{ bottom: 4, left: 4 }}
          >
            <Camera initialViewState={{ center: [spot.lng, spot.lat], zoom: 14.5 }} />
            <SpotMarker spot={spot} onPress={() => {}} />
          </MapLibreMap>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface,
  },
  body: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 20,
    marginBottom: 8,
  },
  mapWrap: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});
