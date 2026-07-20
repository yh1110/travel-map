import { memo } from "react";
import { Marker } from "@maplibre/maplibre-react-native";

import type { Spot } from "../lib/spots";
import { SpotThumbnail } from "./SpotThumbnail";

interface SpotMarkerProps {
  spot: Spot;
  onPress: (spot: Spot) => void;
}

function SpotMarkerComponent({ spot, onPress }: SpotMarkerProps) {
  return (
    <Marker
      id={spot.id}
      lngLat={[spot.lng, spot.lat]}
      anchor="center"
      onPress={() => onPress(spot)}
    >
      <SpotThumbnail photoPath={spot.photo_path} />
    </Marker>
  );
}

export const SpotMarker = memo(SpotMarkerComponent);
