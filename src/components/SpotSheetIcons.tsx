import Svg, { Circle, Line, Path } from "react-native-svg";

// Shared between SpotSheetCollapsed (4a) and SpotSheetExpanded (4b), which
// used to each define identical copies of these.

export function PinIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Path
        d="M7.5 1.5c-2.35 0-4.25 1.9-4.25 4.25 0 3.1 4.25 7.5 4.25 7.5s4.25-4.4 4.25-7.5c0-2.35-1.9-4.25-4.25-4.25z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <Circle cx="7.5" cy="5.75" r="1.6" stroke={color} strokeWidth="1.3" />
    </Svg>
  );
}

export function ClockIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Circle cx="7.5" cy="7.5" r="5.75" stroke={color} strokeWidth="1.3" />
      <Line
        x1="7.5"
        y1="4.5"
        x2="7.5"
        y2="7.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <Line
        x1="7.5"
        y1="7.5"
        x2="9.9"
        y2="8.7"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}
