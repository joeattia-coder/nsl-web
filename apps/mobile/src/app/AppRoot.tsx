import { NavigationContainer } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "../navigation/RootNavigator";
import { SplashScreen } from "../screens/shared/SplashScreen";
import { AppSessionProvider } from "../state/app-session";
import { appTheme } from "../theme";

export function AppRoot() {
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppSessionProvider>
          {hasCompletedIntro ? (
            <NavigationContainer theme={appTheme.navigation}>
              <RootNavigator />
            </NavigationContainer>
          ) : (
            <SplashScreen onComplete={() => setHasCompletedIntro(true)} />
          )}
        </AppSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
});