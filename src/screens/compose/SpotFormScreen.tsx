import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatDateTime, parseExifDate } from "../../lib/format";
import { createSpot } from "../../lib/spots";
import type { RootStackParamList } from "../../navigation/types";
import { colors } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "SpotForm">;

interface PickedPhoto {
  uri: string;
  mimeType: string;
  /** From EXIF when available; null means the user picked a photo without one. */
  takenAt: Date | null;
}

/**
 * Step 3 of the compose flow: attach the photo taken at the chosen point and
 * direction, then submit.
 */
export function SpotFormScreen({ navigation, route }: Props) {
  const { lat, lng, bearing } = route.params;
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAsset = useCallback((asset: ImagePicker.ImagePickerAsset) => {
    setPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      takenAt: parseExifDate(asset.exif),
    });
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: true,
    });
    if (!result.canceled && result.assets[0]) handleAsset(result.assets[0]);
  }, [handleAsset]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: true,
    });
    if (!result.canceled && result.assets[0]) handleAsset(result.assets[0]);
  }, [handleAsset]);

  const submit = useCallback(async () => {
    if (!photo) {
      Alert.alert("写真を選択してください");
      return;
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      Alert.alert("タイトルを入力してください");
      return;
    }
    setSubmitting(true);
    try {
      await createSpot({
        title: trimmedTitle,
        lat,
        lng,
        bearing,
        takenAt: photo.takenAt,
        photo: { uri: photo.uri, mimeType: photo.mimeType },
      });
      Alert.alert("投稿しました", "地図にあなたの景色が追加されました。", [
        { text: "OK", onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      Alert.alert("投稿に失敗しました", e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }, [photo, title, lat, lng, bearing, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>写真</Text>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.preview} />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.placeholderText}>ここで撮った景色を追加</Text>
          </View>
        )}
        <View style={styles.row}>
          <Pressable style={styles.secondaryButton} onPress={pickFromLibrary}>
            <Text style={styles.secondaryText}>ライブラリから選ぶ</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={takePhoto}>
            <Text style={styles.secondaryText}>いま撮影する</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>タイトル</Text>
        <TextInput
          style={styles.input}
          placeholder="例: 河口湖の湖畔から望む富士山"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.sectionLabel}>撮影情報</Text>
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>
            地点: {lat.toFixed(5)}, {lng.toFixed(5)}
          </Text>
          <Text style={styles.metaText}>方向: {bearing}°</Text>
          <Text style={styles.metaText}>
            撮影日時:{" "}
            {photo?.takenAt
              ? formatDateTime(photo.takenAt)
              : "不明（写真から取得できませんでした）"}
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>この場所に投稿する</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  previewPlaceholder: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  metaBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  submitButton: {
    marginTop: 28,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
