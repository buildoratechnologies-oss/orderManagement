import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
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
} from "react-native";
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

  if (!client) return null;
  
  // Debug logging
  // console.log('Client data in modal:', JSON.stringify(client, null, 2));
  // console.log('Client keys:', Object.keys(client));

  // Handle phone press
  const handleMobilePress = () => {
    if (client.mobile) Linking.openURL(`tel:${client.mobile}`);
  };

  // Handle address press
  const handleAddressPress = () => {
    if (client.officeAddress) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          client.officeAddress
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

  // ✅ Run Check-In first, then open Upload Modal
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await AsyncStorage.setItem("selectedShop", JSON.stringify(client));
      const attendanceLogPid = await AsyncStorage.getItem("attendanceLogPid");

      const payload = {
        attendanceXid: attendanceLogPid,
        clientXid: client?.pid,
        checkInTimeLog: getDateAndTimeInFormate(),
        atClientLoginLatitude: latitude,
        atClientLoginLongitude: longitude,
      };

      const response = await handleUserShopVisitCheckIn(payload);

      if (response) {
        await AsyncStorage.setItem("visitCheckIn", JSON.stringify(response));
        setCheckInId(JSON.stringify(response?.details));
        Alert.alert(
          "Check-In Successful",
          "You have successfully checked in. Would you like to upload a photo?",
          [
            {
              text: "Upload Photo",
              onPress: () => setUploadModal(true),
            },
            {
              text: "Close",
              style: "cancel",
              onPress: goToHomeAndResetHistory,
            },
          ]
        );
      }
    } catch (error) {
      console.log("Check-In Error:", error);
      Alert.alert("Error", "Something went wrong during check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleploadImageData = async (info) => {
try {
      let res = await uploadCheckInImageInfo([
      { ...info, attendanceLogXid: checkInId },
    ]);
    console.log("reeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
    console.log(res)
    await handleUploadMultipleImages([{ ...info }]);
    setUploadModal(false);
    goToHomeAndResetHistory();
} catch (error) {
  console.log("errrr:"+error)
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

      // ✅ Construct fileInfo with Blob
      const fileInfo = {
        typeOfDoc: "Asset",
        savedName: fileName,
        originalName: fileName,
        imagePath: fileUri,
        docExtension: fileType,
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

      // ✅ Convert image to Blob
      // const response = await fetch(fileUri);
      // const blob = await response.blob();
      const fileInfo = {
        typeOfDoc: "Asset",
        savedName: fileName,
        originalName: fileName,
        imagePath: file.uri,
        docExtension: fileType,
      };
      await handleploadImageData(fileInfo);

      console.log("📸 Uploaded Image Info:", fileInfo);
      // console.log("📸 Uploaded Image URI:", file.uri);
      // console.log("📷 Captured Image URI:", file.uri);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Icon name="store" size={24} color="#6366f1" />
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>{client.companyName}</Text>
                <Text style={styles.modalSubtitle}>Client Details</Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
            {/* Test content to ensure rendering */}
            <View style={{padding: 20, backgroundColor: '#f0f0f0', margin: 10, borderRadius: 8}}>
              <Text style={{fontSize: 16, color: '#000'}}>TEST: ScrollView is rendering</Text>
              <Text style={{fontSize: 14, color: '#666', marginTop: 5}}>Client name: {client?.companyName || client?.name || 'Unknown'}</Text>
            </View>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              {client.outletCode && (
                <View style={styles.infoRow}>
                  <Icon name="identifier" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Outlet Code</Text>
                    <Text style={styles.infoValue}>{client.outletCode}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Icon name="store-outline" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Outlet Name</Text>
                  <Text style={styles.infoValue}>{client.companyName || client.name || 'N/A'}</Text>
                </View>
              </View>

              {client.clientReferenceNumber && (
                <View style={styles.infoRow}>
                  <Icon name="card-text" size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Reference Code</Text>
                    <Text style={styles.infoValue}>{client.clientReferenceNumber}</Text>
                  </View>
                </View>
              )}
              
              {/* Debug info - shows all available client properties */}
              {/* <View style={styles.infoRow}>
                <Icon name="information" size={18} color="#ea580c" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Available Data</Text>
                  <Text style={styles.infoValue}>{Object.keys(client).join(', ')}</Text>
                </View>
              </View> */}
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              {client.mobile && (
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
              
              {client.officeAddress && (
                <Pressable style={styles.infoRow} onPress={handleAddressPress}>
                  <Icon name="map-marker" size={18} color="#dc2626" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={[styles.infoValue, styles.linkValue]}>
                      {client.officeAddress}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#dc2626" />
                </Pressable>
              )}
            </View>

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
                    <Text style={styles.infoValue}>No location data available</Text>
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
                    <Text style={styles.infoValue}>{client.storeClassification}</Text>
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
              style={[
                styles.primaryButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleCheckIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="login" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Check In</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Upload Photo Modal */}
      <Modal transparent visible={uploadModal} animationType="fade">
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            {/* Upload Header */}
            <View style={styles.uploadHeader}>
              <View style={styles.uploadHeaderContent}>
                <Icon name="camera" size={24} color="#6366f1" />
                <Text style={styles.uploadTitle}>Upload Photo</Text>
              </View>
              <Text style={styles.uploadSubtitle}>Add a check-in photo to complete your visit</Text>
            </View>

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <View style={styles.previewOverlay}>
                  <Icon name="check-circle" size={32} color="#059669" />
                  <Text style={styles.previewText}>Image Selected</Text>
                </View>
              </View>
            )}

            {/* Upload Options */}
            <View style={styles.uploadOptions}>
              <Pressable
                style={[styles.uploadOptionButton, isUploading && styles.buttonDisabled]}
                onPress={pickImage}
                disabled={isUploading}
              >
                <Icon name="folder-image" size={24} color="#6366f1" />
                <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                <Icon name="chevron-right" size={16} color="#6b7280" />
              </Pressable>

              <Pressable
                style={[styles.uploadOptionButton, isUploading && styles.buttonDisabled]}
                onPress={takePhoto}
                disabled={isUploading}
              >
                <Icon name="camera-outline" size={24} color="#6366f1" />
                <Text style={styles.uploadOptionText}>Take Photo</Text>
                <Icon name="chevron-right" size={16} color="#6b7280" />
              </Pressable>
            </View>

            {/* Upload Actions */}
            <View style={styles.uploadActions}>
              <Pressable
                style={[styles.uploadSecondaryButton, isUploading && styles.buttonDisabled]}
                onPress={() => {
                  if (isUploading) return;
                  setUploadModal(false);
                  goToHomeAndResetHistory();
                }}
                disabled={isUploading}
              >
                <Text style={styles.uploadSecondaryButtonText}>Skip Photo</Text>
              </Pressable>
            </View>

            {/* Loading Overlay */}
            {isUploading && (
              <View style={styles.uploadLoadingOverlay}>
                <View style={styles.uploadLoadingContent}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.uploadLoadingText}>Uploading Photo...</Text>
                  <Text style={styles.uploadLoadingSubtext}>Please wait while we process your image</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    height: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  
  // Header Styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  
  // Content Styles
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
    minHeight: 200,
  },
  section: {
    marginVertical: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  linkValue: {
    color: '#6366f1',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  
  // Upload Modal Styles
  uploadOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  uploadHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  uploadHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Image Preview
  imagePreviewContainer: {
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  previewOverlay: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 6,
  },
  
  // Upload Options
  uploadOptions: {
    padding: 20,
  },
  uploadOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginLeft: 12,
  },
  
  // Upload Actions
  uploadActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  uploadSecondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  
  // Upload Loading
  uploadLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  uploadLoadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  uploadLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  uploadLoadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ClientDetailsModal;
