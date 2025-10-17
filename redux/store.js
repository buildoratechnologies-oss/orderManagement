import { configureStore } from "@reduxjs/toolkit";
import { doaApiSlice } from "./api/doaApiSlice";
import { protectedApi } from "./api/protectedApiSlice";

export const store = configureStore({
  reducer: {
    [doaApiSlice.reducerPath]: doaApiSlice.reducer,
    [protectedApi.reducerPath]: protectedApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(doaApiSlice.middleware)
      .concat(protectedApi.middleware),
});
