import React from "react";
import { GetBaseApiUrl } from "../util/baseData";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDateAndTimeInFormate } from "../util/data";
import { useUploadMultipleFilesMutation } from "../redux/api/protectedApiSlice";

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

  const handleGetAttendanceListByUser = async (date) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      //   ​/api​/​/{ByDate}
      let url = date
        ? GetBaseApiUrl(`UserAttendance/GetUserAttendanceByUserAndDate/${date}`)
        : GetBaseApiUrl(`UserAttendance/GetAllByUserID/123`);
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

  const [uploadMultipleFiles] = useUploadMultipleFilesMutation();

  // Loading and error state for uploads
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(null);

  const handleUploadMultipleImages = async (
    fileList,
    entity = "AssetImage"
  ) => {
    const formData = new FormData();
console.log("resssssssssssssssssssss")
console.log(fileList)
    // Entity-level fields expected by backend
    formData.append("Entity", entity);
    formData.append("EntityType", entity);

    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index] || {};

      // Support both { uri } and { imagePath }
      const uri = file.uri || file.imagePath;
      if (!uri) {
        console.warn(`⚠️ Skipping file at index ${index}: missing uri/imagePath`);
        continue;
      }

      const originalName = file.originalName || (uri.split("/").pop() ?? `file_${index}`);
      const savedName = file.savedName || originalName;

      // Infer extension and mime type robustly
      const inferredExt = (originalName.includes(".") ? originalName.split(".").pop() : "jpg")?.toLowerCase();
      const docExtension = file.docExtension && file.docExtension.startsWith(".")
        ? file.docExtension
        : file.docExtension && file.docExtension.startsWith("image/")
        ? `.${file.docExtension.split("/")[1]}`
        : `.${inferredExt}`;

      const mimeType = file.mimeType || (file.docExtension && file.docExtension.includes("/"))
        ? file.docExtension
        : `image/${(docExtension || ".jpg").replace(".", "")}`;

      // Use a GUID-like unique name; server often expects a unique name per file
      const baseName = originalName.replace(/\.[^.]+$/, "");
      const fileNameGuid = `${baseName}_${Date.now()}${docExtension}`;

      // Map metadata fields expected by backend model binder
      formData.append(`FileDetails[${index}].TypeOfDoc`, file.typeOfDoc || "Asset");
      formData.append(`FileDetails[${index}].OriginalName`, originalName);
      formData.append(`FileDetails[${index}].ImagePath`, file.imagePath || "");
      formData.append(`FileDetails[${index}].DocExtension`, docExtension);
      formData.append(`FileDetails[${index}].ExistingFileName`, savedName);
      formData.append(`FileDetails[${index}].FileNameGuid`, fileNameGuid);

      // IMPORTANT: In React Native, append the file as { uri, name, type }
      formData.append(`FileDetails[${index}].Blob`, {
        uri,
        name: fileNameGuid,
        type: mimeType,
      });
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const response = await uploadMultipleFiles(formData).unwrap();
      console.log("✅ Upload successful:", response);
      return response;
    } catch (err) {
      console.error("❌ Upload failed:", err);
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
