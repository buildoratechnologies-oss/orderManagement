import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAttendanceApis from "../../hooks/useAttendanceApis";
import { compareDates, getDateInFormate } from "../../util/data";
import { isTokenValid } from "../../util/baseData";
import useAuthentication from "../../hooks/useAuthentication";
import Button from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../styles/theme";

// Replace with your actual logo
import logo from "../../assets/icon.png"
export default function PinLoginScreen({ navigation }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const inputRefs = useRef([]);
  const { handleGeneratePin } = useAuthentication();

  const login = async () => {
    if (pin.join("").length < 4) {
      Alert.alert("⚠️ Error", "Please enter a 4-digit PIN");
      return;
    }

    try {
      setLoading(true);
      const storedPin = await AsyncStorage.getItem("userPin");
      const attendance = await AsyncStorage.getItem("attendanceLog");

      if (pin.join("") === storedPin) {
        let date = getDateInFormate();
        let visitCheckIn = await AsyncStorage.getItem("visitCheckIn");
        if (JSON.parse(visitCheckIn)?.details) {
          navigation.replace("Protected", { screen: "MenuPage" });
        } else if (compareDates(date, attendance)) {
          navigation.replace("Protected", { screen: "Dashboard" });
        } else {
          let listAttendance = [];
          let redirect = () => navigation.navigate("AttendanceScreen");
          if (listAttendance?.length >= 1) {
            let present = listAttendance?.filter(
              (attend) =>
                compareDates(date, attend?.checkInTime) &&
                attend?.checkOutTime == null
            );
            if (present.length > 0) {
              navigation.replace("Protected", { screen: "Dashboard" });
            } else {
              redirect();
            }
          } else {
            redirect();
          }
        }
      } else {
        Alert.alert("❌ Error", "Incorrect PIN");
        setPin(["", "", "", ""]);
      }
    } catch (err) {
      Alert.alert("❌ Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetPin = async () => {
    await AsyncStorage.removeItem("userPin");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("phone");
    navigation.navigate("Phone");
  };

  const handlePinChange = (text, index) => {
    const updatedPin = [...pin];
    updatedPin[index] = text;
    setPin(updatedPin);

    if (text && index < pin.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleBackspace = (index) => {
    if (!pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  useEffect(() => {
    const initializeScreen = async () => {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      const storedToken = await AsyncStorage.getItem("token");
      const mobile = await AsyncStorage.getItem("phone");
      const pinStored = await AsyncStorage.getItem("userPin");
      const cName = await AsyncStorage.getItem("companyName");
      setCompanyName(cName ?? "")
      if (storedToken) {
        let res = await isTokenValid(storedToken);
        if (!res) {
          let response = await handleGeneratePin({
            mobile,
            pinNumber: pinStored,
            companyXID: 0,
          });
          if (response?.token) {
            await AsyncStorage.setItem("token", response?.token);
          } else {
            Alert.alert("❌ Error", "Something went wrong!");
          }
        }
      }
    };

    initializeScreen();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Signing you in...</Text>
          </View>
        )}

        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} />
            </View>
            <Text style={styles.companyName}>{companyName || "Order Manager"}</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your 4-digit security PIN</Text>
          </View>

          {/* PIN Form */}
          <View style={styles.formSection}>
            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.pinInput,
                    digit && styles.pinInputFilled
                  ]}
                  value={digit}
                  onChangeText={(text) => handlePinChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace") handleBackspace(index);
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  returnKeyType={index === 3 ? "done" : "next"}
                  blurOnSubmit={false}
                  autoFocus={index === 0}
                  secureTextEntry={true}
                />
              ))}
            </View>

            <Button
              title="Sign In"
              onPress={login}
              loading={loading}
              disabled={loading || pin.join("").length < 4}
              variant="primary"
              size="large"
              fullWidth
              style={styles.submitButton}
              icon={!loading && <Ionicons name="log-in" size={20} color={Colors.white} />}
              iconPosition="right"
            />

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetPin}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>Forgot PIN? Reset</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlayLight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    ...Typography.textStyles.body1,
    color: Colors.primary,
    marginTop: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  companyName: {
    ...Typography.textStyles.h6,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: Typography.fontWeight.semiBold,
  },
  title: {
    ...Typography.textStyles.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.bold,
  },
  subtitle: {
    ...Typography.textStyles.body1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    width: '100%',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing['4xl'],
    paddingHorizontal: Spacing.md,
  },
  pinInput: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    textAlign: 'center',
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
  },
  pinInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  submitButton: {
    marginBottom: Spacing.lg,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  resetButtonText: {
    ...Typography.textStyles.body1,
    color: Colors.textTertiary,
    fontWeight: Typography.fontWeight.medium,
  },
});
