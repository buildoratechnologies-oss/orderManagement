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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import useAuthentication from "../../hooks/useAuthentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../styles/theme";

export default function PhoneScreen({ navigation }) {
  const { handleVerifyPhoneNumber } = useAuthentication();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const validatePhone = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
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

  const handlePhoneChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
            <View style={styles.iconContainer}>
              <Ionicons name="phone-portrait" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number to continue
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused,
                phoneError && styles.inputWrapperError
              ]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call" size={20} color={isFocused ? Colors.primary : Colors.textTertiary} />
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
              icon={!loading && <Ionicons name="arrow-forward" size={20} color={Colors.white} />}
              iconPosition="right"
            />
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
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  submitButton: {
    marginTop: Spacing['2xl'],
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.textStyles.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
