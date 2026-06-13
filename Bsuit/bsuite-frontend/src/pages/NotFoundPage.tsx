import {
  Box,
  Typography,
  Button,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
function NotFoundPage() {
  const theme = useTheme();
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };
  return (
    <Box
      sx={{
        backgroundColor: "#F5F5F5",
        color: theme.palette.text.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        flexDirection: "column",
        textAlign: "center",
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 400, width: "100%", mb: 4 }}>
        {/* Laptop 404 */}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 400"
            fill="none"
            style={{ width: "100%", maxWidth: 400 }}
        >
            {/* Monitor frame */}
            <rect
                x="150"
                y="100"
                width="300"
                height="200"
                rx="16"
                fill={theme.palette.primary.light} // "#DFE9F7"
            />
            {/* Screen */}
            <rect
                x="170"
                y="120"
                width="260"
                height="140"
                rx="8"
                fill={theme.palette.primary.main} // "#1976D2"
                opacity={0.15}
            />
            {/* 404 text */}
            <text
                x="50%"
                y="200"
                textAnchor="middle"
                fontSize="80"
                fontWeight="700"
                fill={theme.palette.primary.main}
                dy=".35em"
            >
                404
            </text>
            {/* Base shadow */}
            <rect
                x="100"
                y="310"
                width="400"
                height="20"
                rx="10"
                fill={theme.palette.secondary.dark} // "#5c6167db"
                opacity={0.3}
            />
            {/* Keyboard / base detail */}
            <rect
                x="180"
                y="330"
                width="240"
                height="10"
                rx="5"
                fill={theme.palette.secondary.main} // "#9FA6B2"
                opacity={0.5}
            />
        </svg>
      </Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ maxWidth: 400, mb: 4, opacity: 0.8 }}>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Button
        variant="contained"
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        sx={{
          backgroundColor: theme.palette.primary.main,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        Go Back
      </Button>
    </Box>
  );
};
export default NotFoundPage;





