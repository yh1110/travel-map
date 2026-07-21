import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetView,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";

import type { Spot } from "../lib/spots";
import { SpotSheetCollapsed } from "./SpotSheetCollapsed";
import { SpotSheetExpanded } from "./SpotSheetExpanded";

interface SpotSheetProps {
  spot: Spot | null;
  onClose: () => void;
}

// 4a (collapsed) peeks from the bottom; dragging up to 4b (expanded) fills
// the screen. enableDynamicSizing is off so only these points are used.
const SNAP_POINTS = ["58%", "100%"];

export function SpotSheet({ spot, onClose }: SpotSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => SNAP_POINTS, []);
  const [index, setIndex] = useState(-1);
  // Keep the last non-null spot rendered so content doesn't blank out during
  // the close animation when `spot` flips to null.
  const [renderedSpot, setRenderedSpot] = useState<Spot | null>(spot);

  // React to the selected spot *identity*, not object reference: a background
  // refetch hands back new Spot objects, and depending on those would yank an
  // expanded sheet back to collapsed. A spot's data is immutable per id.
  useEffect(() => {
    if (spot) {
      setRenderedSpot(spot);
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [spot?.id]);

  const handleChange = useCallback(
    (i: number) => {
      setIndex(i);
      if (i === -1) onClose();
    },
    [onClose],
  );

  const collapse = useCallback(() => {
    sheetRef.current?.snapToIndex(0);
  }, []);

  const expanded = index >= 1;

  const renderBackground = useCallback(
    (props: BottomSheetBackgroundProps) => (
      <View
        pointerEvents={props.pointerEvents}
        style={[
          props.style,
          expanded ? styles.backgroundExpanded : styles.backgroundCollapsed,
        ]}
      />
    ),
    [expanded],
  );

  const renderHandle = useCallback(
    () =>
      expanded ? null : (
        <View style={styles.handleContainer}>
          <View style={styles.handleIndicator} />
        </View>
      ),
    [expanded],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      onChange={handleChange}
      backgroundComponent={renderBackground}
      handleComponent={renderHandle}
    >
      <BottomSheetView style={styles.content}>
        {renderedSpot != null &&
          (expanded ? (
            <SpotSheetExpanded spot={renderedSpot} onCollapse={collapse} />
          ) : (
            <SpotSheetCollapsed spot={renderedSpot} />
          ))}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  backgroundCollapsed: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  backgroundExpanded: {
    backgroundColor: "#141210",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleIndicator: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d8d5cd",
  },
});
