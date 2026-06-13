import { Box, Checkbox, TextField, Typography } from "@mui/material";
import type React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCheckedTotal } from "../../slice/totalSlice";
import type { AppDispatch, RootState } from "../../../../../store/store";
import type { ICheckedTotal } from "../../types/total";

const Total: React.FC = () => {
  const { checkedTotal, value } = useSelector(
    (state: RootState) => state.invoice.totalReducer
  );
  const dispatch: AppDispatch = useDispatch();

  const handleSelect = (label: keyof ICheckedTotal) => {
    dispatch(setCheckedTotal(label));
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.subTotal}
            onClick={() => handleSelect("subTotal")}
          />
          <Typography>Sub Total</Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.subTotal}
          value={value.subTotal}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.discount}
            onClick={() => handleSelect("discount")}
          />
          <Typography>Discount</Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.discount}
          value={value.discount}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.sampleTax}
            onClick={() => handleSelect("sampleTax")}
          />
          <Typography>Sample Tax (4.70%) </Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.sampleTax}
          value={value.sampleTax}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.tds}
            onClick={() => handleSelect("tds")}
          />
          <Typography>Tds (4.70%) </Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.tds}
          value={value.tds}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.total}
            onClick={() => handleSelect("total")}
          />
          <Typography>Total </Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.total}
          value={value.total}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.paymentMade}
            onClick={() => handleSelect("paymentMade")}
          />
          <Typography>Payment Made</Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.paymentMade}
          value={value.paymentMade}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.balanceDue}
            onClick={() => handleSelect("balanceDue")}
          />
          <Typography>Balance Due</Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.balanceDue}
          value={value.balanceDue}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Checkbox
            checked={checkedTotal.amountInWords}
            onClick={() => handleSelect("amountInWords")}
          />
          <Typography>Total In Words:</Typography>
        </Box>
        <TextField
          disabled={!checkedTotal.amountInWords}
          value="Indian Rupee Six Hundred Sixty-Two and Seventy-Five Paise Only"
          size="small"
        />
      </Box>
    </Box>
  );
};

export default Total;
