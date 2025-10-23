import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useOnBordingMutation } from "../../../redux/api/protectedApiSlice";
import useAttendanceApis from "../../../hooks/useAttendanceApis";

// Helpers
const onlyDigits = (s = "") => (s || "").replace(/\D/g, "");
const isEmail = (s = "") =>
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(s.trim());
const isLat = (v) =>
  typeof v === "number"
    ? v >= -90 && v <= 90
    : /^-?\d{1,2}(\.\d+)?$/.test(v) &&
      parseFloat(v) >= -90 &&
      parseFloat(v) <= 90;
const isLng = (v) =>
  typeof v === "number"
    ? v >= -180 && v <= 180
    : /^-?\d{1,3}(\.\d+)?$/.test(v) &&
      parseFloat(v) >= -180 &&
      parseFloat(v) <= 180;
const isGSTINLoose = (s = "") => /^[0-9A-Z]{15}$/.test(s.trim());

const normalizeForm = (f) => {
  const mobile = onlyDigits(f.mobile).slice(0, 15);
  const gstin = (f.gstin || "")
    .toString()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
  return {
    ...f,
    leadName: (f.leadName || "").trim(),
    email: (f.email || "").trim(),
    mobile,
    company: (f.company || "").trim(),
    source: (f.source || "").trim(),
    officeAddress: (f.officeAddress || "").trim(),
    poBox: (f.poBox || "").trim(),
    gstin,
    stateXid: onlyDigits((f.stateXid || "").toString()),
    latitude: (f.latitude || "").toString().trim(),
    longitude: (f.longitude || "").toString().trim(),
  };
};

const validateForm = (f) => {
  const v = normalizeForm(f);
  const errors = {};

  if (!v.leadName || v.leadName.length < 2)
    errors.leadName = "Enter a valid lead name.";
  if (!v.company || v.company.length < 2)
    errors.company = "Enter a valid company name.";

  if (!v.mobile) errors.mobile = "Mobile is required.";
  else if (v.mobile.length < 10)
    errors.mobile = "Enter a valid mobile (10+ digits).";

  if (!v.email) errors.email = "Email is required.";
  else if (!isEmail(v.email)) errors.email = "Enter a valid email.";

  if (!v.source) errors.source = "Source is required.";
  if (!v.poBox) errors.poBox = "P.O. Box is required.";

  if (!v.gstin) errors.gstin = "GSTIN is required.";
  else if (!isGSTINLoose(v.gstin))
    errors.gstin = "GSTIN must be 15 uppercase alphanumeric chars.";

  if (!v.stateXid) errors.stateXid = "State XID is required.";
  else if (isNaN(Number(v.stateXid)))
    errors.stateXid = "State XID must be a number.";

  if (!v.latitude) errors.latitude = "Latitude is required.";
  else if (!isLat(v.latitude))
    errors.latitude = "Latitude must be between -90 and 90.";
  if (!v.longitude) errors.longitude = "Longitude is required.";
  else if (!isLng(v.longitude))
    errors.longitude = "Longitude must be between -180 and 180.";

  const valid = Object.keys(errors).length === 0;

  const payload = {
    leadName: v.leadName,
    email: v.email,
    mobile: v.mobile,
    company: v.company,
    source: v.source,
    officeAddress: v.officeAddress,
    poBox: v.poBox,
    gstin: v.gstin,
    stateXid: Number(v.stateXid) || 0,
    latitude: v.latitude ? Number(v.latitude) : 0,
    longitude: v.longitude ? Number(v.longitude) : 0,
    longatitude: v.longitude ? Number(v.longitude) : 0, // alias used elsewhere in app
    langtitude: v.longitude ? Number(v.longitude) : 0, // extra alias for compatibility
  };

  return { valid, errors, payload };
};

