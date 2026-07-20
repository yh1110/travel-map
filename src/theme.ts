export const colors = {
  primary: "#1A73E8",
  primaryDark: "#0F5BBF",
  accent: "#FF6D3F",
  background: "#FFFFFF",
  surface: "#F7F8FA",
  textPrimary: "#1B1D1F",
  textSecondary: "#5F6368",
  border: "#E3E5E8",
  danger: "#D93025",
  wedge: "rgba(26, 115, 232, 0.85)",
  markerBorder: "#FFFFFF",
  button: "#15171B",
  buttonIcon: "#FFFFFF",
} as const;

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

/** Roughly centers Japan on first launch. */
export const INITIAL_VIEW = {
  center: [137.5, 37.5] as [number, number],
  zoom: 4.2,
};
