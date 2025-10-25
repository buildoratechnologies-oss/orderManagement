import React from "react";
import { GetBaseApiUrl } from "../util/baseData";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDateAndTimeInFormate } from "../util/data";
import * as FileSystem from "expo-file-system";

const useAttendanceApis = () => {
  const handleAttendanceLogIn = async (payload) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let url = GetBaseApiUrl("UserAttendance");
      const response = await axios.post(
        url,
        { ...payload }, // body
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`, // 👈 token here
          },
        }
      );

      if (response?.data?.statusCode == 200) {
        return response?.data;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  const handleAttendanceCheckOut = async (payload) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let url = GetBaseApiUrl("UserAttendance/CheckOut");
      const response = await axios.put(
        url,
        { ...payload }, // body
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`, // 👈 token here
          },
        }
      );

      if (response?.data?.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  const handleGetAttendanceListByUser = async (
    date = null,
    userXidOverride = null
  ) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let userXid = userXidOverride;
      if (userXid == null) {
        const storedUser = await AsyncStorage.getItem("userXid");
        userXid = storedUser ?? 123;
      }
      let url = date
        ? GetBaseApiUrl(
            `UserAttendance/GetUserAttendanceByUserAndDate/${userXid}/${date}`
          )
        : GetBaseApiUrl(`UserAttendance/GetAllByUserID/${userXid}`);
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`, // 👈 token here
        },
      });
      if (response?.data) {
        return response?.data;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  const handleGetAttendanceList = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const userXid = await AsyncStorage.getItem("userXid");
      let url = GetBaseApiUrl(`UserAttendance`);
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`, // 👈 token here
        },
      });
      //   //console.log("✅ Success:", /response?.data);
      if (response?.data) {
        return response?.data;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  const handleGetAttendanceStatusData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const userXid = await AsyncStorage.getItem("userXid");
      let url = GetBaseApiUrl(`AttendanceStatus`);
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`, // 👈 token here
        },
      });
      //   //console.log("✅ Success:", /response?.data);
      if (response?.data) {
        return response?.data;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  ///CHECKIN -CHECKOUT
  const handleUserShopVisitCheckIn = async (payload) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let url = GetBaseApiUrl("AttendanceLog");
      const response = await axios.post(
        url,
        { ...payload }, // body
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`, // 👈 token here
          },
        }
      );

      if (response?.data?.statusCode == 200) {
        return response?.data;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  const handleUserShopVisitCheckOut = async (payload) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let url = GetBaseApiUrl("AttendanceLog");
      const response = await axios.put(
        url,
        { ...payload }, // body
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`, // 👈 token here
          },
        }
      );

      //console.log("✅ Success:", response?.data);
      if (response?.data?.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  // Loading and error state for uploads
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);

  const handleUploadMultipleImages = async (
    fileList,
    entity = "AssetImage"
  ) => {
    // Validate fileList
    if (!fileList || fileList.length === 0) {
      throw new Error("File list is empty or undefined");
    }

    const formData = new FormData();
    console.log("resssssssssssssssssssss");
    console.log(fileList);
    // Entity-level fields expected by backend
    formData.append("Entity", entity);
    formData.append("EntityType", entity);

    let validFileCount = 0;
    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index] || {};

      // Support { uri }, { imagePath }, or { Blob }
      const uri = file.uri || file.imagePath || file.Blob;
      if (!uri) {
        console.warn(
          `⚠️ Skipping file at index ${index}: missing uri/imagePath/Blob`
        );
        continue;
      }
      validFileCount++;

      const originalName =
        file.originalName || (uri.split("/").pop() ?? `file_${index}`);
      const savedName = file.savedName || originalName;

      // Infer extension from filename
      const inferredExt = (
        originalName.includes(".") ? originalName.split(".").pop() : "jpg"
      )?.toLowerCase();
      
      // Determine mimeType first (it might be in file.docExtension)
      let mimeType;
      let docExtension;
      
      if (file.mimeType) {
        // Use explicit mimeType if provided
        mimeType = file.mimeType;
        docExtension = `.${inferredExt}`;
      } else if (file.docExtension && file.docExtension.includes("/")) {
        // file.docExtension contains mime type like "image/jpeg"
        mimeType = file.docExtension;
        const extFromMime = file.docExtension.split("/")[1]; // "jpeg"
        docExtension = `.${extFromMime}`;
      } else if (file.docExtension) {
        // file.docExtension is already an extension like ".jpg" or "jpg"
        docExtension = file.docExtension.startsWith(".") ? file.docExtension : `.${file.docExtension}`;
        const extOnly = docExtension.replace(".", "");
        mimeType = `image/${extOnly}`;
      } else {
        // No docExtension provided, use inferred
        docExtension = `.${inferredExt}`;
        mimeType = `image/${inferredExt}`;
      }

      // Use a GUID-like unique name; server often expects a unique name per file
      const baseName = originalName.replace(/\.[^.]+$/, "");
      const fileNameGuid = `${baseName}_${Date.now()}${docExtension}`;
      
      // Ensure URI has proper format (must start with file:// for React Native)
      let finalUri = uri;
      if (!uri.startsWith("file://") && !uri.startsWith("http://") && !uri.startsWith("https://") && !uri.startsWith("blob:")) {
        finalUri = `file://${uri}`;
      }
      
      console.log(`File ${index}:`, {
        originalUri: uri,
        finalUri,
        originalName,
        savedName,
        docExtension,
        mimeType,
      });

      // Map metadata fields expected by backend model binder
      formData.append(
        `FileDetails[${index}].TypeOfDoc`,
        file.typeOfDoc || "Asset"
      );
      formData.append(`FileDetails[${index}].OriginalName`, originalName);
      formData.append(`FileDetails[${index}].ImagePath`, file.imagePath);
      formData.append(`FileDetails[${index}].DocExtension`, docExtension);
      formData.append(`FileDetails[${index}].ExistingFileName`, savedName);
      formData.append(`FileDetails[${index}].FileNameGuid`, savedName);

      // React Native FormData file handling
      // Read file and create proper blob for upload
      let fileToUpload;
      
      try {
        // Method 1: Try using fetch to get the blob (works for file:// URIs)
        const response = await fetch(finalUri);
        const blob = await response.blob();
        fileToUpload = blob;
        console.log(`File ${index} - created blob from fetch`);
      } catch (fetchError) {
        console.log(`File ${index} - fetch failed, using uri object:`, fetchError.message);
        // Method 2: Fallback to uri object format
        fileToUpload = {
          uri: finalUri,
          type: mimeType,
          name: savedName,
        };
      }
      
      console.log(`File ${index} - appending:`, {
        fieldName: `FileDetails[${index}].Blob`,
        fileName: savedName,
        type: mimeType,
      });
      
      formData.append(`FileDetails[${index}].Blob`, fileToUpload, savedName);
    }

    // Ensure at least one valid file was added
    if (validFileCount === 0) {
      throw new Error("No valid files with uri/imagePath/Blob found in fileList");
    }

    console.log("📤 About to upload. Valid file count:", validFileCount);

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const storedToken = await AsyncStorage.getItem("token");
      const url = GetBaseApiUrl("Upload/UploadMultiple");
      
      console.log("🚀 Uploading to:", url);
      
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          // DON'T set Content-Type - let axios set it with proper boundary
        },
      });
      
      console.log("✅ Upload successful:", response.data);
      return response.data;
    } catch (err) {
      console.error("❌ Upload failed:", err);
      console.error("❌ Error response:", err.response?.data);
      setUploadError(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  return {
    handleAttendanceLogIn,
    handleGetAttendanceStatusData,
    handleGetAttendanceList,
    handleGetAttendanceListByUser,
    handleAttendanceCheckOut,
    handleUserShopVisitCheckIn,
    handleUserShopVisitCheckOut,
    handleUploadMultipleImages,
    isUploading,
    uploadError,
  };
};

export default useAttendanceApis;
