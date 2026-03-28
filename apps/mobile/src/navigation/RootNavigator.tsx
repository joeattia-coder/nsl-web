import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { HomeScreen } from "../screens/player/HomeScreen";
import { MatchScoringScreen } from "../screens/player/MatchScoringScreen";
import { LeagueContentScreen } from "../screens/shared/LeagueContentScreen";
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
        <>
          <Stack.Screen name="PublicHome" component={HomeScreen} />
          <Stack.Screen name="PublicLeagueContent" component={LeagueContentScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}