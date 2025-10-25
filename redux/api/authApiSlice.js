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
export const authApiSlice = createApi({
  reducerPath: "authApiSlice",
  baseQuery,
  tagTypes: [],
  endpoints: (builder) => ({
    emailLogIn: builder.mutation({
      query: (newPost) => ({
        url: "Accounts",
        method: "POST",
        body: newPost,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const { useEmailLogInMutation } = authApiSlice;
