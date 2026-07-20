import { forwardRef, useImperativeHandle, useRef } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import type { Spot } from "../lib/spots";
import { resolvePhotoUrl } from "../lib/supabase";
import { colors } from "../theme";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface AppMapRef {
  animateToLocation: (
    lat: number,
    lng: number,
    zoom: number,
    durationMs: number,
  ) => void;
}

interface AppMapProps {
  initialRegion: MapRegion;
  spots?: Spot[];
  onSpotPress?: (spot: Spot) => void;
  showsUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onRegionChangeComplete?: (region: MapRegion) => void;
  style?: StyleProp<ViewStyle>;
}

const MARKER_SIZE = 68;
const THUMB_SIZE = 42;

export const AppMap = forwardRef<AppMapRef, AppMapProps>(function AppMap(
  {
    initialRegion,
    spots,
    onSpotPress,
    showsUserLocation = false,
    scrollEnabled = true,
    zoomEnabled = true,
    rotateEnabled = false,
    pitchEnabled = false,
    onRegionChangeComplete,
    style,
  },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    animateToLocation(lat, lng, zoom, durationMs) {
      mapRef.current?.animateCamera(
        { center: { latitude: lat, longitude: lng }, zoom },
        { duration: durationMs },
      );
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      rotateEnabled={rotateEnabled}
      pitchEnabled={pitchEnabled}
      onRegionChangeComplete={
        onRegionChangeComplete
          ? (region) => onRegionChangeComplete(region)
          : undefined
      }
    >
      {spots?.map((spot) => (
        <Marker
          key={spot.id}
          coordinate={{ latitude: spot.lat, longitude: spot.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          onPress={() => onSpotPress?.(spot)}
        >
          <View style={markerStyles.box}>
            <View
              style={[
                markerStyles.rotator,
                { transform: [{ rotate: `${spot.bearing}deg` }] },
              ]}
            >
              <View style={markerStyles.wedge} />
            </View>
            <View style={markerStyles.thumbWrap}>
              <Image
                source={{ uri: resolvePhotoUrl(spot.photo_path) }}
                style={markerStyles.thumb}
              />
            </View>
          </View>
        </Marker>
      ))}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

const markerStyles = StyleSheet.create({
  box: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  rotator: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  wedge: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.wedge,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.markerBorder,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
});