const AddShop = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    leadName: "",
    email: "",
    mobile: "",
    company: "",
    source: "",
    officeAddress: "",
    poBox: "",
    gstin: "",
    stateXid: "",
    latitude: "",
    longitude: "",
  });
  const [errors, setErrors] = useState({});
  const [locLoading, setLocLoading] = useState(false);
  const [onBordingApi, { isLoading: saving }] = useOnBordingMutation();
  const { handleUploadMultipleImages, isUploading } = useAttendanceApis();

  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  const update = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const useMyLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow location access.");
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      update("latitude", String(coords.latitude));
      update("longitude", String(coords.longitude));
    } catch (e) {
      Alert.alert("Error", "Unable to fetch location.");
    } finally {
      setLocLoading(false);
    }
  };

  const onSubmit = async () => {
    const { valid, errors: es, payload } = validateForm(form);
    if (!valid) {
      setErrors(es);
      Alert.alert("Fix errors", "Please correct the highlighted fields.");
      return;
    }

    const apiPayload = {
      leadName: payload.leadName,
      email: payload.email,
      mobile: payload.mobile,
      company: payload.company,
      source: payload.source,
      officeAddress: payload.officeAddress,
      poBox: payload.poBox,
      gstin: payload.gstin,
      stateXid: payload.stateXid,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };

    try {
      let res = await onBordingApi(apiPayload).unwrap();

      // If saved and image selected, upload it as well (independent of Lead API)
      if (res?.details && imageInfo) {
        try {
          await handleUploadMultipleImages([imageInfo], "LeadImage");
        } catch (e) {
          console.log("Image upload failed:", e);
        }
      }

      if (res?.details) {
        Alert.alert("Success", imageInfo ? "Shop saved and photo uploaded." : "Shop onboarded successfully.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      const msg =
        err?.data?.message || err?.error || "Failed to save. Please try again.";
      Alert.alert("Error", msg);
    }
  };

  // Image pickers
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      const fileUri = file.uri;
      const fileName = file.fileName || fileUri.split("/").pop();
      const fileType = file.mimeType || "image/jpeg";
      setSelectedImageUri(fileUri);
      setImageInfo({
        typeOfDoc: "Asset",
        savedName: fileName,
        originalName: fileName,
        imagePath: fileUri,
        docExtension: fileType,
      });
    }
  };

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
      const fileUri = file.uri;
      const fileName = file.fileName || fileUri.split("/").pop();
      const fileType = file.mimeType || "image/jpeg";
      setSelectedImageUri(fileUri);
      setImageInfo({
        typeOfDoc: "Asset",
        savedName: fileName,
        originalName: fileName,
        imagePath: fileUri,
        docExtension: fileType,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Input
            required
            label="Lead Name"
            value={form.leadName}
            onChangeText={(v) => update("leadName", v)}
            error={errors.leadName}
          />
          <Input
            required
            label="Email"
            value={form.email}
            onChangeText={(v) => update("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            required
            label="Mobile"
            value={form.mobile}
            onChangeText={(v) => update("mobile", v)}
            keyboardType="phone-pad"
            maxLength={15}
            error={errors.mobile}
          />
          <Input
            required
            label="Company"
            value={form.company}
            onChangeText={(v) => update("company", v)}
            error={errors.company}
          />
          <Input
            required
            label="Source"
            value={form.source}
            onChangeText={(v) => update("source", v)}
            error={errors.source}
          />
          <Input
            label="Office Address"
            value={form.officeAddress}
            onChangeText={(v) => update("officeAddress", v)}
            multiline
          />
          <Input
            required
            label="P.O. Box"
            value={form.poBox}
            onChangeText={(v) => update("poBox", v)}
            error={errors.poBox}
          />
          <Input
            required
            label="GSTIN"
            value={form.gstin}
            onChangeText={(v) =>
              update("gstin", v.toUpperCase().replace(/[^0-9A-Z]/g, ""))
            }
            autoCapitalize="characters"
            maxLength={15}
            error={errors.gstin}
          />
          <Input
            required
            label="State XID"
            value={form.stateXid}
            onChangeText={(v) => update("stateXid", onlyDigits(v))}
            keyboardType="number-pad"
            error={errors.stateXid}
          />

          {/* Photo upload */}
          <View style={styles.uploadWrap}>
            <Text style={styles.label}>Shop Photo (optional)</Text>
            {selectedImageUri ? (
              <View style={styles.previewRow}>
                <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}
                  onPress={() => {
                    setSelectedImageUri(null);
                    setImageInfo(null);
                  }}
                >
                  <Icon name="trash-can" size={18} color="#b91c1c" />
                  <Text style={[styles.smallBtnText, { color: "#b91c1c" }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.uploadBtnsRow}>
              <TouchableOpacity style={styles.smallBtn} onPress={pickImage} disabled={isUploading}>
                <Icon name="folder-image" size={18} color="#4f46e5" />
                <Text style={styles.smallBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={takePhoto} disabled={isUploading}>
                <Icon name="camera" size={18} color="#4f46e5" />
                <Text style={styles.smallBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inlineGroup}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                required
                label="Latitude"
                placeholder="e.g. 12.9716"
                value={form.latitude}
                onChangeText={(v) => update("latitude", v)}
                keyboardType="decimal-pad"
                error={errors.latitude}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                required
                label="Longitude"
                placeholder="e.g. 77.5946"
                value={form.longitude}
                onChangeText={(v) => update("longitude", v)}
                keyboardType="decimal-pad"
                error={errors.longitude}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.locBtn}
            onPress={useMyLocation}
            disabled={locLoading}
          >
            <Icon name="crosshairs-gps" size={18} color="#6366f1" />
            <Text style={styles.locBtnText}>
              {locLoading ? "Getting location..." : "Use my location"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={onSubmit}
          disabled={saving}
        >
          <Icon name="content-save" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {(saving || isUploading) && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>{saving ? "Saving..." : "Uploading photo..."}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const Input = ({ label, required, error, multiline, style, ...props }) => (
  <View style={[styles.inputWrap, style]}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={{ color: "#dc2626" }}> *</Text> : null}
    </Text>
    <TextInput
      placeholder={label}
      placeholderTextColor="#9ca3af"
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        error && styles.inputError,
      ]}
      multiline={!!multiline}
      {...props}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  row: { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 2 },
  inputWrap: { marginBottom: 12 },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: "600" },
  uploadWrap: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
  },
  uploadBtnsRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  smallBtnText: { marginLeft: 8, color: "#4f46e5", fontWeight: "600" },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#e5e7eb" },
  input: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  inputError: { borderColor: "#dc2626", backgroundColor: "#fff1f2" },
  errorText: {
    marginTop: 6,
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  inlineGroup: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  locBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  locBtnText: { marginLeft: 8, color: "#6366f1", fontWeight: "600" },
  submitBtn: {
    marginTop: 16,
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    alignItems: "center",
  },
  loadingText: { marginTop: 8, color: "#374151", fontWeight: "600" },
});

export default AddShop;
