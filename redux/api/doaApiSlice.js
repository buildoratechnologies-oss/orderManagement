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
export const doaApiSlice = createApi({
  reducerPath: "doaApiSlice",
  baseQuery,
  endpoints: (builder) => ({
    addDoaRequest: builder.mutation({
      query: (newPost) => ({
        url: "DOARequest",
        method: "POST",
        body: newPost,
      }),
    }),

    getPostById: builder.query({
      query: (id) => `posts/${id}`,
    }),

    getDoaList: builder.query({
      query: (CBXID = 123) => `DOARequest/GetAllByUserID/${CBXID}`,
    }),

    uploadDoaImageInfo: builder.mutation({
      query: (newPost) => ({
        url: "DOARequest/InsertDOARequestImages",
        method: "POST",
        body: newPost,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useAddDoaRequestMutation,
  useGetDoaListQuery,
  useGetPostByIdQuery,
  useUploadDoaImageInfoMutation,
} = doaApiSlice;
