import React, { useState, useRef, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAuthentication from "../../hooks/useAuthentication";
import Button from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../styles/theme";

export default function PinSetupScreen({ navigation, route }) {
  const { handleGeneratePin } = useAuthentication();
  const [pin, setPin] = useState(["", "", "", ""]);
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

  const savePin = async () => {
    if (pin.join("").length < 4) {
      Alert.alert("❌ Error", "PIN must be 4 digits");
      return;
    }

    const mobile = await AsyncStorage.getItem("phone");

    try {
      setLoading(true);
      let res = await handleGeneratePin({
        mobile,
        pinNumber: pin.join(""), // Use the joined PIN string
        companyXID: 0,
      });

      if (res?.token) {
        await AsyncStorage.setItem("userPin", pin.join(""));
        await AsyncStorage.setItem("token", res?.token);
        await AsyncStorage.setItem("companyXid", res?.companyXid?.toString());
        await AsyncStorage.setItem("userXid", res?.userXid?.toString());
        await AsyncStorage.setItem("CBXID", res?.branchDtls[0]?.pid?.toString());
        await AsyncStorage.setItem("clientXid", res?.clientXid?.toString());
        await AsyncStorage.setItem("role", res?.roles?.toString());
        await AsyncStorage.setItem("companyName", res?.branchDtls[0]?.companyName?.toString());
        // await AsyncStorage.setItem("branchDtls", res?.branchDtls?.toString());
        navigation.replace("PinLogin");
      } else {
        Alert.alert("❌ Error", "Something went wrong!");
      }
    } catch (error) {
      Alert.alert("⚠️ Error", "Failed to save PIN, please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const updatedPin = [...pin];
    updatedPin[index] = text;
    setPin(updatedPin);

    // Move to the next input field if text is entered
    if (text && index < pin.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleBackspace = (index) => {
    if (!pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
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
              <Ionicons name="lock-closed" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Set Your PIN</Text>
            <Text style={styles.subtitle}>
              Create a 4-digit PIN for secure login
            </Text>
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
                  autoFocus={index === 0}
                  secureTextEntry={true}
                />
              ))}
            </View>

            <Button
              title={loading ? "Setting up..." : "Set PIN"}
              onPress={savePin}
              loading={loading}
              disabled={loading || pin.join("").length < 4}
              variant="primary"
              size="large"
              fullWidth
              style={styles.submitButton}
              icon={!loading && <Ionicons name="checkmark" size={20} color={Colors.white} />}
              iconPosition="right"
            />
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
    marginTop: Spacing.lg,
  },
});
