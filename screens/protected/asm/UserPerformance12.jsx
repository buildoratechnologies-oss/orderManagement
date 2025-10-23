import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
// import AsmUserOrders from "../pages/asm/AsmUserOrders";
import AsmUserOrders from "./ASMOrdersScreen";
import AsmUserAttendance from "../pages/asm/AsmUserAttendance";
import AsmUserDOA from "../pages/asm/AsmUserDOA";

const TopTab = createMaterialTopTabNavigator();

export default function UserPerformance({ route }) {
  const { user } = route.params || {};

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>No user data available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Analysis</Text>
        <Text style={styles.subtitle}>
          {user.displayname} (ID: {user.userXid})
        </Text>
      </View>
      
      <TopTab.Navigator
        screenOptions={{
          tabBarIndicatorStyle: { 
            backgroundColor: "#3B82F6",
            height: 3,
          },
          tabBarActiveTintColor: "#3B82F6",
          tabBarInactiveTintColor: "#6B7280",
          tabBarLabelStyle: { 
            fontWeight: "700",
            fontSize: 14,
            textTransform: "none",
          },
          tabBarStyle: {
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          },
        }}
      >
        <TopTab.Screen 
          name="Orders"
          options={{ tabBarLabel: "Orders" }}
        >
          {(props) => (
            <AsmUserOrders 
              {...props} 
              userXid={user.userXid} 
            />
          )}
        </TopTab.Screen>
        
        <TopTab.Screen 
          name="Attendance"
          options={{ tabBarLabel: "Attendance" }}
        >
          {(props) => (
            <AsmUserAttendance 
              {...props} 
              userXid={user.userXid} 
            />
          )}
        </TopTab.Screen>
        
        <TopTab.Screen 
          name="DOA"
          options={{ tabBarLabel: "DOA" }}
        >
          {(props) => (
            <AsmUserDOA 
              {...props} 
              userXid={user.userXid} 
            />
          )}
        </TopTab.Screen>
      </TopTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
});