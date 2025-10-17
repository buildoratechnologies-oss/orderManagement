import React, { useEffect, useState } from "react";
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const CenterMenu = ({ isOpen, closeSidebar }) => {
  const navigation = useNavigation();

  const goToHomeAndResetHistory = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "PinLogin" }],
      })
    );
  };

  // Simplified without animations for now

  const handleNavigation = (screen) => {
    navigation.navigate("Protected", { screen: screen });
    closeSidebar();
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            console.log("User Logged Out");
            closeSidebar();
            navigation.reset({
              index: 0,
              routes: [{ name: "PinLogin" }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleExit = () => {
    Alert.alert(
      "Exit App",
      "Are you sure you want to exit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            goToHomeAndResetHistory();
            BackHandler.exitApp();
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdropTouch}
        activeOpacity={1}
        onPress={closeSidebar}
      />

      <View style={styles.menuBox}>
        <View style={styles.menuContent}>
          {/* Header */}
          <View style={styles.menuHeader}>
            <View style={styles.brandContainer}>
              <View style={styles.brandIcon}>
                <Ionicons name="business" size={24} color="#007AFF" />
              </View>
              <Text style={styles.brandText}>Order Manager</Text>
            </View>
            
            <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar}>
              <Ionicons name="close" size={24} color="#5F6368" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Menu Items */}
            <View style={styles.menuItems}>
              {[
                { icon: "home", text: "Home", screen: "Dashboard" },
                { icon: "people", text: "Attendance", screen: "AttendanceList" },
                { icon: "receipt", text: "Orders", screen: "OrderList" },
                { icon: "business", text: "Clients", screen: "ClientList" },
                { icon: "archive", text: "DOA List", screen: "DOAList" },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleNavigation(item.screen)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon} size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.menuText}>{item.text}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.exitMenuItem} onPress={handleExit}>
                <View style={styles.exitIcon}>
                  <Ionicons name="exit" size={20} color="#E74C3C" />
                </View>
                <Text style={styles.exitText}>Exit App</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height,
    width,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  backdropTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuBox: {
    width: "85%",
    maxWidth: 340,
    minHeight: 400,
    maxHeight: height * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5AC8FA20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandText: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F3F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5AC8FA20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '500',
    flex: 1,
  },
  bottomActions: {
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 16,
  },
  exitMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1948A10',
  },
  exitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1948A20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exitText: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
  },
});

export default CenterMenu;
