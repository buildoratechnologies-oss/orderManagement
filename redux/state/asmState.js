import { createSlice } from "@reduxjs/toolkit";

const asmSlice = createSlice({
  name: "asmSlice",
  initialState: {
    asmUserOverview: {},
  },
  reducers: {
    updateAsmOverView: (state, action) => {
        console.log(action.payload)
      state.asmUserOverview = action.payload;
    },
  },
});

export const { updateAsmOverView } = asmSlice.actions;
export default asmSlice.reducer;
