import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ITableColumn {
  checked: boolean;
  width: number; // use number, not string
  label: string;
}

interface ITable {
  lineItemNo: ITableColumn;
  item: ITableColumn;

  quantity: ITableColumn;
  rate: ITableColumn;
  // discount: ITableColumn;
  // taxPercentage: ITableColumn;
  taxAmount: ITableColumn;
  amount: ITableColumn;
}

const initialState: ITable = {
  lineItemNo: { checked: true, width: 5, label: "#" },
  item: { checked: true, width: 20, label: "Item" },
  quantity: { checked: true, width: 10, label: "Qty" },
  rate: { checked: true, width: 10, label: "Rate" },
  // discount: { checked: true, width: 10, label: "Discount" },
  // taxPercentage: { checked: true, width: 7, label: "Tax%" },
  taxAmount: { checked: true, width: 8, label: "Tax" },
  amount: { checked: true, width: 10, label: "Amount" },
};

export const tableDetailsSlice = createSlice({
  name: "sideTable",
  initialState,
  reducers: {
    toggleCheckedTable: (state, action: PayloadAction<keyof ITable>) => {
      const key = action.payload;
      state[key].checked = !state[key].checked;
    },

    updateTableValue: (
      state,
      action: PayloadAction<{
        tableField: keyof ITable;
        propField: "width" | "label";
        value: string | number;
      }>,
    ) => {
      const { tableField, propField, value } = action.payload;

      if (propField === "width") {
        let newWidth = Number(value);

        // Restrict width between 1 and 100
        if (isNaN(newWidth) || newWidth < 1) newWidth = 0;
        if (newWidth > 100) newWidth = 100;

        state[tableField].width = newWidth;
      } else if (propField === "label") {
        state[tableField].label = String(value);
      }
    },
    prefillTableDetails(
      state,
      action: PayloadAction<
        Partial<Record<keyof ITable, { label: string; width: number }>>
      >,
    ) {
      const payload = action.payload;

      (Object.keys(state) as (keyof ITable)[]).forEach((key) => {
        if (key in payload) {
          //Key exists → checked true + update values
          state[key].checked = true;

          const column = payload[key];
          if (column) {
            state[key].label = column.label ?? state[key].label;
            state[key].width = column.width ?? state[key].width;
          }
        } else {
          // Key missing → unchecked + reset
          state[key] = {
            ...initialState[key],
            checked: false,
          };
        }
      });
    },
    resetTableDetails: () => initialState,
  },
});

export const {
  toggleCheckedTable,
  updateTableValue,
  prefillTableDetails,
  resetTableDetails,
} = tableDetailsSlice.actions;
export default tableDetailsSlice.reducer;
