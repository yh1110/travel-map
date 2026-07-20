import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import type { Spot } from "../lib/spots";
import { SpotThumbnail } from "./SpotThumbnail";

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
      mapType="mutedStandard"
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
          <SpotThumbnail photoPath={spot.photo_path} />
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
