import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
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

interface IosSpotMarkerProps {
  spot: Spot;
  onPress?: (spot: Spot) => void;
  selected: boolean;
}

// react-native-maps' `anchor` prop only works with PROVIDER_GOOGLE; Apple
// Maps (PROVIDER_DEFAULT) needs `centerOffset` instead, and that has to be
// computed from the marker's actual rendered height (measured via onLayout)
// since SpotThumbnail grows when selected (adds a label, 50->66px box).
// Otherwise the tappable marker frame drifts away from the visible
// thumbnail once selected, and the second tap that opens the detail screen
// misses it.
function IosSpotMarker({ spot, onPress, selected }: IosSpotMarkerProps) {
  const [height, setHeight] = useState(0);

  return (
    <Marker
      coordinate={{ latitude: spot.lat, longitude: spot.lng }}
      centerOffset={{ x: 0, y: -height / 2 }}
      onPress={() => onPress?.(spot)}
    >
      <View onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
        <SpotThumbnail
          photoPath={spot.photo_path}
          selected={selected}
          takenAt={spot.taken_at}
        />
      </View>
    </Marker>
  );
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
        <IosSpotMarker
          key={spot.id}
          spot={spot}
          onPress={onSpotPress}
          selected={spot.id === selectedSpotId}
        />
      ))}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
