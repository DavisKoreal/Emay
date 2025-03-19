import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
            backgroundColor: "transparent", // Ensure transparency on iOS
            bottom: 0, // Position at the bottom
            left: 0,
            right: 0,
          },
          android: {
            position: "absolute", // Position the tab bar absolutely
            backgroundColor: "transparent", // Set background to transparent
            elevation: 0, // Remove shadow on Android
            borderTopWidth: 0, // Remove the top border
            bottom: 0, // Position at the bottom
            left: 0,
            right: 0,
            height: 60, // Set a fixed height for the tab bar on Android
            paddingHorizontal: 16, // Add padding if needed
          },
          // default: {},
        }),
        tabBarItemStyle: {
          justifyContent: "center", // Center content vertically
          alignItems: "center", // Center content horizontally
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="barcode.viewfinder" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
