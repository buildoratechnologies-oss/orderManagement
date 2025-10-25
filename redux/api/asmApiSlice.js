import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Base query with token injection
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

// Define your API
export const asmApiSlice = createApi({
  reducerPath: "asmApiSlice",
  baseQuery,
  tagTypes: ["Team", "Orders"],
  endpoints: (builder) => ({
    getMyTeam: builder.query({
      query: () => `User/GetUsersByReportingManager`,
      providesTags: ["Team"],
    }),

    getAllOrders: builder.query({
      query: () => `Invoice/GetAllInvoices`,
      providesTags: ["Orders"],
    }),

    getAsmDashboardOverview: builder.query({
      query: () => `ASMDashboardReport/GetASMDashboard`,
      providesTags: ["getAsmDashboardOverview"],
    }),

    getUserOverviewById: builder.query({
      query: (id) => `ASMDashboardReport/GetUserOverViewByUserIDForASM/${id}`,
      providesTags: ["getUserOverviewById"],
    }),

    getUserOverview: builder.query({
      query: (id) => `ASMDashboardReport/GetUsersOverViewByASM`,
      providesTags: ["getUserOverview"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetMyTeamQuery,
  useGetAllOrdersQuery,
  useGetAsmDashboardOverviewQuery,
  useGetUserOverviewByIdQuery,
  useGetUserOverviewQuery
} = asmApiSlice;
