import type { SpotGroup } from "../lib/spotGroups";

/** Marker label while selected: "角島大橋" or "角島大橋・24枚". */
export function markerLabel(group: SpotGroup): string {
  const newest = group.spots[0];
  if (!newest) return "";
  return group.spots.length > 1
    ? `${newest.title}・${group.spots.length}枚`
    : newest.title;
}
