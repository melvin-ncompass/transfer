import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ICheckedTotal, ITotal } from "../types/total";
import { number } from "framer-motion";

const initialState: ITotal = {
  checkedTotal: {
    subTotal: true,
    discount: true,
    sampleTax: true,
    total: true,
    paymentMade: true,
    balanceDue: true,
    amountInWords: true,
    tds: true,
  },
  value: {
    subTotal: 630.0,
    discount: 0.0,
    sampleTax: 11.75,
    total: 662.75,
    paymentMade: 100.0,
    balanceDue: 562.75,
    tds: 5.0,
  },
};

export const TotalSlice = createSlice({
  name: "total",
  initialState,
  reducers: {
    //  Toggle checkbox
    setCheckedTotal: (state, action: PayloadAction<keyof ICheckedTotal>) => {
      const key = action.payload;
      state.checkedTotal[key] = !state.checkedTotal[key];
    },

    //  Prefill from API (ARRAY INPUT)
    prefillTotal: (
      state,
      action: PayloadAction<
        { key: keyof ICheckedTotal; value: number | null }[]
      >,
    ) => {
      const payload = action.payload;

      //  Convert array → map
      const payloadMap: Partial<Record<keyof ICheckedTotal, number | null>> =
        {};

      payload.forEach((item) => {
        payloadMap[item.key] = item.value;
      });

      //  Apply logic
      (Object.keys(state.checkedTotal) as (keyof ICheckedTotal)[]).forEach(
        (key) => {
          if (key in payloadMap) {
            //  Exists → checked true
            state.checkedTotal[key] = true;

            //  Update value (only if exists in value object & not null)
            if (key in state.value && payloadMap[key] !== null) {
              state.value[key as keyof typeof state.value] = payloadMap[
                key
              ] as number;
            }
          } else {
            //  Missing → unchecked
            state.checkedTotal[key] = false;

            //  Reset value
            if (key in state.value) {
              state.value[key as keyof typeof state.value] =
                initialState.value[key as keyof typeof state.value];
            }
          }
        },
      );
    },

   
    //  Reset
    resetTotal: () => initialState,
  },
});

export const { setCheckedTotal, prefillTotal, resetTotal } = TotalSlice.actions;

export default TotalSlice.reducer;
