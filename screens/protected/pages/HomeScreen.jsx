import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import herPic from "../../../assets/herosec.jpg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import useAttendanceApis from "../../../hooks/useAttendanceApis";
import {
  compareDates,
  getDateAndTimeInFormate,
  getDateInFormate,
} from "../../../util/data";

export default function Dashboard({ location, isLocationLoading }) {
  const navigation = useNavigation();
  const [useDetails, setUserDetails] = useState();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [loading, setLoading] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isDeviationModalVisible, setIsDeviationModalVisible] = useState(false);
  const [shopName, setShopName] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmittingDeviation, setIsSubmittingDeviation] = useState(false);
  const [shopNameError, setShopNameError] = useState(null);
  const [reasonError, setReasonError] = useState(null);
  const [touched, setTouched] = useState({ shopName: false, reason: false });

  const actions = [
    {
      id: 1,
      title: "Market Visit",
      icon: "https://img.icons8.com/ios-filled/100/visit.png",
      screen: "MarketVisit",
      color: "#3498db",
    },
    {
      id: 2,
      title: "Outlets",
      icon: "https://img.icons8.com/ios-filled/100/shop.png",
      screen: "ClientList",
      color: "#9b59b6",
    },
    {
      id: 4,
      title: "Reports",
      icon: "https://img.icons8.com/ios-filled/100/shopping-cart.png",
      screen: null,
      color: "#e67e22",
    },
    {
      id: 5,
      title: "Day’s Summary",
      icon: "https://img.icons8.com/ios-filled/100/task.png",
      screen: "DaySummary",
      color: "#27ae60",
    },
  ];

  const { handleAttendanceCheckOut } = useAttendanceApis();

  // 🟢 Load User + Attendance Data
  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        const decoded = jwtDecode(storedToken);
        setUserDetails(decoded);
      }

      const date = getDateInFormate();
      const attendance = await AsyncStorage.getItem("attendanceLog");
      const attendanceName = await AsyncStorage.getItem("attendanceLogName");

      if (attendanceName) setAttendanceStatus(attendanceName);

      if (attendanceName === "Present" && compareDates(date, attendance)) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(attendance));
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
      }
    })();
  }, []);

  // 🔵 Handle Check-Out
