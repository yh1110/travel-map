import type { ExpoConfig } from "expo/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const config: ExpoConfig = {
  name: "travel-map",
  slug: "travel-map",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.travelmap.app",
  },
  android: {
    package: "com.travelmap.app",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "react-native-maps",
      {
        iosGoogleMapsApiKey: googleMapsApiKey,
        androidGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "撮影地点の指定と現在地表示のために位置情報を使用します。",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "投稿する景色の写真を選択するためにフォトライブラリへアクセスします。",
        cameraPermission:
          "その場の景色を撮影して投稿するためにカメラを使用します。",
      },
    ],
  ],
};

export default config;
