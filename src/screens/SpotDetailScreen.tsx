import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SpotMarker } from "../components/SpotMarker";
import { directionLabel, formatTakenAt } from "../lib/format";
import { fetchSpot, type Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "SpotDetail">;

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
        <Text style={styles.meta}>撮影日時: {formatTakenAt(spot.taken_at)}</Text>
        <Text style={styles.meta}>
          地点: {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
        </Text>

        <Text style={styles.sectionLabel}>ここに立つと、この向きに見えます</Text>
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: spot.lat,
              longitude: spot.lng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <SpotMarker spot={spot} onPress={() => {}} />
          </MapView>
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
