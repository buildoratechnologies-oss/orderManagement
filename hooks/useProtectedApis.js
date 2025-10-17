import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { GetBaseApiUrl } from "../util/baseData";

const useProtectedApis = () => {
  const handleGetClients = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const userXid = await AsyncStorage.getItem("userXid");
      const CBXID = await AsyncStorage.getItem("CBXID");
      // const branchDtls = JSON.parse(await AsyncStorage.getItem("branchDtls"));
      // let url = GetBaseApiUrl(`Client/GetAll/${CBXID}/${userXid}/-1`);
      let url = GetBaseApiUrl(`Client/GetClientWithPlannedForApp`);
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
  const handleGetOutlets = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const userXid = await AsyncStorage.getItem("userXid");
      const CBXID = await AsyncStorage.getItem("CBXID");
      // const branchDtls = JSON.parse(await AsyncStorage.getItem("branchDtls"));
      let url = GetBaseApiUrl(`Client/GetAll/${CBXID}/${userXid}/-1`);
      // let url = GetBaseApiUrl(`Client/GetClientWithPlannedForApp`);
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

  const handleGetItemList = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const companyXid = await AsyncStorage.getItem("companyXid");
      const CBXID = await AsyncStorage.getItem("CBXID");
      let url = GetBaseApiUrl(
        `Item/GetItemsByCompanyBranch/${CBXID}/${companyXid}`
      );
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

  const handleGetOrdersList = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const userXid = await AsyncStorage.getItem("userXid");
      const CBXID = await AsyncStorage.getItem("CBXID");
      let url = GetBaseApiUrl(`Invoice/GetInvoicesList/${CBXID}/5/-1`);
      // let url = GetBaseApiUrl(`Invoice/GetInvoicesList/${CBXID}/5/${userXid}`);

      // https://ams.calibrecue.com/api//10/5/-1
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

  const handleGetOrderDetails = async (productId) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let url = GetBaseApiUrl(`Invoice/${productId}/5/ADD`);

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      });

      //console.log("✅ Success:", response?.data);

      if (response?.data) {
        return response?.data[0];
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  const handleSubmitOrder = async (payload) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      let url = GetBaseApiUrl("Invoice");
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
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  return {
    handleGetClients,
    handleGetOutlets,
    handleGetItemList,
    handleSubmitOrder,
    handleGetOrdersList,
    handleGetOrderDetails,
  };
};

export default useProtectedApis;
