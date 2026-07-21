import { memo } from "react";
import { Marker } from "@maplibre/maplibre-react-native";

import type { Spot } from "../lib/spots";
import { SpotThumbnail } from "./SpotThumbnail";

interface SpotMarkerProps {
  spot: Spot;
  onPress: (spot: Spot) => void;
  selected?: boolean;
}

function SpotMarkerComponent({ spot, onPress, selected = false }: SpotMarkerProps) {
  return (
    <Marker
      id={spot.id}
      lngLat={[spot.lng, spot.lat]}
      anchor="center"
      onPress={() => onPress(spot)}
    >
      <SpotThumbnail
        photoPath={spot.photo_path}
        selected={selected}
        takenAt={spot.taken_at}
      />
    </Marker>
  );
}

export const SpotMarker = memo(SpotMarkerComponent);
