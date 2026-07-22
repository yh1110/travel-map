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

export function CloseIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Line
        x1="3"
        y1="3"
        x2="13"
        y2="13"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line
        x1="13"
        y1="3"
        x2="3"
        y2="13"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShareIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Line x1="11" y1="2" x2="11" y2="14" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path
        d="M6.5 6.5L11 2l4.5 4.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 10v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BookmarkIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M5 3.5h12v16l-6-4.2-6 4.2v-16z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PersonIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Circle cx="7.5" cy="5.2" r="2.6" stroke={color} strokeWidth="1.3" />
      <Path
        d="M2.5 13c0-2.9 2.2-4.5 5-4.5s5 1.6 5 4.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}
