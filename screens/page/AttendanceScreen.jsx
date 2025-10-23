import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RNPickerSelect from "react-native-picker-select";
// import MapView, { Marker, UrlTile } from "react-native-maps"; // Commented out until needed
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import useAttendanceApis from "../../hooks/useAttendanceApis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDateAndTimeInFormate, getDateInFormate } from "../../util/data";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { jwtDecode } from "jwt-decode";

const AttendanceScreen = () => {
  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Global error handler
  useEffect(() => {
    const errorHandler = (error, errorInfo) => {
      console.error('AttendanceScreen Error:', error, errorInfo);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred');
    };

    // Set up error boundary
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0] && args[0].toString().includes('AttendanceScreen')) {
        errorHandler(new Error(args[0]));
      }
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Show error screen if something went wrong
  if (hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrapper}>
          <Text style={{ fontSize: 18, color: 'red', marginBottom: 20 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
            {errorMessage}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#2078a1ff', padding: 15, borderRadius: 8 }}
            onPress={() => {
              setHasError(false);
              setErrorMessage('');
              // Restart component
              setLoading(true);
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const [status, setStatus] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);

  const navigation = useNavigation();
  
  // Initialize hooks with error handling
  let attendanceApis;
  try {
    attendanceApis = useAttendanceApis();
  } catch (error) {
    console.error('Error initializing attendance APIs:', error);
    attendanceApis = { handleAttendanceLogIn: null };
  }
  
  const { handleAttendanceLogIn } = attendanceApis;

  // Profile image picker with better error handling
  const handleProfileImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "Access to media library is required."
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
      });
      
      if (!result?.canceled && result?.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (imageError) {
      console.error('Error picking image:', imageError);
      Alert.alert(
        "Image Error",
        "Failed to select image. Please try again."
      );
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission not granted");
        Alert.alert(
          "Location Permission",
          "Location access was denied. You can still mark attendance, but location data won't be recorded."
        );
        setLocationLoading(false);
        return;
      }

      // Fetch location with timeout fallback
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      if (loc?.coords?.latitude && loc?.coords?.longitude) {
        setLocation(loc.coords);
      } else {
        Alert.alert(
          "Location Error",
          "Unable to fetch your location. Try again."
        );
      }
    } catch (err) {
      console.error("Error fetching location:", err);
      console.log("Location services may be disabled or unavailable");
      // Don't show an alert here, just log the error
      // The UI will show "Location unavailable" message
    } finally {
      setLocationLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Fetch user details from AsyncStorage token with error handling
        try {
          const storedToken = await AsyncStorage.getItem("token");
          if (storedToken) {
            const decoded = jwtDecode(storedToken);
            setUserDetails(decoded);
          }
        } catch (tokenError) {
          console.error('Error decoding token:', tokenError);
          // Continue without user details - don't crash the app
          setUserDetails({ displayname: "User" });
        }

        // Fetch attendance status (replace with API call if needed)
        const resStatus = [
          { pid: 1, nameEng: "Present", isActive: true },
          { pid: 2, nameEng: "Absent", isActive: true },
          { pid: 3, nameEng: "Leave", isActive: true },
          { pid: 4, nameEng: "1st Half - Present", isActive: true },
          { pid: 5, nameEng: "2nd Half - Present", isActive: true },
          { pid: 6, nameEng: "Present At Office", isActive: true },
        ];
        const activeStatus = resStatus.filter((s) => s.isActive);
        setStatusOptions(
          activeStatus.map((s) => ({ label: s.nameEng, value: String(s.pid) }))
        );

        // Request location with error handling
        try {
          await getCurrentLocation();
        } catch (locationError) {
          console.error('Error getting location during init:', locationError);
          // Don't crash the app, just continue without location
          setLocationLoading(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!status)
      return Alert.alert("Error", "Please select attendance status.");
    
    // Check if location is available, but don't block submission
    if (!location?.latitude || !location?.longitude) {
      Alert.alert(
        "Location Unavailable",
        "Your location could not be determined. Attendance will be marked without location data. Do you want to continue?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {}
          },
          {
            text: "Continue",
            style: "default",
            onPress: () => proceedWithSubmission()
          }
        ]
      );
      return;
    }
    
    if (!profileImage)
      return Alert.alert("Error", "Please select a profile image.");

    // If location is available, proceed normally
    await proceedWithSubmission();
  };

  const proceedWithSubmission = async () => {
    if (!profileImage) {
      Alert.alert("Error", "Please select a profile image.");
      return;
    }

    if (!handleAttendanceLogIn) {
      Alert.alert("Error", "Attendance service is not available. Please restart the app.");
      return;
    }

    try {
      setLoading(true);
      
      // Find the selected status with proper validation
      const selectedStatus = statusOptions.find((item) => item.value === status);
      
      if (!selectedStatus) {
        Alert.alert("Error", "Invalid attendance status selected. Please try again.");
        return;
      }
      
      // Use location if available, otherwise use default/fallback values
      const payload = {
        nameEng: selectedStatus.label,
        attendanceDate: getDateAndTimeInFormate(),
        checkInTime: getDateAndTimeInFormate(),
        checkOutTime: "",
        attStatusXid: Number(status),
        loginLatitude: location?.latitude || 0, // Default to 0 if location unavailable
        loginLongitude: location?.longitude || 0, // Default to 0 if location unavailable
      };

      const response = await handleAttendanceLogIn(payload);
      
      if (response) {
        try {
          const date = getDateInFormate();
          await AsyncStorage.setItem("attendanceLog", date);
          await AsyncStorage.setItem("attendanceLogName", selectedStatus.label);
          await AsyncStorage.setItem(
            "attendanceLogPid",
            response?.details?.toString() || "0"
          );
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Don't fail the whole process for storage errors
        }
        
        // Use setTimeout to avoid navigation race conditions
        setTimeout(() => {
          navigation.replace("Protected", { screen: "Dashboard" });
        }, 100);
      } else {
        Alert.alert("Error", "Failed to submit attendance. Please try again.");
      }
    } catch (err) {
      console.error('Submission error:', err);
      Alert.alert("Error", "Failed to submit attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive loading and error checks
  if (loading || !statusOptions || statusOptions.length === 0) {
    return (
      <View style={styles.loaderWrapper}>
        <ActivityIndicator size="large" color="#2078a1ff" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Safety check for navigation
  if (!navigation) {
    return (
      <View style={styles.loaderWrapper}>
        <Text style={{ fontSize: 16, color: 'red' }}>Navigation error. Please restart the app.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#2078a1ff", "#2078a1ff"]} style={styles.header}>
        <Text style={styles.headerText}>Attendance Marking</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Map */}
        {/* <View style={styles.mapCard}>
          {locationLoading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" color="#2078a1ff" />
              <Text style={{ marginTop: 8, textAlign: "center", color: "#666" }}>Fetching location...</Text>
              <Text style={{ marginTop: 4, textAlign: "center", color: "#888", fontSize: 12 }}>
                If location fails, you can still mark attendance
              </Text>
            </View>
          ) : location ? (
            <MapView
              style={styles.map}
              region={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
            >
              <UrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
              />
              <Marker coordinate={location} title="Your Location" />
            </MapView>
          ) : (
            <View style={styles.mapLoading}>
              <Text style={{ marginBottom: 10, textAlign: "center", color: "#666" }}>
                📍 Location unavailable
              </Text>
              <Text style={{ marginBottom: 15, textAlign: "center", color: "#888", fontSize: 12 }}>
                You can still mark attendance without location
              </Text>
              <TouchableOpacity
                onPress={getCurrentLocation}
                style={styles.retryButton}
              >
                <Text style={{ color: "#fff" }}>Try Get Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View> */}

        {/* Profile */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleProfileImagePick}>
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : { uri: 'https://via.placeholder.com/110x110/cccccc/666666?text=User' }
              }
              style={styles.profileImage}
              onError={(error) => {
                console.error('Image load error:', error);
                // Fallback to placeholder if image fails to load
              }}
            />
          </TouchableOpacity>
          <Text style={styles.name}>{userDetails?.displayname || "User"}</Text>
        </View>

        {/* Status Picker */}
        <View style={styles.dropdownCard}>
          <Text style={styles.label}>Attendance Status</Text>
          <RNPickerSelect
            onValueChange={(value) => setStatus(value)}
            items={statusOptions}
            placeholder={{ label: "Select Status...", value: null }}
            style={pickerSelectStyles}
          />
        </View>

        {/* Location Status Info */}
        {(!location?.latitude || !location?.longitude) && (
          <View style={styles.locationWarning}>
            <Text style={styles.locationWarningText}>
              ⚠️ Location unavailable - Attendance will be marked without location data
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={["#2078a1ff", "#2078a1ff"]}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {loading ? "Submitting..." : "Submit"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => {
              try {
                navigation.replace("Protected", { screen: "Dashboard" });
              } catch (navError) {
                console.error('Navigation error:', navError);
                // Fallback navigation
                navigation.goBack();
              }
            }}
            disabled={loading}
          >
            <LinearGradient
              colors={["#6c757d", "#5a6268"]}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>Later</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: { height: 60, justifyContent: "center", alignItems: "center", elevation: 4 },
  headerText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  scroll: { padding: 20 },
  loaderWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapCard: { borderRadius: 15, overflow: "hidden", elevation: 4, marginBottom: 20, backgroundColor: "#fff" },
  map: { height: 200, width: "100%" },
  mapLoading: { height: 200, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f1f1", borderRadius: 12 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#2078a1ff", borderRadius: 8 },
  profileCard: { backgroundColor: "#fff", alignItems: "center", padding: 20, borderRadius: 15, elevation: 3, marginBottom: 20 },
  profileImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: "#4facfe" },
  name: { fontSize: 18, marginTop: 12, fontWeight: "600", color: "#333" },
  dropdownCard: { backgroundColor: "#fff", padding: 15, borderRadius: 12, elevation: 2, marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8, color: "#555", fontWeight: "500" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, alignSelf: "center", width: "80%" },
  buttonWrapper: { flex: 1, marginHorizontal: 8, borderRadius: 50, overflow: "hidden" },
  submitGradient: { paddingVertical: 14, alignItems: "center", borderRadius: 50 },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  locationWarning: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  locationWarningText: {
    color: "#856404",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, color: "#333", backgroundColor: "#fdfdfd" },
  inputAndroid: { fontSize: 16, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, color: "#333", backgroundColor: "#fdfdfd" },
});

export default AttendanceScreen;
