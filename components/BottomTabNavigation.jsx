import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Dashboard from "../screens/protected/pages/asm/Dashboard";
import Users from "../screens/protected/Users";

const Tab = createBottomTabNavigator();

export default function BottomTabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Users") {
            iconName = focused ? "people" : "people-outline";
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
        name="Home" 
        component={Dashboard}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={Users}
        options={{
          tabBarLabel: "Users",
        }}
      />
    </Tab.Navigator>
  );
}