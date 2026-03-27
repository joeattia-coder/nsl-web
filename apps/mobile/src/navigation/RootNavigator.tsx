import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { MatchScoringScreen } from "../screens/player/MatchScoringScreen";
import { useAppSession } from "../state/app-session";
import type { RootStackParamList } from "../types/app";
import { appTheme } from "../theme";
import { RoleTabs } from "./RoleTabs";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAppSession();

  if (isBootstrapping) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: appTheme.colors.background },
        animation: "slide_from_right",
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Tabs" component={RoleTabs} />
          <Stack.Screen name="MatchScoring" component={MatchScoringScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}