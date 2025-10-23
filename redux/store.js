import { configureStore } from "@reduxjs/toolkit";
import { doaApiSlice } from "./api/doaApiSlice";
import { protectedApi } from "./api/protectedApiSlice";
import { asmApiSlice } from "./api/asmApiSlice";
import { attendanceApiSlice } from "./api/attendanceApiSlice";

export const store = configureStore({
  reducer: {
    [doaApiSlice.reducerPath]: doaApiSlice.reducer,
    [protectedApi.reducerPath]: protectedApi.reducer,
    [asmApiSlice.reducerPath]: asmApiSlice.reducer,
    [attendanceApiSlice.reducerPath]: attendanceApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(doaApiSlice.middleware)
      .concat(protectedApi.middleware)
      .concat(asmApiSlice.middleware)
      .concat(attendanceApiSlice.middleware),
});
