import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Alert,
  Platform,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeScreen from "./pages/HomeScreen";
import OrderList from "./pages/OrderList";
import PaymentScreen from "./pages/PaymentScreen";
import ShopsList from "./pages/ShopsList";
// import AsmOrders from "./asm/performance/AsmOrders";
// import AsmDOA from "./asm/performance/AsmDOA";
// import AsmAttendance from "./asm/performance/AsmAttendance";
// import AsmSellers from "./pages/asm/AsmSellers";
import { isTokenValid } from "../../util/baseData";
import useAuthentication from "../../hooks/useAuthentication";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { handleGeneratePin } = useAuthentication();

  // Enhanced state management
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [tokenValidating, setTokenValidating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isASM, setIsASM] = useState(false);
  const [badges, setBadges] = useState({
    orders: 3,
    notifications: 0,
    payments: 1,
    visits: 5,
  });

  // 🔹 Enhanced location handling with retry mechanism
  const requestLocation = useCallback(
    async (showAlert = true) => {
      try {
        setLocationLoading(true);
        setLocationError(null);

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied");
          if (showAlert) {
            Alert.alert(
              "Location Permission Required",
              "This app needs location access to provide better service.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Retry", onPress: () => requestLocation(false) },
              ]
            );
          }
          return;
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
          maximumAge: 60000,
        });

        setLocation(loc.coords);
        setLocationError(null);
        console.log("📍 Location updated:", loc.coords);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error("Location Error:", error);
        setLocationError(error.message);
      } finally {
        setLocationLoading(false);
      }
    },
    [retryCount]
  );

  // 🔹 Enhanced token validation
  const validateAndRefreshToken = useCallback(async () => {
    try {
      setTokenValidating(true);
      const storedToken = await AsyncStorage.getItem("token");
      const mobile = await AsyncStorage.getItem("phone");
      const pin = await AsyncStorage.getItem("userPin");

      if (!storedToken) {
        throw new Error("No token found");
      }

      let isValid = await isTokenValid(storedToken);
      if (!isValid) {
        let response = await handleGeneratePin({
          mobile,
          pinNumber: pin,
          companyXID: 0,
        });

        if (response?.token) {
          await AsyncStorage.setItem("token", response.token);
        } else {
          throw new Error("Failed to refresh token");
        }
      }
    } catch (error) {
      console.error("Token validation error:", error);
      Alert.alert(
        "Authentication Error",
        "There was a problem with your session."
      );
    } finally {
      setTokenValidating(false);
    }
  }, [handleGeneratePin]);

  // 🔹 Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode(token);
          const roleCandidate =
            decoded?.roleName ||
            decoded?.role ||
            (Array.isArray(decoded?.roles) ? decoded.roles[0] : null);
          const normalized = (roleCandidate || "").toString().toLowerCase();
          setIsASM(
            normalized === "areasellsmanager" ||
              normalized === "areasalesmanager" ||
              normalized === "asm"
          );
        }
      } catch (_) {}

      await Promise.all([requestLocation(), validateAndRefreshToken()]);

      setTimeout(() => {
        setIsInitializing(false);
      }, 800);
    };

    initializeApp();
  }, []);

  // Simplified Custom Tab Bar Component
  const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              if (Platform.OS !== "web") {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (error) {
                  // Haptics not available, continue without it
                }
              }

              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[styles.tabButton, isFocused && styles.tabButtonActive]}
                activeOpacity={0.7}
              >
                <View style={styles.tabIconContainer}>
                  {getTabIcon(route.name, isFocused)}
                  {getBadge(route.name) > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {getBadge(route.name) > 99
                          ? "99+"
                          : getBadge(route.name)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Tab icon helper function
  const getTabIcon = (routeName, focused) => {
    let iconName;
    const size = focused ? 26 : 22;
    const color = focused ? "#667eea" : "#999";

    switch (routeName) {
      case "Home":
        iconName = focused ? "home" : "home-outline";
        break;
      case "Order":
        iconName = focused ? "list" : "list-outline";
        break;
      case "MarketVisit":
        iconName = focused ? "basket" : "basket-outline";
        break;
      case "Payment":
        iconName = focused ? "card" : "card-outline";
        break;
      case "ASMSellers":
        iconName = focused ? "people" : "people-outline";
        break;
      case "ASMOrders":
        iconName = focused ? "bar-chart" : "bar-chart-outline";
        break;
      case "ASMDOA":
        iconName = focused ? "file-tray" : "file-tray-outline";
        break;
      case "ASMAttendance":
        iconName = focused ? "time" : "time-outline";
        break;
      default:
        iconName = "ellipse-outline";
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  // Badge helper function
  const getBadge = (routeName) => {
    if (!badges) return 0;

    switch (routeName) {
      case "Order":
        return badges.orders || 0;
      case "Payment":
        return badges.payments || 0;
      case "MarketVisit":
        return badges.visits || 0;
      default:
        return 0;
    }
  };

  // Loading Screen Component
  const LoadingScreen = () => (
    <SafeAreaView style={styles.loadingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.loadingGradient}
      >
        <View style={styles.loadingContent}>
          <MaterialIcons
            name="dashboard"
            size={80}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.loadingTitle}>Initializing Dashboard</Text>
          <View style={styles.loadingRow}>
            <ActivityIndicator
              size="small"
              color="#fff"
              style={styles.loadingSpinner}
            />
            <Text style={styles.loadingText}>
              {locationLoading && "Getting location..."}
              {tokenValidating && "Validating session..."}
              {!locationLoading && !tokenValidating && "Almost ready..."}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Ionicons
                name={
                  location
                    ? "checkmark-circle"
                    : locationError
                    ? "close-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  location
                    ? "#4CAF50"
                    : locationError
                    ? "#f44336"
                    : "rgba(255,255,255,0.5)"
                }
              />
              <Text style={styles.statusText}>Location</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons
                name={!tokenValidating ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={!tokenValidating ? "#4CAF50" : "rgba(255,255,255,0.5)"}
              />
              <Text style={styles.statusText}>Authentication</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );

  // Show loading screen during initialization
  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <>
          <Tab.Screen name="Home" options={{ tabBarLabel: "Dashboard" }}>
            {() => (
              <HomeScreen
                location={location}
                locationLoading={locationLoading}
                locationError={locationError}
                onRefreshLocation={() => requestLocation()}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Order"
            component={OrderList}
            options={{ tabBarLabel: "Orders" }}
          />

          <Tab.Screen
            name="MarketVisit"
            component={ShopsList}
            options={{ tabBarLabel: "Visits" }}
          />

          <Tab.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ tabBarLabel: "Payments" }}
          />
        </>
      </Tab.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  loadingSpinner: {
    marginRight: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statusText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },

  // Simplified Tab Bar Styles with White Background
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
    backgroundColor: "transparent",
  },
  tabBarContent: {
    flexDirection: "row",
    height: 70,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 8,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: "#f8f9ff",
  },
  tabIconContainer: {
    position: "relative",
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#999",
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#667eea",
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ff4757",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
});
