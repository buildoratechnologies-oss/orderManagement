import axios from "axios";
import { GetBaseApiUrl } from "../util/baseData";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let baseURL = "https://calibrecue.com/api";

const useAuthentication = () => {
  // const handleVerifyPhoneNumber = async (payload) => {
  //   try {
  //     let response = await axios.post(
  //       GetBaseApiUrl("Accounts/AuthenticateMobileNumber"),
  //       payload
  //     );
  //     if (response.statusCode == 200) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   } catch (error) {
  //     //console.log(error)
  //   }
  // };

  const handleVerifyPhoneNumber = async (mobileNumber) => {
    try {
      let url = GetBaseApiUrl("Accounts/AuthenticateMobileNumber");
      const response = await axios.post(
        url,
        { ...mobileNumber }, // body
        { headers: { "Content-Type": "application/json" } }
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
  
  const handleVerifyOtp = async (payload) => {
    let response = await axios.post(GetBaseApiUrl("Accounts/"), payload);
    if (response.statusCode != 400) {
      return true;
    } else {
      return false;
    }
  };

  const handleGeneratePin = async (payload) => {
    let response = await axios.post(
      GetBaseApiUrl("Accounts/AuthenticateWithMobileNumber"),
      payload
    );
    if (response.data) {
      return response.data;
    } else {
      return false;
    }
  };

  // Email + Password login (endpoint name may vary on backend)
  const handleLoginWithEmailPassword = async (payload) => {
    try {
      const url = GetBaseApiUrl("Accounts/Login"); // Adjust if backend uses a different route
      const response = await axios.post(url, { ...payload }, {
        headers: { "Content-Type": "application/json" },
      });
      if (response?.data) return response.data;
      return false;
    } catch (error) {
      console.error("❌ Email login error:", error);
      throw error;
    }
  };

  const handleGetProfileData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const userXid = await AsyncStorage.getItem("userXid");
      let url = GetBaseApiUrl(`User/${userXid}`);
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`, // 👈 token here
        },
      });

      //console.log("✅ Success:", response?.data);

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

  return {
    handleVerifyPhoneNumber,
    handleVerifyOtp,
    handleGeneratePin,
    handleGetProfileData,
    handleLoginWithEmailPassword,
  };
};

export default useAuthentication;
