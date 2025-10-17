import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../styles/theme";

export default function OtpScreen({ navigation, route }) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const inputRefs = useRef([]);
  
  const { phone } = route?.params || {};

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const verifyOtp = async () => {
    if (otp.join("").length < 4) {
      Alert.alert("Error", "Please enter the 4-digit OTP");
      return;
    }

    // TODO: Replace with real OTP validation
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp.join("") === "1234") {
        navigation.navigate("PinSetup");
      } else {
        Alert.alert("Error", "Invalid OTP");
      }
    }, 800);
  };

  const resendOtp = () => {
    setIsTimerActive(true);
    setTimer(90); // Reset the timer to 90 seconds
    Alert.alert("OTP Resent", "A new OTP has been sent to your phone.");
  };

  const handleOtpChange = (text, index) => {
    const updatedOtp = [...otp];
    updatedOtp[index] = text;
    setOtp(updatedOtp);

    // Move focus to the next input field if text is entered
    if (text && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleBackspace = (index) => {
    if (!otp[index]) {
      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

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
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>
              Enter the 4-digit code sent to
            </Text>
            <Text style={styles.phoneNumber}>
              {phone ? `+91 ${phone}` : 'your mobile number'}
            </Text>
          </View>

            {/* OTP Form */}
            <View style={styles.formSection}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === "Backspace") {
                        handleBackspace(index);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    returnKeyType={index === 3 ? "done" : "next"}
                    blurOnSubmit={false}
                  />
                ))}
              </View>

              {/* Timer */}
              <View style={styles.timerContainer}>
                <Ionicons name="time" size={16} color={Colors.textSecondary} />
                <Text style={styles.timer}>
                  Resend code in {`${Math.floor(timer / 60)}:${timer % 60 < 10 ? '0' : ''}${timer % 60}`}
                </Text>
              </View>

              {/* Verify Button */}
              <Button
                title={loading ? "Verifying..." : "Verify Code"}
                onPress={verifyOtp}
                loading={loading}
                disabled={loading || otp.join("").length < 4}
                variant="primary"
                size="large"
                fullWidth
                style={styles.verifyButton}
                icon={!loading && <Ionicons name="checkmark" size={20} color={Colors.white} />}
                iconPosition="right"
              />

              {/* Resend Link */}
              <View style={styles.resendContainer}>
                {!isTimerActive ? (
                  <TouchableOpacity onPress={resendOtp} style={styles.resendButton}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resendInactiveText}>
                    Didn't receive the code? Wait {timer}s
                  </Text>
                )}
              </View>
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
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
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
    marginBottom: Spacing.sm,
  },
  phoneNumber: {
    ...Typography.textStyles.h6,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.semiBold,
  },
  formSection: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.md,
  },
  otpInput: {
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
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
  },
  timer: {
    ...Typography.textStyles.body2,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  verifyButton: {
    marginBottom: Spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  resendText: {
    ...Typography.textStyles.body1,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  resendInactiveText: {
    ...Typography.textStyles.body2,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
