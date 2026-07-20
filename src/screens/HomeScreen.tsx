import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppMap, type AppMapRef } from "../components/AppMap";
import { parseExifDate } from "../lib/format";
import { createSpot, fetchSpots, type Spot } from "../lib/spots";
import type { RootStackParamList } from "../navigation/types";
import { colors, INITIAL_REGION } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<AppMapRef>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [posting, setPosting] = useState(false);

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
      mapRef.current?.animateToLocation(
        position.coords.latitude,
        position.coords.longitude,
        13,
        800,
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

  const handlePost = useCallback(async () => {
    const { status: camStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];

    const { status: locStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (locStatus !== "granted") return;

    let position: Location.LocationObject;
    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (e) {
      Alert.alert(
        "現在地を取得できませんでした",
        e instanceof Error ? e.message : String(e),
      );
      return;
    }

    setPosting(true);
    try {
      await createSpot({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        takenAt: parseExifDate(asset.exif) ?? new Date(),
        photo: { uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" },
      });
      Alert.alert("投稿しました！", "地図にあなたの景色が追加されました。");
      void loadSpots();
    } catch (e) {
      Alert.alert(
        "投稿に失敗しました",
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      setPosting(false);
    }
  }, [loadSpots]);

  return (
    <View style={styles.container}>
      <AppMap
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        spots={spots}
        onSpotPress={openSpot}
        showsUserLocation={locationGranted}
      />

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

      {posting && (
        <View style={styles.postingOverlay}>
          <ActivityIndicator color={colors.buttonIcon} size="large" />
          <Text style={styles.postingText}>投稿中…</Text>
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
        style={[
          styles.postButton,
          { bottom: insets.bottom + 24 },
          posting && styles.postButtonDisabled,
        ]}
        onPress={() => {
          void handlePost();
        }}
        disabled={posting}
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
  postingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  postingText: {
    color: colors.buttonIcon,
    fontSize: 16,
    fontWeight: "600",
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
  postButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: colors.button,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: colors.buttonIcon,
    fontSize: 16,
    fontWeight: "700",
  },
});
