import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Navbar from "./components/NavBar";
import OtpScreen from "./screens/authentication/OtpScreen";
import PhoneScreen from "./screens/authentication/PhoneScreen";
import PinLoginScreen from "./screens/authentication/PinLoginScreen";
import PinSetupScreen from "./screens/authentication/PinSetupScreen";
import OldDashboard from "./screens/protected/index";
import ProfileScreen from "./screens/protected/pages/Profile";
import OrderDetails from "./screens/protected/pages/SingleOrder";
import CreateOrderScreen from "./screens/protected/pages/CreateOrder";
import Sidebar from "./components/SideBar"; // Sidebar component for custom sidebar
import AttendanceScreen from "./screens/page/AttendanceScreen";
import AttendanceList from "./screens/page/AttendanceList";
import MenuPage from "./screens/page/checkIn/MenuPage";
import OrderListScreen from "./screens/protected/pages/OrderList";
import ClientList from "./screens/protected/pages/ClientsList";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import DOAList from "./screens/page/checkIn/DOAList";
import DaySummary from "./screens/protected/pages/DaySummary";
// import BottomTabNavigation from "./components/BottomTabNavigation";
import ASMDashboard from "./screens/protected/asm/ASMDashboard";
import MyTeam from "./screens/protected/asm/MyTeam";
// import ASMBottomTabNavigation from "./components/ASMBottomTabNavigation";
import ASMTargetsScreen from "./screens/protected/asm/ASMTargetsScreen";
import UserProfileDetails from "./screens/protected/asm/UserProfileDetails";
import UserPerformance from "./screens/protected/asm/performance/UserPerformance";
import ASMLiveScreen from "./screens/protected/asm/ASMLiveScreen";
import ASMOrdersScreen from "./screens/protected/asm/ASMOrdersScreen";
import ASMAttendanceScreen from "./screens/protected/asm/ASMAttendanceScreen";
import ASMDOAScreen from "./screens/protected/asm/ASMDOAScreen";
import AddShop from "./screens/protected/pages/AddShop";

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage the sidebar visibility
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const checkPin = async () => {
      const storedPin = await AsyncStorage.getItem("userPin");
      setHasPin(!!storedPin);
      setLoading(false);
    };
    checkPin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const toggleSidebar = () => setIsSidebarOpen((prevState) => !prevState); // Toggle Sidebar

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hasPin ? "PinLogin" : "Phone"}
          screenOptions={{ headerShown: false }}
        >
          {/* 🔹 Auth Screens (No Navbar) */}
          <Stack.Screen name="Phone" component={PhoneScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="PinSetup" component={PinSetupScreen} />
          <Stack.Screen name="PinLogin" component={PinLoginScreen} />
          <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />

          {/* 🔹 Protected Screens (With Navbar and Sidebar) */}
          <Stack.Screen name="Protected">
            {(props) => (
              <>
                <Navbar toggleSidebar={toggleSidebar} />
                <Sidebar
                  isOpen={isSidebarOpen}
                  closeSidebar={() => setIsSidebarOpen(false)}
                />
                <ProtectedStack
                  {...props}
                  location={location}
                  setLocation={setLocation}
                />
              </>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

/**
 * ✅ A separate stack for all protected screens with Navbar and Sidebar
 */
function ProtectedStack({ location, setLocation }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="AsmDashboard" component={BottomTabNavigation} /> */}
      <Stack.Screen name="AsmDashboard" component={ASMDashboard} />
      <Stack.Screen name="Dashboard">
        {(props) => (
          <OldDashboard
            {...props}
            setLocation={setLocation}
            location={location}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} location={location} />}
      </Stack.Screen>
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
      <Stack.Screen name="CreateOrderScreen" component={CreateOrderScreen} />
      <Stack.Screen name="AttendanceList" component={AttendanceList} />
      <Stack.Screen name="OrderList" component={OrderListScreen} />
      <Stack.Screen name="MenuPage" component={MenuPage} />
      <Stack.Screen name="ClientList" component={ClientList} />
      <Stack.Screen name="DOAList" component={DOAList} />
      <Stack.Screen name="DaySummary" component={DaySummary} />
      <Stack.Screen name="ASMDashboard" component={ASMDashboard} />
      <Stack.Screen name="MyTeam" component={MyTeam} />
      <Stack.Screen name="ASMAttendance" component={ASMAttendanceScreen} />
      <Stack.Screen name="ASMOrders" component={ASMOrdersScreen} />
      <Stack.Screen name="ASMDOA" component={ASMDOAScreen} />
      <Stack.Screen name="ASMLive" component={ASMLiveScreen} />
      <Stack.Screen name="ASMTargets" component={ASMTargetsScreen} />
      <Stack.Screen name="UserProfileDetails" component={UserProfileDetails} />
      <Stack.Screen name="UserPerformance" component={UserPerformance} />
      <Stack.Screen name="AddShop" component={AddShop} />
    </Stack.Navigator>
  );
}
