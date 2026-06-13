import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import GppBadOutlinedIcon from "@mui/icons-material/GppBadOutlined";

function AccessDeniedPage() {

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F7FB",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          p: 5,
          borderRadius: 4,
          border: "1px solid #E5E7EB",
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#FDECEC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <GppBadOutlinedIcon sx={{ color: "#EF4444", fontSize: 36 }} />
        </Box>

        {/* Error badge */}
        <Chip
          label="Error 403"
          sx={{
            mb: 2,
            backgroundColor: "#FDECEC",
            color: "#EF4444",
            fontWeight: 600,
          }}
        />

        {/* Title */}
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Access Denied
        </Typography>

        {/* Message */}
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", mb: 4 }}
        >
          Sorry, you don't have permission to access this page. This area is
          restricted to authorized users only.
        </Typography>

        {/* Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
          <Button
            variant="contained"
            startIcon={<HomeOutlinedIcon />}
            onClick={handleGoHome}
            sx={{
              backgroundColor: "#0F172A",
              "&:hover": { backgroundColor: "#020617" },
              px: 3,
            }}
          >
            Go to Home
          </Button>

          <Button
            variant="outlined"
            startIcon={<MailOutlineIcon />}
            sx={{
              px: 3,
              borderColor: "#D1D5DB",
            }}
          >
            Contact Support
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          If you believe this is an error, please contact your administrator.
        </Typography>
      </Paper>
    </Box>
  );
}

export default AccessDeniedPage;