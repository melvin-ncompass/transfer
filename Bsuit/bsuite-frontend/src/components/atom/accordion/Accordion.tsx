import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Checkbox } from "../check-box";
import type { AccordionElementProps } from "../../../types/types";

export function AccordionElement({
  title,
  open,
  onChange,
  showCheckbox = false,
  checkboxProps,
  children,
  headerActions,
}: AccordionElementProps) {
  return (
    <Accordion
      expanded={open}
      onChange={onChange}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        "&.Mui-expanded": {
          margin: 0,
        },

        "&:not(.Mui-expanded)": {
          margin: 0,
        },
        "&:before": { display: "none" },
        ":first-of-type": {
          borderRadius: 2,
        },
        ":last-of-type": {
          borderRadius: 2,
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <IconButton>
            <ExpandMoreIcon />
          </IconButton>
        }
        component='div'
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          "& .MuiAccordionSummary-content": {
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {showCheckbox && checkboxProps && <Checkbox {...checkboxProps} />}
            <Typography fontWeight={600} sx={{ ml: showCheckbox ? 1 : 0 }}>
              {title}
            </Typography>
          </Box>
          {headerActions}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Box sx={{ p: 2, pt: 0 }}>{children}</Box>
      </AccordionDetails>
    </Accordion>
  );
}
