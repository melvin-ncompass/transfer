import { createSlice } from "@reduxjs/toolkit";

interface IinitialState {
  activeIndex: number;
}
const initialState: IinitialState = {
  activeIndex: -1,
};

export const sideIndexSlice = createSlice({
  name: "unitSlice",
  initialState,
  reducers: {
    setActive: (state, action) => {
      state.activeIndex = action.payload;
    },
  },
});

export const { setActive } = sideIndexSlice.actions;

export default sideIndexSlice.reducer;
