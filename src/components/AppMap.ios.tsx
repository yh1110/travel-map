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
  selectedSpotId?: string | null;
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
    selectedSpotId,
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
          // Anchor at the bottom (diamond tip), not center: selecting a spot
          // adds a label above the thumbnail and grows its height, which
          // would otherwise shift the thumbnail's on-screen position and
          // break the second tap needed to open the detail screen.
          anchor={{ x: 0.5, y: 1 }}
          onPress={() => onSpotPress?.(spot)}
        >
          <SpotThumbnail
            photoPath={spot.photo_path}
            selected={spot.id === selectedSpotId}
            takenAt={spot.taken_at}
          />
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
