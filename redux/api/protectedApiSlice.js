import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const customBaseQuery = async (args, api, extraOptions) => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: "https://ams.calibrecue.com/api/",
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  });

  return rawBaseQuery(args, api, extraOptions);
};

export const protectedApi = createApi({
  reducerPath: "protectedApi",
  baseQuery: customBaseQuery,
  endpoints: (builder) => ({
    getClientsWithPlanned: builder.query({
      query: () => 
        `Client/GetClientWithPlannedForApp`,
      providesTags: ["getClientsWithPlanned"],
    }),
    getClients: builder.query({
      query: ({ CBXID, userXid }) => 
        `Client/GetAll/${CBXID}/${userXid}/-1`,
      providesTags: ["Clients"],
    }),

    getItemList: builder.query({
      // Retrieve AsyncStorage values before calling hook
      async queryFn(_, _queryApi, _extraOptions, fetchWithBQ) {
        const CBXID = await AsyncStorage.getItem("CBXID");
        const companyXid = await AsyncStorage.getItem("companyXid");

        return fetchWithBQ(`Item/GetItemsByCompanyBranch/${CBXID}/${companyXid}`);
      },
      providesTags: ["Items"],
    }),

    getOrdersList: builder.query({
      query: (CBXID) => `Invoice/GetInvoicesList/${CBXID}/5/-1`,
    }),

    getOrderDetails: builder.query({
      query: (productId) => `Invoice/${productId}/5/ADD`,
      providesTags: ["Orders"],
    }),

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

    getDaySummarryDetails: builder.query({
      query: (date) => `OrderReport/GetDaySummaryByDateAndUser${date}`,
    }),
  }),
});

export const {
  useGetClientsWithPlannedQuery,
  useGetClientsQuery,
  useGetItemListQuery,
  useGetOrdersListQuery,
  useGetOrderDetailsQuery,
  useUploadCheckInImageInfoMutation,
  useUploadMultipleFilesMutation,
  useGetDaySummarryDetailsQuery,
} = protectedApi;
