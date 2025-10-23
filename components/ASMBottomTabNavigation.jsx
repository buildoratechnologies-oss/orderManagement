import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import the ASM screens that will have bottom navigation
import ASMAttendanceScreen from "../screens/protected/asm/ASMAttendanceScreen";
import ASMOrdersScreen from "../screens/protected/asm/ASMOrdersScreen";
import ASMDOAScreen from "../screens/protected/asm/ASMDOAScreen";
import ASMLiveScreen from "../screens/protected/asm/ASMLiveScreen";

const Tab = createBottomTabNavigator();

export default function ASMBottomTabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Attendance") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Orders") {
            iconName = focused ? "bag" : "bag-outline";
          } else if (route.name === "DOA") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Live") {
            iconName = focused ? "radio" : "radio-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Attendance" 
        component={ASMAttendanceScreen}
        options={{
          tabBarLabel: "Attendance",
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={ASMOrdersScreen}
        options={{
          tabBarLabel: "Orders",
        }}
      />
      <Tab.Screen 
        name="DOA" 
        component={ASMDOAScreen}
        options={{
          tabBarLabel: "DOA",
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={ASMLiveScreen}
        options={{
          tabBarLabel: "Live",
        }}
      />
    </Tab.Navigator>
  );
}