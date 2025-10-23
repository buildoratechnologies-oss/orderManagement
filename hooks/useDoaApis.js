import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetBaseApiUrl } from "../util/baseData";
import axios from "axios";

const useDoaApis = () => {
  const handleSubmitDOA = async (payload) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let url = GetBaseApiUrl("DOARequest");
      const response = await axios.post(
        url,
        { ...payload }, // body
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      //console.log("✅ Success:", response?.data);
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

  const handleGetDOAList = async (userXidOverride = null) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      // Default to current user if override not provided
      let userXid = userXidOverride;
      if (userXid == null) {
        const storedUser = await AsyncStorage.getItem("userXid");
        userXid = storedUser ?? 123;
      }
      let url = GetBaseApiUrl(`DOARequest/GetAllByUserID/${userXid}`);

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
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
  return { handleSubmitDOA, handleGetDOAList };
};

export default useDoaApis;
