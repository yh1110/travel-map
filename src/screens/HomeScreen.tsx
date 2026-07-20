import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SpotMarker } from "../components/SpotMarker";
import { fetchSpots, type Spot } from "../lib/spots";
import type { RootStackParamList } from "../navigation/types";
import { colors, INITIAL_REGION } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  const loadSpots = useCallback(async () => {
    try {
      setError(null);
      setSpots(await fetchSpots());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever the screen regains focus (e.g. after posting a spot).
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      void loadSpots();
    });
    return unsubscribe;
  }, [navigation, loadSpots]);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === "granted");
    })();
  }, []);

  const goToCurrentLocation = useCallback(async () => {
    try {
      if (!locationGranted) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        setLocationGranted(true);
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          zoom: 13,
        },
        { duration: 800 },
      );
    } catch (e) {
      Alert.alert(
        "現在地を取得できませんでした",
        e instanceof Error ? e.message : String(e),
      );
    }
  }, [locationGranted]);

  const openSpot = useCallback(
    (spot: Spot) => {
      navigation.navigate("SpotDetail", { spotId: spot.id });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationGranted}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {spots.map((spot) => (
          <SpotMarker key={spot.id} spot={spot} onPress={openSpot} />
        ))}
      </MapView>

      {loading && (
        <View style={[styles.banner, { top: insets.top + 12 }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.bannerText}>読み込み中…</Text>
        </View>
      )}
      {error != null && !loading && (
        <Pressable
          style={[styles.banner, styles.errorBanner, { top: insets.top + 12 }]}
          onPress={loadSpots}
        >
          <Text style={styles.errorText}>{error}（タップで再試行）</Text>
        </Pressable>
      )}
      {!loading && error == null && spots.length === 0 && (
        <View style={[styles.banner, { top: insets.top + 12 }]}>
          <Text style={styles.bannerText}>
            まだ投稿がありません。最初の景色を投稿してみましょう
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.locateButton, { bottom: insets.bottom + 96 }]}
        onPress={goToCurrentLocation}
        accessibilityLabel="現在地へ移動"
      >
        <Text style={styles.locateIcon}>➤</Text>
      </Pressable>

      <Pressable
        style={[styles.postButton, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate("PickLocation")}
        accessibilityLabel="景色を投稿"
      >
        <Text style={styles.postButtonText}>＋ この景色を投稿</Text>
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
  banner: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    maxWidth: "88%",
  },
  bannerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: "#FDECEA",
  },
  errorText: {
    color: colors.danger,
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
  postButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
