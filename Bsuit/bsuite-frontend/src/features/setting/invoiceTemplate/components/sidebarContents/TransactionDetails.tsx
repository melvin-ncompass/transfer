import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import type React from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleChecked,
  updateTransactionValue,
} from "../../slice/transactionDetailsSlice";
import type { AppDispatch, RootState } from "../../../../../store/store";
import type {
  ICheckedTransactionDetails,
  ITransactionDetailsValue,
} from "../../types/transactionDetails";

const TransactionDetails: React.FC = () => {
  const { CheckedTransaction, TransactionValue } = useSelector(
    (state: RootState) => state.invoice.transactionDetails,
  );

  const dispatch: AppDispatch = useDispatch();

  const handleClick = (
    label: keyof ICheckedTransactionDetails,
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    dispatch(toggleChecked(label));
  };

  const handleChange = (
    field: keyof ITransactionDetailsValue,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    dispatch(updateTransactionValue({ field, value: e.target.value }));
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography variant="h6">Customer Details</Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box>
              <Checkbox
                checked={CheckedTransaction.billTo}
                onClick={(e) => handleClick("billTo", e)}
              />{" "}
              Bill To
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography variant="h6">Document Details</Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Show Document Title*/}
            <Box>
              <Checkbox
                checked={CheckedTransaction.title}
                onClick={(e) => handleClick("title", e)}
              />{" "}
              Show Document Title
              <TextField
                value={TransactionValue.title}
                onChange={(e) => handleChange("title", e)}
                size="small"
                sx={{ width: "200px" }}
              />
            </Box>

            <Divider />

            {/* Balance Due*/}
            <Typography variant="h6">Document Title</Typography>
            <Box>
              <Checkbox
                checked={CheckedTransaction.balanceDue}
                onClick={(e) => handleClick("balanceDue", e)}
              />{" "}
              Balance Due
            </Box>

            <Divider />

            {/*Document Information */}

            <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <Typography variant="h6">Document Information</Typography>
              <Box sx={{ display: "flex", gap: "20px" }}>
                <Box>
                  <Checkbox
                    checked={CheckedTransaction.numberField}
                    onClick={(e) => handleClick("numberField", e)}
                  />{" "}
                  Number Field
                </Box>
                <TextField
                  value={TransactionValue.numberField}
                  onChange={(e) => handleChange("numberField", e)}
                  size="small"
                  sx={{ width: "200px" }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: "20px" }}>
                <Box>
                  <Checkbox
                    checked={CheckedTransaction.dateField}
                    onClick={(e) => handleClick("dateField", e)}
                  />{" "}
                  Date Field
                </Box>
                <TextField
                  value={TransactionValue.dateField}
                  onChange={(e) => handleChange("dateField", e)}
                  size="small"
                  sx={{ width: "200px" }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: "20px" }}>
                <Box>
                  <Checkbox
                    checked={CheckedTransaction.serviceStart}
                    onClick={(e) => handleClick("serviceStart", e)}
                  />{" "}
                  Service Start
                </Box>
                <TextField
                  value={TransactionValue.serviceStart}
                  onChange={(e) => handleChange("serviceStart", e)}
                  size="small"
                  sx={{ width: "200px" }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: "20px" }}>
                <Box>
                  <Checkbox
                    checked={CheckedTransaction.dueDate}
                    onClick={(e) => handleClick("dueDate", e)}
                  />{" "}
                  Due Date
                </Box>
                <TextField
                  value={TransactionValue.dueDate}
                  onChange={(e) => handleChange("dueDate", e)}
                  size="small"
                  sx={{ width: "200px" }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: "20px" }}>
                <Box>
                  <Checkbox
                    checked={CheckedTransaction.serviceEnd}
                    onClick={(e) => handleClick("serviceEnd", e)}
                  />{" "}
                  Service End
                </Box>
                <TextField
                  value={TransactionValue.serviceEnd}
                  onChange={(e) => handleChange("serviceEnd", e)}
                  size="small"
                  sx={{ width: "180px" }}
                />
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default TransactionDetails;
