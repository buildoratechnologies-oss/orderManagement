import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { GetBaseApiUrl } from "../../util/baseData";

// Helper function to get token
const getToken = async () => await AsyncStorage.getItem("token");
const baseQuery = fetchBaseQuery({
  baseUrl: "https://ams.calibrecue.com/api/",
  prepareHeaders: async (headers) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});
export const protectedApi = createApi({
  reducerPath: "protectedApi",
  baseQuery, // Replace with your API
  endpoints: (builder) => ({
    getClients: builder.query({
      query: async () => {
        const CBXID = await AsyncStorage.getItem("CBXID");
        const userXid = await AsyncStorage.getItem("userXid");
        return {
          url: `Client/GetAll/${CBXID}/${userXid}/-1`,
          method: "GET",
        };
      },
      providesTags: ["Clients"],
    }),

    getItemList: builder.query({
      query: async () => {
        const CBXID = await AsyncStorage.getItem("CBXID");
        const companyXid = await AsyncStorage.getItem("companyXid");
        return {
          url: `Item/GetItemsByCompanyBranch/${CBXID}/${companyXid}`,
          method: "GET",
        };
      },
      providesTags: ["Items"],
    }),

    getOrdersList: builder.query({
      query: async () => {
        const CBXID = await AsyncStorage.getItem("CBXID");
        return {
          url: `Invoice/GetInvoicesList/${CBXID}/5/-1`,
          method: "GET",
        };
      },
      providesTags: ["Orders"],
    }),

    getOrderDetails: builder.query({
      query: async (productId) => {
        return {
          url: `Invoice/${productId}/5/ADD`,
          method: "GET",
        };
      },
      providesTags: ["Orders"],
    }),

    //check-in-----out
    uploadCheckInImageInfo: builder.mutation({
      query: (newPost) => ({
        url: "AttendanceLog/InsertAttendanceImages",
        method: "POST",
        body: newPost,
      }),
    }),

    uploadMultipleFiles: builder.mutation({
      query: (formData) => ({
        url: "Upload/UploadMultiple",
        method: "POST",
        body: formData,
      }),
    }),

    // Day Summary
    getDaySummarryDetails: builder.query({
      query: (date) => `OrderReport/GetDaySummaryByDateAndUser${date}`
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetItemListQuery,
  useGetOrdersListQuery,
  useGetOrderDetailsQuery,

  //check-in-----out
  useUploadCheckInImageInfoMutation,
  useUploadMultipleFilesMutation,

  useGetDaySummarryDetailsQuery,
} = protectedApi;
