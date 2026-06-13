import { Box, Card, CardContent, Typography, Chip, Stack } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import type { DataRow } from "./UploadCSV";

function CSVStats({ data }: { data: DataRow[] }) {
  const rowsUploaded = data.length;

  return (
    <Card
      sx={{
        border: "2px solid",
        borderColor: "success.light",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? "rgba(76, 175, 80, 0.05)"
            : "rgba(76, 175, 80, 0.1)",
      }}
    >
      <CardContent sx={{ pt: 3 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <CheckCircle
            sx={{
              width: 24,
              height: 24,
              color: "success.main",
              flexShrink: 0,
              mt: 0.5,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                color: "success.dark",
                fontWeight: 600,
              }}
            >
              Data uploaded successfully
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  color: "success.dark",
                  fontWeight: 500,
                }}
              >
                Number of rows uploaded:
              </Typography>
              <Chip
                label={rowsUploaded.toLocaleString()}
                size="small"
                color="success"
                variant="filled"
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                      ? "success.light"
                      : "rgba(76, 175, 80, 0.3)",
                  color: "success.dark",
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default CSVStats;
