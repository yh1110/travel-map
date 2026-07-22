import type { Spot } from "./spots";

// Photos shot from "the same place" carry GPS jitter of tens of meters, so
// spots within this distance are treated as one location.
const GROUP_RADIUS_METERS = 100;

const EARTH_RADIUS_METERS = 6_371_000;

export interface SpotGroup {
  /** Anchor (newest) spot's id - stable per group as long as it stays newest. */
  id: string;
  lat: number;
  lng: number;
  /** All spots at this location, newest first. */
  spots: Spot[];
}

export type FreshnessPeriod = "today" | "week" | "all";

export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/** Sort key: when it was shot, falling back to when it was posted. */
function freshnessTime(spot: Spot): number {
  const raw = spot.taken_at ?? spot.created_at;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortByFreshness(spots: Spot[]): Spot[] {
  return [...spots].sort((a, b) => freshnessTime(b) - freshnessTime(a));
}

/**
 * Greedily clusters spots by proximity: each spot joins the first existing
 * group whose anchor lies within GROUP_RADIUS_METERS, else starts a new one.
 * Input is sorted newest-first beforehand, so every group's anchor (and
 * marker photo / sheet hero) is its most recent shot.
 */
export function groupSpotsByLocation(spots: Spot[]): SpotGroup[] {
  const groups: SpotGroup[] = [];
  for (const spot of sortByFreshness(spots)) {
    const group = groups.find(
      (g) =>
        distanceMeters(g.lat, g.lng, spot.lat, spot.lng) <=
        GROUP_RADIUS_METERS,
    );
    if (group) {
      group.spots.push(spot);
    } else {
      groups.push({ id: spot.id, lat: spot.lat, lng: spot.lng, spots: [spot] });
    }
  }
  return groups;
}

function startOfToday(now: Date): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isInPeriod(
  spot: Spot,
  period: FreshnessPeriod,
  now: Date = new Date(),
): boolean {
  if (period === "all") return true;
  const time = freshnessTime(spot);
  if (period === "today") return time >= startOfToday(now);
  return time >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
}

export function filterByPeriod(
  spots: Spot[],
  period: FreshnessPeriod,
  now: Date = new Date(),
): Spot[] {
  return spots.filter((s) => isInPeriod(s, period, now));
}