const handleSubmit = async () => {
  if (!location?.latitude || !location?.longitude) {
    Alert.alert(
      "Location Required",
      "Unable to get your location. Please enable location services and try again."
    );
    return;
  }

  setLoading(true);
  try {
    const payload = {
      pid: await AsyncStorage.getItem("attendanceLogPid"),
      checkOutTime: getDateAndTimeInFormate(),
      logoutLatitude: location.latitude,
      logoutLongitude: location.longitude,
    };
    console.log(payload.checkOutTime);
    console.log(payload.logoutLatitude);
    console.log(payload.logoutLongitude);

    const response = await handleAttendanceCheckOut(payload);
    if (response) {
      await AsyncStorage.removeItem("attendanceLog");
      await AsyncStorage.removeItem("attendanceLogPid");
      await AsyncStorage.removeItem("attendanceLogName");
      setIsCheckedIn(false);
      setCheckInTime(null);
      setAttendanceStatus(null);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  // 🟠 Handle Check-In/Out Button Action
const handleCheckInToggle = async () => {
  if (!location?.latitude || !location?.longitude) {
    Alert.alert(
      "Location Required",
      "Unable to get your location. Please enable location services and try again."
    );
    return;
  }

  setLoading(true);

  const attendanceName = await AsyncStorage.getItem("attendanceLogName");

  // If not Present — redirect to attendance screen always
  if (attendanceName && attendanceName !== "Present") {
    navigation.navigate("AttendanceScreen");
    setLoading(false);
    return;
  }

  if (isCheckedIn) {
    Alert.alert(
      "Confirm Check Out",
      "Are you sure you want to check out for the day?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Check Out",
          onPress: async () => {
            await handleSubmit();
          },
        },
      ]
    );
  } else {
    navigation.navigate("AttendanceScreen");
  }

  setLoading(false);
};
  // 🟣 Decide color based on attendanceStatus
  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "#2ecc71"; // Green
      case "Absent":
        return "#e74c3c"; // Red
      case "Leave":
        return "#f39c12"; // Orange
      case "1st Half - Present":
      case "2nd Half - Present":
      case "Present At Office":
        return "#3498db"; // Blue
      default:
        return "#7f8c8d"; // Gray
    }
  };

  const validateShopName = (value) => {
    const v = value.trim();
    if (!v) return "Shop name is required.";
    if (v.length < 2) return "Shop name must be at least 2 characters.";
    if (!/^[a-zA-Z0-9 .,&'()\-]+$/.test(v))
      return "Only letters, numbers and . , & ' ( ) - allowed.";
    return null;
  };

  const validateReason = (value) => {
    const v = value.trim();
    if (!v) return "Reason is required.";
    if (v.length < 5) return "Reason must be at least 5 characters.";
    return null;
  };

  const handleDeviationSubmit = async () => {
    const sErr = validateShopName(shopName);
    const rErr = validateReason(reason);
    setShopNameError(sErr);
    setReasonError(rErr);
    setTouched({ shopName: true, reason: true });
    if (sErr || rErr) return;

    try {
      setIsSubmittingDeviation(true);
      console.log("Deviation request:", { shopName, reason });
      Alert.alert("Submitted", "Your deviation request has been submitted.");
      setShopName("");
      setReason("");
      setTouched({ shopName: false, reason: false });
      setIsDeviationModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit. Please try again.");
    } finally {
      setIsSubmittingDeviation(false);
    }
  };

  const submitDisabled =
    isSubmittingDeviation || !!validateShopName(shopName) || !!validateReason(reason);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>👋 Welcome, {useDetails?.displayname}</Text>

        {/* Banner */}
        <View style={styles.banner}>
          <Image source={herPic} style={styles.bannerImage} />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerText}>Your Sales Dashboard</Text>
          </View>
        </View>

        {/* Check-In/Out or Status */}
        <TouchableOpacity
          style={[
            styles.statusCard,
            { backgroundColor: getStatusColor(attendanceStatus) },
          ]}
          onPress={handleCheckInToggle}
        >
          {loading || isLocationLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Image
                source={{
                  uri:
                    attendanceStatus === "Present"
                      ? "https://img.icons8.com/ios-glyphs/90/ffffff/logout-rounded-left.png"
                      : "https://img.icons8.com/ios-glyphs/90/ffffff/info.png",
                }}
                style={styles.statusIcon}
              />
              <View>
                <Text style={styles.statusText}>
                  {attendanceStatus === "Present"
                    ? isCheckedIn
                      ? "Tap to Check Out"
                      : "Tap to Check In"
                    : attendanceStatus
                    ? `Status: ${attendanceStatus}`
                    : "Tap to Check In"}
                </Text>
                {attendanceStatus === "Present" && isCheckedIn && checkInTime && (
                  <Text style={styles.timeText}>
                    Checked In at{" "}
                    {checkInTime?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                )}
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* Deviation Request Button */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#1abc9c" }]}
          onPress={() => setIsDeviationModalVisible(true)}
        >
          <Image
            source={{ uri: "https://img.icons8.com/ios-filled/100/document.png" }}
            style={styles.actionIcon}
          />
          <Text style={styles.actionText}>Deviation Request</Text>
        </TouchableOpacity>

        {/* Action List */}
        <View style={styles.actionList}>
          {actions.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionCard, { backgroundColor: item.color }]}
              onPress={() =>
                item.title === "Reports"
                  ? setIsReportModalVisible(true)
                  : navigation.navigate(item.screen)
              }
            >
              <Image source={{ uri: item.icon }} style={styles.actionIcon} />
              <Text style={styles.actionText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Reports Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReportModalVisible}
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reports</Text>
              <Pressable onPress={() => setIsReportModalVisible(false)}>
                <Image
                  source={{
                    uri: "https://img.icons8.com/ios-glyphs/90/000000/multiply.png",
                  }}
                  style={styles.closeIcon}
                />
              </Pressable>
            </View>

            {/* Report Options */}
            <View style={styles.reportList}>
              {[
                {
                  title: "Attendance",
                  screen: "AttendanceList",
                  icon: "https://img.icons8.com/ios-filled/100/user.png",
                  color: "#3498db",
                },
                {
                  title: "Orders",
                  screen: "OrderList",
                  icon: "https://img.icons8.com/ios-filled/100/shopping-cart.png",
                  color: "#9b59b6",
                },
                {
                  title: "DOA",
                  screen: "DOAList",
                  icon: "https://img.icons8.com/ios-filled/100/return.png",
                  color: "#e67e22",
                },
              ].map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.reportCard, { backgroundColor: btn.color }]}
                  onPress={() => {
                    setIsReportModalVisible(false);
                    navigation.navigate(btn.screen);
                  }}
                >
                  <Image source={{ uri: btn.icon }} style={styles.reportIcon} />
                  <Text style={styles.reportText}>{btn.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Deviation Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDeviationModalVisible}
        onRequestClose={() => setIsDeviationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deviation Request</Text>
              <Pressable onPress={() => setIsDeviationModalVisible(false)}>
                <Image
                  source={{
                    uri: "https://img.icons8.com/ios-glyphs/90/000000/multiply.png",
                  }}
                  style={styles.closeIcon}
                />
              </Pressable>
            </View>

            <View>
              <Text style={styles.formLabel}>Shop Name</Text>
              <TextInput
                style={[styles.input, touched.shopName && shopNameError ? styles.inputError : null]}
                placeholder="Enter shop name"
                value={shopName}
                onChangeText={(text) => {
                  setShopName(text);
                  if (touched.shopName) setShopNameError(validateShopName(text));
                }}
                onBlur={() => {
                  setTouched((t) => ({ ...t, shopName: true }));
                  setShopNameError(validateShopName(shopName));
                }}
                maxLength={80}
                returnKeyType="next"
              />
              {touched.shopName && shopNameError ? (
                <Text style={styles.errorText}>{shopNameError}</Text>
              ) : null}

              <Text style={[styles.formLabel, { marginTop: 12 }]}>Reason</Text>
              <TextInput
                style={[styles.textarea, touched.reason && reasonError ? styles.inputError : null]}
                placeholder="Enter reason"
                value={reason}
                onChangeText={(text) => {
                  setReason(text);
                  if (touched.reason) setReasonError(validateReason(text));
                }}
                onBlur={() => {
                  setTouched((t) => ({ ...t, reason: true }));
                  setReasonError(validateReason(reason));
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
              {touched.reason && reasonError ? (
                <Text style={styles.errorText}>{reasonError}</Text>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#7f8c8d" }]}
                onPress={() => setIsDeviationModalVisible(false)}
                disabled={isSubmittingDeviation}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: "#1abc9c", opacity: submitDisabled ? 0.6 : 1 },
                ]}
                onPress={handleDeviationSubmit}
                disabled={submitDisabled}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmittingDeviation ? "Submitting..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  content: { padding: 20 },
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#2c3e50",
  },
  banner: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 25,
    elevation: 4,
    backgroundColor: "#ddd",
  },
  bannerImage: { width: "100%", height: "100%", resizeMode: "cover" },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bannerText: { fontSize: 18, fontWeight: "600", color: "#fff" },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 25,
    elevation: 4,
  },
  statusIcon: { width: 35, height: 35, marginRight: 15, tintColor: "#fff" },
  statusText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  timeText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 2,
  },
  actionList: { flexDirection: "column", paddingBottom: 45 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 3,
  },
  actionIcon: { width: 40, height: 40, marginRight: 15, tintColor: "#fff" },
  actionText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2c3e50" },
  closeIcon: { width: 24, height: 24, tintColor: "#2c3e50" },
  reportList: { marginTop: 10 },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportIcon: { width: 28, height: 28, marginRight: 12, tintColor: "#fff" },
  reportText: { fontSize: 16, fontWeight: "600", color: "#fff" },

  // Form styles
  formLabel: { fontSize: 14, fontWeight: "600", color: "#2c3e50", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
    minHeight: 100,
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 6,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 10,
  },
  modalButtonText: { color: "#fff", fontWeight: "700" },
});
