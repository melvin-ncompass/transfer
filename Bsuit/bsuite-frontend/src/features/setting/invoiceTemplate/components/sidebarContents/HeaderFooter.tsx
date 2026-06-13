import type React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  MenuItem,
  Select,                                                                                                                                                   
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import HeaderEditor from "./HeaderEditor";
import { useDispatch, useSelector } from "react-redux";
import { setPageChecked, setPageValue } from "../../slice/pageSlice";
import type { AppDispatch, RootState } from "../../../../../store/store";

//  Convert backend format → dropdown value
const getPageTypeFromFormat = (format: string | null) => {
  if (!format) return "1";

  if (format.includes("of")) return "1"; // Page X of Y
  if (format.includes("/")) return "3"; // X / Y
  if (format.includes("INV")) return "4"; // Invoice format
  if (format.startsWith("Page")) return "2"; // Page X

  return "1";
};

const HeaderAndFooter: React.FC = () => {
  const [open, setOpen] = useState(false);

  const { pageNoX, pageNoY, pageChecked, pageCurrentFormat } = useSelector(
    (state: RootState) => state.invoice.pageSetUp,
  );

  const dispatch: AppDispatch = useDispatch();

  const handlePage = (e: SelectChangeEvent) => {
    const type = e.target.value as "1" | "2" | "3" | "4";
    let format = "";

    switch (type) {
      case "1":
        format = `Page ${pageNoX} of ${pageNoY}`;
        break;
      case "2":
        format = `Page ${pageNoX}`;
        break;
      case "3":
        format = `${pageNoX} / ${pageNoY}`;
        break;
      case "4":
        format = `INV-17 - ${pageNoX} of ${pageNoY}`;
        break;
    }

    dispatch(setPageValue({ type, format }));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {open && <HeaderEditor setOpenDialouge={setOpen} initial="" />}

      {/* Header */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Header</Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Button onClick={() => setOpen(true)} variant="contained">
            Customize Your Header Content
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Footer */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Footer</Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Checkbox */}
            <Box>
              <Checkbox
                checked={pageChecked}
                onChange={() => dispatch(setPageChecked(!pageChecked))}
              />
              Page Number
            </Box>

            {/* Dropdown */}
            {pageChecked && (
              <Select
                value={getPageTypeFromFormat(pageCurrentFormat)}
                onChange={handlePage}
              >
                <MenuItem value={"1"}>Page X of Y (Recommended)</MenuItem>
                <MenuItem value={"2"}>Page X</MenuItem>
                <MenuItem value={"3"}>X / Y</MenuItem>
                <MenuItem value={"4"}>Invoice Number - Page X of Y</MenuItem>
              </Select>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default HeaderAndFooter;
