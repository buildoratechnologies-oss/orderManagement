import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import useAuthentication from "../../hooks/useAuthentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../styles/theme";

export default function PhoneScreen({ navigation }) {
  const { handleVerifyPhoneNumber, handleLoginWithEmailPassword } =
    useAuthentication();
  const [loginMethod, setLoginMethod] = useState("mobile"); // 'mobile' | 'email'

  // Mobile state
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const validatePhone = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      return "Phone number is required";
    }
    if (cleanPhone.length < 10) {
      return "Phone number must be at least 10 digits";
    }
    if (cleanPhone.length > 10) {
      return "Phone number must be exactly 10 digits";
    }
    return "";
  };

  const validateEmail = (value) => {
    if (!value) return "Email is required";
    const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
    if (!re.test(String(value).toLowerCase())) return "Enter a valid email";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handlePhoneChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setPhone(numericText);
    if (phoneError) {
      const error = validatePhone(numericText);
      setPhoneError(error);
    }
  };

  const handleSubmit = async () => {
    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }

    try {
      setLoading(true);
      setPhoneError("");

      const exists = await handleVerifyPhoneNumber({
        mobileNumber: phone,
        companyXID: 0,
      });

      if (exists) {
        await AsyncStorage.setItem("phone", phone);
        navigation.navigate("Otp", { phone });
      } else {
        setPhoneError("Phone number not found in our system");
      }
    } catch (error) {
      console.log(error?.data);
      setPhoneError("Please enter a valid phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    try {
      setLoading(true);
      setEmailError("");
      setPasswordError("");

      const res = await handleLoginWithEmailPassword({
        email,
        password,
        companyXID: 0,
      });
      if (res?.token) {
        await AsyncStorage.setItem("token", res.token);
        if (res?.companyXid)
          await AsyncStorage.setItem("companyXid", String(res.companyXid));
        if (res?.userXid)
          await AsyncStorage.setItem("userXid", String(res.userXid));
        if (res?.branchDtls?.[0]?.pid)
          await AsyncStorage.setItem("CBXID", String(res.branchDtls[0].pid));
        if (res?.clientXid)
          await AsyncStorage.setItem("clientXid", String(res.clientXid));
        if (res?.branchDtls?.[0]?.companyName)
          await AsyncStorage.setItem(
            "companyName",
            String(res.branchDtls[0].companyName)
          );
        await AsyncStorage.setItem("role", res?.roles?.toString());
        await AsyncStorage.setItem(
          "companyName",
          res?.branchDtls[0]?.companyName?.toString()
        );
        if (res?.roles == "Area Sales Manager") {
          navigation.replace("Protected", { screen: "AmsDashboard" });
        } else {
          navigation.replace("Protected", { screen: "Dashboard" });
        }
      } else if (res?.error) {
        setPasswordError(res?.error);
      } else {
        setPasswordError("Invalid email or password");
      }
    } catch (err) {
      setPasswordError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeScreen = async () => {
      await AsyncStorage.clear();

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
    };

    initializeScreen();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              {loginMethod === "mobile" ? (
                <Ionicons
                  name="phone-portrait"
                  size={48}
                  color={Colors.primary}
                />
              ) : (
                <Ionicons name="mail" size={48} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {loginMethod === "mobile"
                ? "Enter your mobile number to continue"
                : "Sign in with your email and password"}
            </Text>
          </View>

          {/* Toggle Login Method */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === "mobile" && styles.toggleButtonActive,
              ]}
              onPress={() => setLoginMethod("mobile")}
            >
              <Text
                style={[
                  styles.toggleText,
                  loginMethod === "mobile" && styles.toggleTextActive,
                ]}
              >
                Mobile OTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                loginMethod === "email" && styles.toggleButtonActive,
              ]}
              onPress={() => setLoginMethod("email")}
            >
              <Text
                style={[
                  styles.toggleText,
                  loginMethod === "email" && styles.toggleTextActive,
                ]}
              >
                Email Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {loginMethod === "mobile" ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      isFocused && styles.inputWrapperFocused,
                      phoneError && styles.inputWrapperError,
                    ]}
                  >
                    <View style={styles.inputIcon}>
                      <Ionicons
                        name="call"
                        size={20}
                        color={isFocused ? Colors.primary : Colors.textTertiary}
                      />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your 10-digit mobile number"
                      placeholderTextColor={Colors.textTertiary}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      keyboardType="phone-pad"
                      maxLength={10}
                      autoFocus={true}
                    />
                  </View>
                  {phoneError ? (
                    <Text style={styles.errorText}>{phoneError}</Text>
                  ) : null}
                </View>

                <Button
                  title={loading ? "Verifying..." : "Continue"}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading || !phone}
                  variant="primary"
                  size="large"
                  fullWidth
                  style={styles.submitButton}
                  icon={
                    !loading && (
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={Colors.white}
                      />
                    )
                  }
                  iconPosition="right"
                />
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      emailError && styles.inputWrapperError,
                    ]}
                  >
                    <View style={styles.inputIcon}>
                      <Ionicons
                        name="mail"
                        size={20}
                        color={Colors.textTertiary}
                      />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="you@example.com"
                      placeholderTextColor={Colors.textTertiary}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (emailError) setEmailError(validateEmail(t));
                      }}
                    />
                  </View>
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      passwordError && styles.inputWrapperError,
                    ]}
                  >
                    <View style={styles.inputIcon}>
                      <Ionicons
                        name="lock-closed"
                        size={20}
                        color={Colors.textTertiary}
                      />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.textTertiary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (passwordError)
                          setPasswordError(validatePassword(t));
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((s) => !s)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={Colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  ) : null}
                </View>

                <Button
                  title={loading ? "Signing in..." : "Sign In"}
                  onPress={handleEmailLogin}
                  loading={loading}
                  disabled={loading || !email || !password}
                  variant="primary"
                  size="large"
                  fullWidth
                  style={styles.submitButton}
                  icon={
                    !loading && (
                      <Ionicons name="log-in" size={20} color={Colors.white} />
                    )
                  }
                  iconPosition="right"
                />
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service
            </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["4xl"],
    paddingBottom: Spacing.lg,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.textStyles.h1,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.bold,
  },
  subtitle: {
    ...Typography.textStyles.body1,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  formSection: {
    width: "100%",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  toggleText: {
    ...Typography.textStyles.body1,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  toggleTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  submitButton: {
    marginTop: Spacing["2xl"],
  },
  whatsappButton: {
    marginTop: Spacing.md,
    backgroundColor: "#25D366",
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.textStyles.caption,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.textStyles.h6,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    minHeight: 60,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textPrimary,
    padding: 0,
  },
  errorText: {
    ...Typography.textStyles.caption,
    color: Colors.danger,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
});
