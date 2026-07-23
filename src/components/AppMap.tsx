import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import {
  Camera,
  type CameraRef,
  Map as MapLibreMap,
  UserLocation,
} from "@maplibre/maplibre-react-native";

import { SpotMarker } from "./SpotMarker";
import type { SpotGroup } from "../lib/spotGroups";
import { MAP_STYLE_URL } from "../theme";

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
  animateToRegion: (region: MapRegion, durationMs: number) => void;
}

interface AppMapProps {
  initialRegion: MapRegion;
  groups?: SpotGroup[];
  onGroupPress?: (group: SpotGroup) => void;
  selectedGroupId?: string | null;
  showsUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onRegionChangeComplete?: (region: MapRegion) => void;
  style?: StyleProp<ViewStyle>;
}

function longitudeDeltaToZoom(longitudeDelta: number): number {
  return Math.log2(360 / longitudeDelta);
}

export const AppMap = forwardRef<AppMapRef, AppMapProps>(function AppMap(
  {
    initialRegion,
    groups,
    onGroupPress,
    selectedGroupId,
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
  const cameraRef = useRef<CameraRef>(null);

  useImperativeHandle(ref, () => ({
    animateToLocation(lat, lng, zoom, durationMs) {
      cameraRef.current?.easeTo({
        center: [lng, lat],
        zoom,
        duration: durationMs,
      });
    },
    animateToRegion(region, durationMs) {
      cameraRef.current?.easeTo({
        center: [region.longitude, region.latitude],
        zoom: longitudeDeltaToZoom(region.longitudeDelta),
        duration: durationMs,
      });
    },
  }));

  return (
    <MapLibreMap
      style={[styles.map, style]}
      mapStyle={MAP_STYLE_URL}
      dragPan={scrollEnabled}
      touchZoom={zoomEnabled}
      doubleTapZoom={zoomEnabled}
      touchRotate={rotateEnabled}
      touchPitch={pitchEnabled}
      attributionPosition={{ bottom: 8, left: 8 }}
      onRegionDidChange={
        onRegionChangeComplete
          ? (event) => {
              const [lng, lat] = event.nativeEvent.center;
              onRegionChangeComplete({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0,
                longitudeDelta: 0,
              });
            }
          : undefined
      }
    >
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: [initialRegion.longitude, initialRegion.latitude],
          zoom: longitudeDeltaToZoom(initialRegion.longitudeDelta),
        }}
      />
      {showsUserLocation && <UserLocation />}
      {groups?.map((group) => (
        <SpotMarker
          key={group.id}
          group={group}
          onPress={onGroupPress ?? (() => {})}
          selected={group.id === selectedGroupId}
        />
      ))}
    </MapLibreMap>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
