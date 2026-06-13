import { Box, Card, CircularProgress, IconButton, Stack, Typography, useTheme, useMediaQuery } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate, useParams } from "react-router-dom";
import AddEmployeePage from "../components/AddEmployeePage";
import { useGetEmployeeQuery } from "../api/directory.api";

export default function EditEmployeeLayoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const showRightPanel = useMediaQuery(theme.breakpoints.up("lg"));

  const employeeId = id ? parseInt(id, 10) : NaN;
  const { data: response, isLoading, isError } = useGetEmployeeQuery(employeeId, {
    skip: !id || !Number.isFinite(employeeId),
    /** Always refetch on entering edit — e.g. `existsInPayRun` changes after a pay run; cache would stay stale otherwise. */
    refetchOnMountOrArgChange: true,
  });
  const employee = response?.data;

  if (!id || !Number.isFinite(employeeId)) {
    return (
      <Box p={3}>
        <Typography color="error">Invalid employee ID</Typography>
      </Box>
    );
  }

  if (isError || (!isLoading && !employee)) {
    return (
      <Box p={3}>
        <Typography color="error">Employee not found</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          width: "100%",
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

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
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Edit Employee
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Update employee record
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
              <Box sx={{ flex: 1, overflow: "auto", p: 2, minWidth: 0 }}>
                {employee && (
                  <AddEmployeePage
                    showTitle={false}
                    initialData={employee}
                    isEditMode
                  />
                )}
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
                        What you can edit
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      You can update department, designation, payroll and attendance settings, and contact details. First name, work email, employee type, employee ID and shift type cannot be changed.
                    </Typography>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <PersonAddIcon sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }} />
                        <Box>
                          <Typography variant="caption" fontWeight={600} display="block">
                            Basic details
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Middle/last name, gender, date of joining, department & designation, reporting manager.
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <AssignmentIcon sx={{ color: "primary.main", fontSize: 20, mt: 0.25 }} />
                        <Box>
                          <Typography variant="caption" fontWeight={600} display="block">
                            Payroll & attendance
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Salary template, PF, probation, week-off, leave & holiday plans (shift is locked).
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Box>
      </Card>
    </Box>
  );
}
