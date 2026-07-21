import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppMap, type AppMapRef } from "../components/AppMap";
import { SpotSheet } from "../components/SpotSheet";
import { parseExifDate } from "../lib/format";
import { createSpot, fetchSpots, type Spot } from "../lib/spots";
import type { RootStackParamList } from "../navigation/types";
import { colors, INITIAL_REGION } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type Mode = "public" | "private";

function SearchIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx="9.5" cy="9.5" r="6.5" stroke="white" strokeWidth="2" />
      <Line
        x1="14.5"
        y1="14.5"
        x2="20"
        y2="20"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CrosshairIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="11" r="3.5" stroke="#141414" strokeWidth="1.8" />
      <Line
        x1="11"
        y1="1"
        x2="11"
        y2="6.5"
        stroke="#141414"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line
        x1="11"
        y1="15.5"
        x2="11"
        y2="21"
        stroke="#141414"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line
        x1="1"
        y1="11"
        x2="6.5"
        y2="11"
        stroke="#141414"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line
        x1="15.5"
        y1="11"
        x2="21"
        y2="11"
        stroke="#141414"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={26} height={22} viewBox="0 0 26 22" fill="none">
      <Rect x="1" y="6" width="24" height="15" rx="2.5" stroke="white" strokeWidth="1.8" />
      <Path
        d="M9 6L10.5 3H15.5L17 6"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx="13" cy="13.5" r="4" stroke="white" strokeWidth="1.8" />
    </Svg>
  );
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<AppMapRef>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [posting, setPosting] = useState(false);
  // TODO: この切替は現状見た目のみ。公開/非公開のデータモデルが実装され次第、実際のフィルタリングと接続する
  const [mode, setMode] = useState<Mode>("public");
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const handleSpotPress = useCallback((spot: Spot) => {
    // Map markers aren't Pressable but are still a tap-driven control, so we
    // give them the same light feedback as the other buttons. Tapping selects
    // the spot and zooms in; the SpotSheet then rises from the bottom.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSpotId(spot.id);
    mapRef.current?.animateToLocation(spot.lat, spot.lng, 16, 1000);
  }, []);

  const handlePost = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    if (!asset) return;

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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;

  return (
    <View style={styles.container}>
      <AppMap
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        spots={spots}
        onSpotPress={handleSpotPress}
        selectedSpotId={selectedSpotId}
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
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void loadSpots();
          }}
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

      {/* Mode toggle: PUBLIC / PRIVATE */}
      <View
        style={[styles.modeToggleOuter, { top: insets.top + 16 }]}
        pointerEvents="box-none"
      >
        <BlurView intensity={70} tint="light" style={styles.modeBlur}>
          <Pressable
            style={[
              styles.modeSegment,
              mode === "public" && styles.modeSegmentActive,
            ]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode("public");
            }}
          >
            <Text
              style={[
                styles.modeText,
                mode === "public" && styles.modeTextActive,
              ]}
            >
              PUBLIC
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeSegment,
              mode === "private" && styles.modeSegmentActive,
            ]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode("private");
            }}
          >
            <Text
              style={[
                styles.modeText,
                mode === "private" && styles.modeTextActive,
              ]}
            >
              PRIVATE
            </Text>
          </Pressable>
        </BlurView>
      </View>

      {/* Search button (placeholder for future destination search) */}
      <Pressable
        style={[styles.searchButton, { top: insets.top + 16 }]}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        accessibilityLabel="目的地を検索"
      >
        <SearchIcon />
      </Pressable>

      {posting && (
        <View style={styles.postingOverlay}>
          <ActivityIndicator color={colors.buttonIcon} size="large" />
          <Text style={styles.postingText}>投稿中…</Text>
        </View>
      )}

      {/* Current location button with crosshair icon */}
      <View style={[styles.locateButtonOuter, { bottom: insets.bottom + 52 }]}>
        <BlurView intensity={60} tint="light" style={styles.locateBlur}>
          <Pressable
            style={styles.locateInner}
            onPress={goToCurrentLocation}
            accessibilityLabel="現在地へ移動"
          >
            <CrosshairIcon />
          </Pressable>
        </BlurView>
      </View>

      {/* Post button with camera icon only */}
      <Pressable
        style={[
          styles.postButton,
          { bottom: insets.bottom + 44 },
          posting && styles.postButtonDisabled,
        ]}
        onPress={() => {
          void handlePost();
        }}
        disabled={posting}
        accessibilityLabel="景色を投稿"
      >
        <CameraIcon />
      </Pressable>

      <SpotSheet
        spot={selectedSpot}
        onClose={() => setSelectedSpotId(null)}
      />
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
  // Mode toggle
  modeToggleOuter: {
    position: "absolute",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderRadius: 16,
  },
  modeBlur: {
    flexDirection: "row",
    gap: 3,
    padding: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  modeSegment: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  modeSegmentActive: {
    backgroundColor: "#141414",
  },
  modeText: {
    color: "#7a7a7a",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  modeTextActive: {
    color: "#fff",
  },
  // Search button
  searchButton: {
    position: "absolute",
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  postingOverlay: {
    ...StyleSheet.absoluteFill,
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
  // Locate button (crosshair) with blur
  locateButtonOuter: {
    position: "absolute",
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 17,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  locateBlur: {
    flex: 1,
    borderRadius: 17,
    overflow: "hidden",
  },
  locateInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Post button (camera icon)
  postButton: {
    position: "absolute",
    alignSelf: "center",
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
});
