// app/_layout.tsx
import React from "react";
import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, AuthContext } from "../context/AuthContext"; // Adjust path
import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent splash screen from hiding too soon
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Wait for fonts to load
  if (!loaded) {
    return null;
  }

  // Wrap everything in AuthProvider
  return (
    <AuthProvider>
        <RootLayoutContent />
    </AuthProvider>
  );
}

// Separate component to use AuthContext
function RootLayoutContent() {
  const { isInitialized, storeData } = React.useContext(AuthContext);

  React.useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {storeData ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}