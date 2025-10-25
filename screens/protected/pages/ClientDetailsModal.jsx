import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Linking,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import useAttendanceApis from "../../../hooks/useAttendanceApis";
import { getDateAndTimeInFormate } from "../../../util/data";
import { useUploadCheckInImageInfoMutation } from "../../../redux/api/protectedApiSlice";

const ClientDetailsModal = ({
  visible,
  onClose,
  client,
  latitude,
  longitude,
}) => {
  const navigation = useNavigation();
  const {
    handleUserShopVisitCheckIn,
    handleUploadMultipleImages,
    isUploading,
  } = useAttendanceApis();

  const [loading, setLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [checkInId, setCheckInId] = useState(null);

  const [uploadCheckInImageInfo] = useUploadCheckInImageInfoMutation();

  // Premium entry animation
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!client) return null;

  // Debug logging
  // console.log('Client data in modal:', JSON.stringify(client, null, 2));
  // console.log('Client keys:', Object.keys(client));

  // Derived display helpers
  const fullName =
    client?.companyName ||
    [client?.firstName, client?.lastName].filter(Boolean).join(" ") ||
    client?.name ||
    "Unknown";
  const displayCompany =
    client?.companyName ||
    client?.userCompany?.companyBranch?.companies?.nameEng ||
    client?.userCompany?.companyBranch?.nameEng ||
    null;
  const displayAddress =
    client?.officeAddress ||
    client?.userCompany?.companyBranch?.poBox ||
    client?.userCompany?.companyBranch?.companies?.address ||
    client?.userCompany?.companyBranch?.branches?.address ||
    null;
  const branchName =
    client?.userCompany?.companyBranch?.branches?.nameEng || null;
  const companyPhone =
    client?.userCompany?.companyBranch?.phone ||
    client?.userCompany?.companyBranch?.mobile ||
    client?.mobile ||
    null;
  const rolesList = Array.isArray(client?.roles)
    ? client.roles.map((r) => r?.nameEng).filter(Boolean)
    : [];
  const genderLabel =
    client?.gender === "M"
      ? "Male"
      : client?.gender === "F"
      ? "Female"
      : client?.gender || "N/A";
  const boolText = (b) => (b ? "Yes" : "No");
  const getInitials = (name) =>
    (name || "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  // Handle phone press
  const handleMobilePress = () => {
    if (client.mobile) Linking.openURL(`tel:${client.mobile}`);
  };

  // Handle address press
  const handleAddressPress = () => {
    if (displayAddress) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          displayAddress
        )}`
      );
    }
  };

  // Navigate home
  const goToHomeAndResetHistory = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "MenuPage" }],
      })
    );
  };

  // Open Upload Modal only
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await AsyncStorage.setItem("selectedShop", JSON.stringify(client));
      setUploadModal(true);
    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Perform actual check-in after image is uploaded
  const performCheckIn = async () => {
    try {
      const attendanceLogPid = await AsyncStorage.getItem("attendanceLogPid");

      const payload = {
        attendanceXid: attendanceLogPid,
        clientXid: client?.pid,
        checkInTimeLog: getDateAndTimeInFormate(),
        atClientLoginLatitude: latitude,
        atClientLoginLongitude: longitude,
      };

      // Check if this is a planned visit and add planVisitDetailXid
      if (client?.dataType === "plannedVisit" || client?.planned) {
        payload.PlanVisitDetailXID = client?.planVisitDetailXID;
      }

      const response = await handleUserShopVisitCheckIn(payload);

      if (response) {
        await AsyncStorage.setItem("visitCheckIn", JSON.stringify(response));
        setCheckInId(JSON.stringify(response?.details));
        return response;
      }
    } catch (error) {
      console.log("Check-In Error:", error);
      throw error;
    }
  };

  const handleploadImageData = async (info) => {
    try {
      // First: Perform check-in API call
      const checkInResponse = await performCheckIn();

      if (checkInResponse) {
        // Second: Upload image info with check-in response
        let res = await uploadCheckInImageInfo([
          { ...info, attendanceLogXid: checkInId },
        ]);

        // Third: Upload multiple images
        await handleUploadMultipleImages([{ ...info }]);

        setUploadModal(false);
        goToHomeAndResetHistory();
      } else {
        Alert.alert("Error", "Check-in failed. Please try again.");
      }
    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Error", "Something went wrong during check-in or upload.");
    }
  };

  // ✅ Upload from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      setSelectedImage(file.uri);
      const fileUri = file.uri;
      const fileName = file.fileName || fileUri.split("/").pop();
      const fileType = file.mimeType || "image/jpeg";
      const fileExtension = fileName?.split(".").pop() || "jpg";
console.log(file)
      // ✅ Construct fileInfo with Blob
      const fileInfo = {
        Blob: fileUri,
        typeOfDoc: "Asset",
        savedName: fileName,
        originalName: fileName,
        imagePath: fileUri,
        mimeType: fileType,
        docExtension: `.${fileExtension}`,
      };

      await handleploadImageData(fileInfo);
    }
  };

  // ✅ Capture photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera permission is needed.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      setSelectedImage(file.uri);
      // Extract metadata
      const fileName = file.fileName || file.uri.split("/").pop();
      const fileType = file.mimeType || "image/jpeg";
      const fileExtension = fileName?.split(".").pop() || "jpg";

      // ✅ Construct fileInfo with Blob
      const fileInfo = {
        Blob: file.uri,
        typeOfDoc: "Asset",
        savedName: fileName,
        originalName: fileName,
        imagePath: file.uri,
        mimeType: fileType,
        docExtension: `.${fileExtension}`,
      };
      await handleploadImageData(fileInfo);

      console.log("📸 Uploaded Image Info:", fileInfo);
      // console.log("📸 Uploaded Image URI:", file.uri);
      // console.log("📷 Captured Image URI:", file.uri);
    }
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <LinearGradient
            colors={["#0ea5e9", "#8b5cf6", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumTopBar}
          />
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={styles.avatar}>
                {client?.imageUrl ? (
                  <Image
                    source={{ uri: client.imageUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>
                    {getInitials(fullName)}
                  </Text>
                )}
              </View>
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>{fullName}</Text>
                <Text style={styles.modalSubtitle}>
                  {displayCompany || "User Details"}
                </Text>
              </View>
              <View style={styles.premiumBadge}>
                <LinearGradient
                  colors={["#fde68a", "#f59e0b"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumBadgeBg}
                >
                  <Icon name="crown" size={14} color="#1f2937" />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </LinearGradient>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <View style={styles.infoRow}>
                <Icon name="identifier" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>User ID (PID)</Text>
                  <Text style={styles.infoValue}>{client?.pid ?? "N/A"}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="gender-male-female" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{genderLabel}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="shield-check" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Two-Factor Enabled</Text>
                  <Text style={styles.infoValue}>
                    {boolText(client?.enable2Factor)}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="lock" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Account Locked</Text>
                  <Text style={styles.infoValue}>
                    {boolText(client?.isLocked)}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="calendar" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Created On</Text>
                  <Text style={styles.infoValue}>
                    {client?.createdOn || "N/A"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="clock-outline" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Edit</Text>
                  <Text style={styles.infoValue}>
                    {client?.lastEdit || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>

              {client?.mobile && (
                <Pressable style={styles.infoRow} onPress={handleMobilePress}>
                  <Icon name="phone" size={18} color="#059669" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Mobile Number</Text>
                    <Text style={[styles.infoValue, styles.linkValue]}>
                      {client.mobile}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#059669" />
                </Pressable>
              )}

              {client?.email && (
                <Pressable
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`mailto:${client.email}`)}
                >
                  <Icon name="email" size={18} color="#2563eb" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={[styles.infoValue, styles.linkValue]}>
                      {client.email}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#2563eb" />
                </Pressable>
              )}

              {client?.landLine && (
                <View style={styles.infoRow}>
                  <Icon name="phone-classic" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Landline</Text>
                    <Text style={styles.infoValue}>{client.landLine}</Text>
                  </View>
                </View>
              )}

              {client?.dialingCode && (
                <View style={styles.infoRow}>
                  <Icon name="numeric" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Dialing Code</Text>
                    <Text style={styles.infoValue}>{client.dialingCode}</Text>
                  </View>
                </View>
              )}

              {displayAddress && (
                <Pressable style={styles.infoRow} onPress={handleAddressPress}>
                  <Icon name="map-marker" size={18} color="#dc2626" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={[styles.infoValue, styles.linkValue]}>
                      {displayAddress}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#dc2626" />
                </Pressable>
              )}
            </View>

            {/* Company & Branch */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Company & Branch</Text>
              {displayCompany && (
                <View style={styles.infoRow}>
                  <Icon name="office-building" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Company</Text>
                    <Text style={styles.infoValue}>{displayCompany}</Text>
                  </View>
                </View>
              )}
              {branchName && (
                <View style={styles.infoRow}>
                  <Icon name="store-marker" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Branch</Text>
                    <Text style={styles.infoValue}>{branchName}</Text>
                  </View>
                </View>
              )}
              {displayAddress && (
                <Pressable style={styles.infoRow} onPress={handleAddressPress}>
                  <Icon name="map-marker" size={18} color="#dc2626" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={[styles.infoValue, styles.linkValue]}>
                      {displayAddress}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#dc2626" />
                </Pressable>
              )}
              {companyPhone && (
                <Pressable style={styles.infoRow} onPress={handleMobilePress}>
                  <Icon name="phone" size={18} color="#059669" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Company Phone</Text>
                    <Text style={[styles.infoValue, styles.linkValue]}>
                      {companyPhone}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#059669" />
                </Pressable>
              )}
            </View>

            {/* Roles */}
            {rolesList.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Roles</Text>
                <View style={styles.chipsRow}>
                  {rolesList.map((role) => (
                    <View key={role} style={styles.roleChip}>
                      <Text style={styles.roleChipText}>{role}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Location Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Details</Text>

              {client.city && (
                <View style={styles.infoRow}>
                  <Icon name="city" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>City</Text>
                    <Text style={styles.infoValue}>{client.city}</Text>
                  </View>
                </View>
              )}

              {client.stateName && (
                <View style={styles.infoRow}>
                  <Icon name="map-outline" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>State</Text>
                    <Text style={styles.infoValue}>{client.stateName}</Text>
                  </View>
                </View>
              )}

              {/* Fallback if no location data */}
              {!client.city && !client.stateName && (
                <View style={styles.infoRow}>
                  <Icon name="map-marker-off" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>
                      No location data available
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Business Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Details</Text>

              {client.channel && (
                <View style={styles.infoRow}>
                  <Icon name="account-network" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Channel</Text>
                    <Text style={styles.infoValue}>{client.channel}</Text>
                  </View>
                </View>
              )}

              {client.category && (
                <View style={styles.infoRow}>
                  <Icon name="tag" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Category</Text>
                    <Text style={styles.infoValue}>{client.category}</Text>
                  </View>
                </View>
              )}

              {client.storeClassification && (
                <View style={styles.infoRow}>
                  <Icon name="store-marker" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Store Classification</Text>
                    <Text style={styles.infoValue}>
                      {client.storeClassification}
                    </Text>
                  </View>
                </View>
              )}

              {client.pgnCheckIn && (
                <View style={styles.infoRow}>
                  <Icon name="check-circle" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>PGN Check-In</Text>
                    <Text style={styles.infoValue}>{client.pgnCheckIn}</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.secondaryButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButtonWrapper, loading && styles.buttonDisabled]}
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                handleCheckIn();
              }}
              disabled={loading}
            >
              <LinearGradient
                colors={["#8b5cf6", "#06b6d4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="login" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Check In</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Upload Photo Modal */}
      <Modal
        transparent
        visible={uploadModal}
        animationType="none"
        onRequestClose={() => {
          Alert.alert(
            "Photo Required",
            "Please upload a photo to complete your check-in."
          );
        }}
      >
        <View style={styles.uploadOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.uploadContainer}>
            <LinearGradient
              colors={["#0ea5e9", "#8b5cf6", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumTopBar}
            />
            {/* Upload Header */}
            <View style={styles.uploadHeader}>
              <View style={styles.uploadHeaderContent}>
                <Icon name="camera" size={24} color="#6366f1" />
                <Text style={styles.uploadTitle}>Upload Photo</Text>
              </View>
              <Text style={styles.uploadSubtitle}>
                Photo is required to complete your check-in.
              </Text>
            </View>

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                />
                <View style={styles.previewOverlay}>
                  <Icon name="check-circle" size={32} color="#059669" />
                  <Text style={styles.previewText}>Image Selected</Text>
                </View>
              </View>
            )}

            {/* Upload Options */}
            <View style={styles.uploadOptions}>
              <Pressable
                style={[
                  styles.uploadOptionButton,
                  isUploading && styles.buttonDisabled,
                ]}
                onPress={pickImage}
                disabled={isUploading}
              >
                <LinearGradient
                  colors={["#f3f4f6", "#eef2ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Icon name="folder-image" size={24} color="#6366f1" />
                <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                <Icon name="chevron-right" size={16} color="#6b7280" />
              </Pressable>

              <Pressable
                style={[
                  styles.uploadOptionButton,
                  isUploading && styles.buttonDisabled,
                ]}
                onPress={takePhoto}
                disabled={isUploading}
              >
                <LinearGradient
                  colors={["#f3f4f6", "#eef2ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Icon name="camera-outline" size={24} color="#6366f1" />
                <Text style={styles.uploadOptionText}>Take Photo</Text>
                <Icon name="chevron-right" size={16} color="#6b7280" />
              </Pressable>
            </View>

            {/* Loading Overlay */}
            {isUploading && (
              <View style={styles.uploadLoadingOverlay}>
                <View style={styles.uploadLoadingContent}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.uploadLoadingText}>
                    Uploading Photo...
                  </Text>
                  <Text style={styles.uploadLoadingSubtext}>
                    Please wait while we process your image
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Main Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#0b1220",
    borderRadius: 20,
    width: "100%",
    height: "90%",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  premiumTopBar: {
    height: 4,
    width: "100%",
  },

  // Header Styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.12)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  premiumBadge: {
    marginLeft: 8,
  },
  premiumBadgeBg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
  },

  // Content Styles
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "transparent",
    minHeight: 200,
  },
  section: {
    marginVertical: 12,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.08)",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  linkValue: {
    color: "#a78bfa",
  },

  // Avatar styles
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.35)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: "#c7d2fe",
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: "rgba(167, 139, 250, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c7d2fe",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.12)",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
  },
  primaryButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Upload Modal Styles
  uploadOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  uploadContainer: {
    backgroundColor: "#0b1220",
    borderRadius: 20,
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  uploadHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.12)",
    alignItems: "center",
  },
  uploadHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5e7eb",
    marginLeft: 12,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },

  // Image Preview
  imagePreviewContainer: {
    alignItems: "center",
    padding: 20,
    position: "relative",
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  previewOverlay: {
    position: "absolute",
    top: 30,
    right: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  previewText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 6,
  },

  // Upload Options
  uploadOptions: {
    padding: 20,
  },
  uploadOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    overflow: "hidden",
  },
  uploadOptionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e5e7eb",
    flex: 1,
    marginLeft: 12,
  },

  // Upload Actions
  uploadActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  uploadSecondaryButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },

  // Upload Loading
  uploadLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  uploadLoadingContent: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  uploadLoadingText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e5e7eb",
    marginTop: 16,
  },
  uploadLoadingSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
  },
});

export default ClientDetailsModal;
