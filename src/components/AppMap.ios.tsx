import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ElementRef,
} from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import type { SpotGroup } from "../lib/spotGroups";
import { SpotThumbnail } from "./SpotThumbnail";
import { markerLabel } from "./markerLabel";

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

interface IosSpotMarkerProps {
  group: SpotGroup;
  onPress?: (group: SpotGroup) => void;
  selected: boolean;
}

// react-native-maps' `anchor` prop only works with PROVIDER_GOOGLE; Apple
// Maps (PROVIDER_DEFAULT) needs `centerOffset` instead, and that has to be
// computed from the marker's actual rendered height (measured via onLayout)
// since SpotThumbnail grows when selected (adds a label, 50->66px box).
// Otherwise the tappable marker frame drifts away from the visible
// thumbnail once selected, and the second tap that opens the detail screen
// misses it.
//
// `onPress` (backed by react-native-maps' own UITapGestureRecognizer on the
// marker view) never fires in this environment; MapKit's native selection
// callback (`onSelect`) does, so taps are driven from that instead.
function IosSpotMarker({ group, onPress, selected }: IosSpotMarkerProps) {
  const [height, setHeight] = useState(0);
  const markerRef = useRef<ElementRef<typeof Marker>>(null);
  const newest = group.spots[0];

  // `onSelect` only fires on MapKit's deselected -> selected transition, and
  // MapKit keeps the annotation selected after a tap even once the app-level
  // selection is cleared (sheet closed) - so re-tapping the same marker was
  // dead. hideCallout() runs `deselectAnnotation` natively (verified in
  // RNMapsMarkerView.mm), re-arming the next tap; it's a no-op while the
  // annotation isn't selected.
  useEffect(() => {
    if (!selected) markerRef.current?.hideCallout();
  }, [selected]);

  if (!newest) return null;

  return (
    <Marker
      ref={markerRef}
      coordinate={{ latitude: group.lat, longitude: group.lng }}
      centerOffset={{ x: 0, y: -height / 2 }}
      onSelect={() => onPress?.(group)}
    >
      <View onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
        <SpotThumbnail
          photoPath={newest.photo_path}
          selected={selected}
          label={markerLabel(group)}
          count={group.spots.length}
        />
      </View>
    </Marker>
  );
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
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    animateToLocation(lat, lng, zoom, durationMs) {
      // react-native-maps' Camera.zoom is Google Maps only; Apple Maps
      // (PROVIDER_DEFAULT) uses `altitude` (camera height in meters)
      // instead, so a `zoom` value here is silently ignored on iOS. This is
      // an approximate Web Mercator meters-per-pixel conversion (not an
      // Apple-documented formula) to keep the same `zoom` call sites
      // working across platforms - tune the multiplier if the altitude
      // feels off.
      const metersPerPixel =
        (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
      const altitude = metersPerPixel * 600;
      mapRef.current?.animateCamera(
        { center: { latitude: lat, longitude: lng }, altitude },
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
      {groups?.map((group) => (
        <IosSpotMarker
          key={group.id}
          group={group}
          onPress={onGroupPress}
          selected={group.id === selectedGroupId}
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
