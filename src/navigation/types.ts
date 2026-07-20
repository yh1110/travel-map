export type RootStackParamList = {
  Home: undefined;
  SpotDetail: { spotId: string };
  PickLocation: undefined;
  SetBearing: { lat: number; lng: number };
  SpotForm: { lat: number; lng: number; bearing: number };
};
