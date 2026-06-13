import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { PrimaryButton } from "../components/atom/button/PrimaryButton";
import { SecondaryButton } from "../components/atom/button/SecondaryButton";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Header from "../components/layout/Header";

export default function ErrorPage() {
  const error = useRouteError();
  const theme = useTheme();
  const isDevelopment = import.meta.env.MODE === "development";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  let errorMessage: string;
  let errorDetails: string = "";

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || "Unknown error";
    if (error.data?.message) {
      errorDetails = error.data.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || "";
  } else {
    errorMessage = "An unexpected error occurred";
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.primary.light}20 100%)`,
        padding: theme.spacing(2),
      }}
    >
      <Header />
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            padding: theme.spacing(4),
            borderRadius: theme.spacing(2),
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <Box sx={{ marginBottom: theme.spacing(3) }}>
            <ErrorOutlineIcon
              sx={{
                fontSize: 80,
                color: theme.palette.error.main,
              }}
            />
          </Box>

          <Typography
            variant="h5"
          >
            Oops! Something went wrong
          </Typography>

          <Typography
            variant="body1"
            sx={{
              marginBottom: theme.spacing(2),
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            We're sorry for the inconvenience. Please try one of the options
            below.
          </Typography>

        
          {isDevelopment && (
            <Paper
              variant="outlined"
              sx={{
                backgroundColor: theme.palette.grey[50],
                padding: theme.spacing(2),
                marginBottom: theme.spacing(3),
                textAlign: "left",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  marginBottom: theme.spacing(1),
                }}
              >
                Error Message:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  marginBottom: theme.spacing(2),
                  wordBreak: "break-word",
                  fontFamily: 'Monaco, "Courier New", monospace',
                  whiteSpace: "pre-wrap",
                }}
              >
                {errorMessage}
              </Typography>

              
            </Paper>
          )}

          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            sx={{
              marginBottom: theme.spacing(3),
            }}
          >
            <Box sx={{ flex: 1 }}>
              <PrimaryButton
                onClick={() => window.history.back()}
                fullWidth
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Go Back
              </PrimaryButton>
            </Box>
            <Box sx={{ flex: 1 }}>
              <SecondaryButton
                onClick={() => (window.location.href = "/profile")}
                fullWidth
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Go Home
              </SecondaryButton>
            </Box>
          </Stack>
          
          <Box
            sx={{
              paddingTop: theme.spacing(2),
              borderTop: `1px solid ${theme.palette.divider}`,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.disabled,
                display: "block",
                marginBottom: theme.spacing(0.5),
              }}
            >
              Error ID: {new Date().getTime()}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.disabled,
              }}
            >
              If the problem persists, please contact support.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
