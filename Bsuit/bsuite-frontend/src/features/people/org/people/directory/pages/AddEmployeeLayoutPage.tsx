import { Box, Card, IconButton, Stack, Typography, useTheme, useMediaQuery } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";
import AddEmployeePage from "../components/AddEmployeePage";

export default function AddEmployeeLayoutPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const showRightPanel = useMediaQuery(theme.breakpoints.up("lg"));

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Card
        variant="outlined"
        sx={{
          boxShadow: 2,
          flexGrow: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2.5,
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{
                bgcolor: "white",
                border: "1px solid",
                borderColor: "grey.300",
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box sx={{ display: "flex", justifyContent: "space-between", flexGrow: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Add Employee
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Create a new employee record
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          <Box sx={{ flex: 1, overflow: "auto", p: 2, minWidth: 0 }}>
            <AddEmployeePage showTitle={false} />
          </Box>
          {showRightPanel && (
            <Box
              sx={{
                width: 320,
                flexShrink: 0,
                borderLeft: "1px solid",
                borderColor: "divider",
                bgcolor: "grey.50",
                p: 2.5,
                overflow: "auto",
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <InfoOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                    What you&apos;ll need
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Have the following ready before you start to speed up the process.
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <PersonAddIcon sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="caption" fontWeight={600} display="block">
                        Basic details
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Name, work email, employee ID, date of joining, department & designation.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <AssignmentIcon sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="caption" fontWeight={600} display="block">
                        Optional (Step 2)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Payroll (salary template, tax config), attendance (shift, week-off, leave & holiday plans), and contact details.
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  You can edit most settings later from the employee profile.
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
