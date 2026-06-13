import { Box, Stack, Typography, useTheme } from "@mui/material";

function LinkExpiredPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: "#F5F5F5",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Stack
        spacing={3}
        alignItems="center"
        sx={{
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Clock/Timer Expired Illustration */}
        <Box sx={{ width: "100%", mb: 2 }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 400"
            fill="none"
            style={{ width: "100%", maxWidth: 400 }}
          >
            {/* Clock circle background */}
            <circle
              cx="300"
              cy="200"
              r="120"
              fill={theme.palette.primary.light}
              opacity={0.3}
            />
            <circle
              cx="300"
              cy="200"
              r="100"
              stroke={theme.palette.primary.main}
              strokeWidth="8"
              fill="white"
            />
            
            {/* Clock center dot */}
            <circle
              cx="300"
              cy="200"
              r="8"
              fill={theme.palette.primary.main}
            />
            
            {/* Hour hand pointing to 12 */}
            <line
              x1="300"
              y1="200"
              x2="300"
              y2="140"
              stroke={theme.palette.primary.main}
              strokeWidth="6"
              strokeLinecap="round"
            />
            
            {/* Minute hand pointing to 12 */}
            <line
              x1="300"
              y1="200"
              x2="300"
              y2="120"
              stroke={theme.palette.primary.main}
              strokeWidth="4"
              strokeLinecap="round"
            />
            
            {/* Clock markers at 12, 3, 6, 9 */}
            <circle cx="300" cy="110" r="5" fill={theme.palette.primary.main} />
            <circle cx="390" cy="200" r="5" fill={theme.palette.primary.main} />
            <circle cx="300" cy="290" r="5" fill={theme.palette.primary.main} />
            <circle cx="210" cy="200" r="5" fill={theme.palette.primary.main} />
            
            {/* X mark overlay to indicate expired */}
            <line
              x1="250"
              y1="150"
              x2="350"
              y2="250"
              stroke={theme.palette.error.main}
              strokeWidth="10"
              strokeLinecap="round"
              opacity={0.8}
            />
            <line
              x1="350"
              y1="150"
              x2="250"
              y2="250"
              stroke={theme.palette.error.main}
              strokeWidth="10"
              strokeLinecap="round"
              opacity={0.8}
            />
            
            {/* Shadow */}
            <ellipse
              cx="300"
              cy="340"
              rx="100"
              ry="15"
              fill={theme.palette.secondary.dark}
              opacity={0.2}
            />
          </svg>
        </Box>
        
        <Typography variant="h4" fontWeight={600} color="text.primary">
          Link Expired
        </Typography>
        
        <Stack spacing={1} sx={{ maxWidth: 400 }}>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            This link has expired and is no longer valid.
          </Typography>
          
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Please contact the administrator for further assistance.
          </Typography>
        </Stack>
        
      </Stack>
    </Box>
  );
}

export default LinkExpiredPage;