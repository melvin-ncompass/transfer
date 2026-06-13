import { Box, Card, CardContent, Typography, Chip, Stack } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import type { DataRow } from "./UploadCSV";

function CSVStats({ data }: { data: DataRow[] }) {
  const rowsUploaded = data.length;

  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "success.main",
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? "success.light"
            : "rgba(25, 103, 210, 0.08)",
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
                color: "success.main",
                fontWeight: 600,
              }}
            >
              Data Uploaded Successfully
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  color: "success.main",
                  fontWeight: 500,
                }}
              >
                Total Rows:
              </Typography>
              <Chip
                label={rowsUploaded.toLocaleString()}
                size="small"
                color="primary"
                variant="filled"
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                      ? "success.light"
                      : "rgba(25, 103, 210, 0.3)",
                  color: "success.main",
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
