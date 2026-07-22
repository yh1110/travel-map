import { memo } from "react";
import { Marker } from "@maplibre/maplibre-react-native";

import type { SpotGroup } from "../lib/spotGroups";
import { SpotThumbnail } from "./SpotThumbnail";
import { markerLabel } from "./markerLabel";

interface SpotMarkerProps {
  group: SpotGroup;
  onPress: (group: SpotGroup) => void;
  selected?: boolean;
}

function SpotMarkerComponent({
  group,
  onPress,
  selected = false,
}: SpotMarkerProps) {
  const newest = group.spots[0];
  if (!newest) return null;

  return (
    <Marker
      id={group.id}
      lngLat={[group.lng, group.lat]}
      // Anchor at the bottom (diamond tip), not center: selecting a spot
      // adds a label above the thumbnail and grows its height, which
      // would otherwise shift the thumbnail's on-screen position and
      // break the second tap needed to open the detail screen.
      anchor="bottom"
      onPress={() => onPress(group)}
    >
      <SpotThumbnail
        photoPath={newest.photo_path}
        selected={selected}
        label={markerLabel(group)}
        count={group.spots.length}
      />
    </Marker>
  );
}

export const SpotMarker = memo(SpotMarkerComponent);
