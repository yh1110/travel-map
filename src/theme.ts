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
} as const;

/** Roughly centers Japan on first launch. (latitudeDelta ≈ zoom 4.2) */
export const INITIAL_REGION = {
  latitude: 37.5,
  longitude: 137.5,
  latitudeDelta: 20,
  longitudeDelta: 20,
};
