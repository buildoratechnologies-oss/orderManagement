import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getDateAndTimeInFormate } from "../../../util/data";
import useAttendanceApis from "../../../hooks/useAttendanceApis";
import * as Location from "expo-location";

const menuOptions = [
  {
    icon: "playlist-plus",
    text: "New Order",
    color: "#e67e22",
    path: "CreateOrderScreen",
  },
  {
    icon: "truck-fast-outline",
    text: "Order list",
    color: "#9b59b6",
    path: "OrderList",
  },
  {
    icon: "keyboard-return",
    text: "DOA",
    color: "#e74c3c",
    path: "DOAList",
  },
  { icon: "logout-variant", text: "Check-Out", color: "#34495e", out: true },
];

const MenuScreen = () => {
  const navigation = useNavigation();
  const [selectedShop, setSelectedShop] = useState();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const { handleUserShopVisitCheckOut } = useAttendanceApis();

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to find nearby clients."
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location.coords);
    } catch (e) {
      Alert.alert("Error", "Unable to fetch your location.");
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handleSignOutSubmit = async () => {
    try {
      setLoading(true);

      let attendanceLogPid = await AsyncStorage.getItem("attendanceLogPid");
      let visitCheckIn = await AsyncStorage.getItem("visitCheckIn");
      let parseJson = JSON.parse(visitCheckIn);

      let payload = {
        attendanceXid: attendanceLogPid,
        pid: parseJson?.details,
        checkOutTime: getDateAndTimeInFormate(),
        atClientLogoutLatitude: userLocation?.latitude,
        atClientLogoutLongitude: userLocation?.longitude,
      };

      let response = await handleUserShopVisitCheckOut(payload);
      if (response) {
        await AsyncStorage.removeItem("visitCheckIn");
        await AsyncStorage.removeItem("selectedShop");
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Dashboard" }],
          })
        );
      }
    } catch (error) {
      console.log("Checkout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = async (path, out) => {
    if (path) {
      navigation.navigate(path);
    } else if (out) {
      // Show confirmation popup
      Alert.alert(
        "Confirm Check-Out",
        "Are you sure you want to check out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes, Check-Out", onPress: () => handleSignOutSubmit() },
        ]
      );
    }
  };

  useEffect(() => {
    (async () => {
      let selectedShop = await AsyncStorage.getItem("selectedShop");
      if (selectedShop) {
        setSelectedShop(JSON.parse(selectedShop));
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.clientName}>{selectedShop?.companyName}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10 }}
      >
        <View style={styles.menuContainer}>
          {menuOptions.map((option, index) => {
            const isCheckout = option.out;

            return (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => handleRedirect(option?.path, option?.out)}
                disabled={loading && isCheckout}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: option.color },
                  ]}
                >
                  {loading && isCheckout ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Icon name={option.icon} size={24} color="#fff" />
                  )}
                </View>
                <Text style={styles.optionText}>
                  {loading && isCheckout ? "Checking out..." : option.text}
                </Text>
                {!isCheckout && (
                  <Icon name="chevron-right" size={24} color="#ccc" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    height: 70,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  clientName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  menuContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
});

export default MenuScreen;
