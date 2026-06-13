import { createSlice } from "@reduxjs/toolkit";

const initialState: ISideBarGeneral = {
  tempelateName: "",
  Margin: {
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
  },
};
export const SideBarGeneralSlice = createSlice({
  name: "sideBarGeneral",
  initialState,
  reducers: {
    setTemplateName: (state, action) => {
      state.tempelateName = action.payload;
    },
    setMargin: (
      state,
      action: { payload: { side: keyof ISideBarMargin; value: number } }
    ) => {
      const { side, value } = action.payload;
      state.Margin[side] = value;
    },
      prefillTemplateName: (state, action) => {
      state.tempelateName = action.payload;
    },
     resetTemplateName: () => initialState,
  },
});


export const {setTemplateName , setMargin , prefillTemplateName,resetTemplateName}  = SideBarGeneralSlice.actions ;

export default SideBarGeneralSlice.reducer ;