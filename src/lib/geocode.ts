import { useEffect, useState } from "react";
import * as Location from "expo-location";

// Coordinate-keyed cache so selecting the same spot again - or the collapsed
// and expanded sheets asking in quick succession - only reverse-geocodes once.
// A cached `null` means "resolved, but nothing usable" and is not retried.
const cache = new Map<string, string | null>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function coordLabel(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Reverse-geocodes a coordinate into a rough Japanese place label such as
 * "山口県下関市・角島". Returns null when nothing usable is found or the lookup
 * fails; callers fall back to raw coordinates.
 */
export async function resolveRoughAddress(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let label: string | null = null;
  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (place) {
      // region = 都道府県, city = 市区町村, name/district = さらに細かい地名.
      const area = [place.region, place.city ?? place.subregion]
        .filter((part): part is string => Boolean(part))
        .join("");
      const spot = place.name ?? place.district;
      const parts: string[] = [];
      if (area) parts.push(area);
      // Skip a `name` that is just a street number or duplicates the area.
      if (spot && !/^\d/.test(spot) && spot !== place.city && spot !== place.region) {
        parts.push(spot);
      }
      label = parts.length > 0 ? parts.join("・") : null;
    }
  } catch {
    label = null;
  }

  cache.set(key, label);
  return label;
}

/**
 * Resolves a coordinate to a rough address label, showing the raw coordinates
 * while the async lookup runs and whenever geocoding yields nothing.
 */
export function useRoughAddress(lat: number, lng: number): string {
  const [label, setLabel] = useState(() => coordLabel(lat, lng));

  useEffect(() => {
    let cancelled = false;
    setLabel(coordLabel(lat, lng));
    void resolveRoughAddress(lat, lng).then((result) => {
      if (!cancelled && result) setLabel(result);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return label;
}
