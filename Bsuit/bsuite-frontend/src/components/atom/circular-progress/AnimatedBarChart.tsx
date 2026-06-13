import { Box, useTheme } from "@mui/material";
import { motion } from "framer-motion";


const bars = [0, 1, 2, 3, 4];

export function AnalyticsBarLoader() {
    const theme = useTheme();
  return (
    <Box
      display="flex"
      alignItems="flex-end"
      gap={1}
      height={96}
      aria-label="analytics-loading"
    >
      {bars.map((index) => (
        <Box
          key={index}
          component={motion.div}
          sx={{
            width: 32,
            borderRadius: "6px 6px 0 0",
            background: `linear-gradient(to top,${theme.palette.primary.main} , ${theme.palette.primary.light})`,
          }}
          initial={{ height: 0 }}
          animate={{
            height: ["20%", "80%", "40%", "90%", "60%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </Box>
  );
}
