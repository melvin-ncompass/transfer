import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  InputLabel,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { setMargin, setTemplateName } from "../../slice/sideBarGeneralSlice";
import type { AppDispatch, RootState } from "../../../../../store/store";

const General: React.FC<{ active?: boolean }> = () => {
  const [expanded, setExpanded] = useState(true);
  const { tempelateName, Margin } = useSelector(
    (state: RootState) => state.invoice.sideGeneral
  );
  const dispatch: AppDispatch = useDispatch();

  const handleMargin = (
    side: keyof typeof Margin,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    dispatch(setMargin({ side, value: Number(e.target.value) }));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        p: 1,
      }}
    >
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded((prev) => !prev)}
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography variant="h6">Template Properties</Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flexGrow: 1,
            overflowY: "auto",
          }}
        >
          <Box>
            <InputLabel required sx={{ color: "error.main", mb: 1 }}>
              Template Name
            </InputLabel>
            <TextField
              sx={{ width: "100%" }}
              variant="outlined"
              required
              value={tempelateName}
              onChange={(e) => dispatch(setTemplateName(e.target.value))}
            />
          </Box>

          {/* <Box>
            <Typography sx={{ mb: 1 }}>Margins (in inches)</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {(["top", "bottom", "left", "right"] as const).map((side) => (
                <Box
                  key={side}
                  sx={{ display: "flex", flexDirection: "column" }}
                >
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {side.charAt(0).toUpperCase() + side.slice(1)}
                  </Typography>
                  <TextField
                    value={Margin[side]}
                    onChange={(e) => handleMargin(side, e)}
                    size="small"
                  />
                </Box>
              ))}
            </Box>
          </Box> */}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default General;
