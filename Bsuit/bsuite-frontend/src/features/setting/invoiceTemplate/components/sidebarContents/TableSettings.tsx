import { Box, Checkbox, Divider, TextField, Typography } from "@mui/material";
import type React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleCheckedTable,
  updateTableValue,
} from "../../slice/tableDetailsSlice";
import type { AppDispatch, RootState } from "../../../../../store/store";
import type { ITable } from "../../types/table";

const TableSettings: React.FC = () => {
  const {
    lineItemNo,
    item,
    quantity,
    rate,
    taxAmount, 
    amount,
  } = useSelector((state: RootState) => state.invoice.tableDetail);

  const dispatch: AppDispatch = useDispatch();
  const handleClick = (
    label: keyof ITable,
    _e: React.MouseEvent<HTMLButtonElement>
  ) => {
    dispatch(toggleCheckedTable(label));
  };

  const handleChange = (
    tableField: keyof ITable,
    propField: "width" | "label",
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    dispatch(
      updateTableValue({ tableField, propField, value: e.target.value })
    );
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography>Table Properties</Typography>
      <Divider />
      <Box sx={{ display: "flex", justifyContent: "space-around" }}>
        <Typography>FIELD</Typography>
        <Typography>WIDTH(%)</Typography>
        <Typography>LABEL</Typography>
      </Box>
      <Divider />
      <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
        {/* Line Item Number */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={lineItemNo.checked}
              onClick={(e) => handleClick("lineItemNo", e)}
            />
            <Typography>Line Item Number</Typography>
          </Box>
          <TextField
            value={lineItemNo.width}
            sx={{ flexBasis: "30%" }}
            size="small"
            onChange={(e) => handleChange("lineItemNo", "width", e)}
          />
          <TextField
            sx={{ flexBasis: "30%" }}
            value={lineItemNo.label}
            size="small"
            onChange={(e) => handleChange("lineItemNo", "label", e)}
          />
        </Box>

        {/* Item */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={item.checked}
              onClick={(e) => handleClick("item", e)}
            />
            <Typography>Item </Typography>
          </Box>
          <TextField
            value={item.width}
            onChange={(e) => handleChange("item", "width", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
          <TextField
            value={item.label}
            onChange={(e) => handleChange("item", "label", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
        </Box>

      

        {/* Quantity*/}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={quantity.checked}
              onClick={(e) => handleClick("quantity", e)}
            />
            <Typography>Quantity</Typography>
          </Box>
          <TextField
            value={quantity.width}
            onChange={(e) => handleChange("quantity", "width", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
          <TextField
            value={quantity.label}
            onChange={(e) => handleChange("quantity", "label", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
        </Box>

        {/* Rate */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={rate.checked}
              onClick={(e) => handleClick("rate", e)}
            />
            <Typography>Rate</Typography>
          </Box>
          <TextField
            value={rate.width}
            onChange={(e) => handleChange("rate", "width", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
          <TextField
            value={rate.label}
            onChange={(e) => handleChange("rate", "label", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
        </Box>

        {/* Tax */}
        {/* <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={taxPercentage.checked}
              onClick={(e) => handleClick("taxPercentage", e)}
            />
            <Typography>Tax (%)</Typography>
          </Box>
          <TextField
            value={taxPercentage.width}
            onChange={(e) => handleChange("taxPercentage", "width", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
          <TextField
            value={taxPercentage.label}
            onChange={(e) => handleChange("taxPercentage", "label", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
        </Box> */}

        {/* Tax Amount */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={taxAmount.checked}
              onClick={(e) => handleClick("taxAmount", e)}
            />
            <Typography>Tax Amount</Typography>
          </Box>
          <TextField
            value={taxAmount.width}
            onChange={(e) => handleChange("taxAmount", "width", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
          <TextField
            value={taxAmount.label}
            onChange={(e) => handleChange("taxAmount", "label", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
        </Box>

        {/* Discount */}
        {/* <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={discount.checked}
              onClick={(e) => handleClick("discount", e)}
            />
            <Typography>Discount</Typography>
          </Box>
          <TextField
            value={discount.width}
            onChange={(e) => handleChange("discount", "width", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
          <TextField
            value={discount.label}
            onChange={(e) => handleChange("discount", "label", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
        </Box> */}

        {/* Amount */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexBasis: "30%" }}>
            <Checkbox
              checked={amount.checked}
              onClick={(e) => handleClick("amount", e)}
            />
            <Typography>Amount</Typography>
          </Box>
          <TextField
            value={amount.width}
            onChange={(e) => handleChange("amount", "width", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
          <TextField
            value={amount.label}
            onChange={(e) => handleChange("amount", "label", e)}
            sx={{ flexBasis: "30%" }}
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default TableSettings;
