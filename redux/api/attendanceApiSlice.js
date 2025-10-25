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
export const attendanceApiSlice = createApi({
  reducerPath: "attendanceApiSlice",
  baseQuery,
  tagTypes: ["getAllAttendance"],
  endpoints: (builder) => ({
    getAllAttendance: builder.query({
      query: ({ userXid, date }) =>
        date
          ? `UserAttendance/GetUserAttendanceByUserAndDate/${userXid}/${date}`
          : `UserAttendance/GetAllByUserID/${userXid ?? 20}`,
      providesTags: ["getAllAttendance"],
    }),
    insertUserAttendanceImages: builder.mutation({
      query: (payload) => ({
        url: "UserAttendance/InsertUserAttendanceImages",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["getAllAttendance"],
    }),
  }),
});

// Export hooks for usage in components
export const { useGetAllAttendanceQuery, useInsertUserAttendanceImagesMutation } =
  attendanceApiSlice;
