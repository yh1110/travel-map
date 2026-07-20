import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { RootStackParamList } from "./src/navigation/types";
import { HomeScreen } from "./src/screens/HomeScreen";
import { PickLocationScreen } from "./src/screens/compose/PickLocationScreen";
import { SetBearingScreen } from "./src/screens/compose/SetBearingScreen";
import { SpotFormScreen } from "./src/screens/compose/SpotFormScreen";
import { SpotDetailScreen } from "./src/screens/SpotDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SpotDetail"
            component={SpotDetailScreen}
            options={{ title: "スポット" }}
          />
          <Stack.Screen
            name="PickLocation"
            component={PickLocationScreen}
            options={{ title: "撮った場所を指定（1/3）" }}
          />
          <Stack.Screen
            name="SetBearing"
            component={SetBearingScreen}
            options={{ title: "撮影方向を指定（2/3）" }}
          />
          <Stack.Screen
            name="SpotForm"
            component={SpotFormScreen}
            options={{ title: "写真と情報（3/3）" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
