import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
} from "react-native";
import { IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Shadows } from "../styles/theme";

// 👇 Title mapping for Stack + Tab screens
const TITLE_MAP = {
  Dashboard: "Dashboard",
  Profile: "My Profile",
  OrderDetails: "Order Details",
  CreateOrderScreen: "Create Order",
  AttendanceList: "Attendance",
  OrderList: "Orders",
  MenuPage: "Menu",
  ClientList: "Clients",
  DOAList: "DOA List",
  Home: "Home",
  Order: "Orders",
  MarketVisit: "Market Visit",
  Payment: "Payments",
};

export default function Navbar({ title = "CALIBRECUE", toggleSidebar }) {
  const navigation = useNavigation();

  const [isCheckIn, setIsCheckIn] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [titleAnimation] = useState(new Animated.Value(1));
  const [menuAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    const updateRouteName = () => {
      const state = navigation.getState();
      let names = [];
      let node = state;

      // Walk through nested navigators to get full path
      while (node && node.routes && node.index != null) {
        const route = node.routes[node.index];
        names.push(route.name);
        node = route.state;
      }

      // Pick last route in path (deepest screen)
      const activeRoute = names[names.length - 1];
      const newTitle = TITLE_MAP[activeRoute] || activeRoute || title;

      // Animate title change
      if (newTitle !== currentTitle) {
        Animated.sequence([
          Animated.timing(titleAnimation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(titleAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        setCurrentTitle(newTitle);
      }
    };

    // Run on mount
    updateRouteName();

    const unsubscribe = navigation.addListener("state", async () => {
      let visitCheckIn = await AsyncStorage.getItem("visitCheckIn");
      setIsCheckIn(!visitCheckIn);

      updateRouteName();
    });

    return unsubscribe;
  }, [navigation]);

  const handleMenuPress = () => {
    // Animate menu button
    Animated.sequence([
      Animated.timing(menuAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    toggleSidebar();
  };

  const goToProfile = () => {
    const state = navigation.getState();
    const currentRoute = state.routes[state.index].name;

    if (currentRoute === "Profile") {
      navigation.goBack();
    } else {
      navigation.navigate("Protected", { screen: "Profile" });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        {/* Hamburger Menu Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: menuAnimation }] },
          ]}
        >
          <TouchableOpacity
            onPress={handleMenuPress}
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <Ionicons name="menu" size={24} color={"#667eea"} />
          </TouchableOpacity>
        </Animated.View>

        {/* Title (based on route) */}
        <Animated.View
          style={[styles.titleContainer, { opacity: titleAnimation }]}
        >
          <Text style={styles.title}>
            {currentTitle === "Protected" ? "" : currentTitle}
          </Text>
        </Animated.View>

        {/* Profile Icon */}
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={goToProfile}
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle" size={26} color={"#667eea"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    zIndex: 1000,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40, // For status bar
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
    minHeight: 76,
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.base,
  },
  title: {
    ...Typography.textStyles.h5,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
  },
});
