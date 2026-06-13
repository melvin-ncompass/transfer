import React from "react";
import { Box, Typography } from "@mui/material";

interface StatCardAtomProps {
    sx?:Object;
    width?:string;
  barColor?: string;
  children?: React.ReactNode; // RHS content
}

const StatCardAtom: React.FC<StatCardAtomProps> = ({
  barColor = "#9C27B0",
  children,
  width="100%",
  sx
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "#f5f5f5",
        borderRadius: 1,
        overflow: "hidden",
        width:width,
        ...sx
      }}
    >
      {/* Left colored bar */}
      <Box
        sx={{
          width: 6,
          backgroundColor: barColor,
          ml:2,
          my:1,
          borderRadius:1
        }}
      />

      {/* Content */}
      

        {/* Right section (children) */}
      {children}
    </Box>
  );
};

export default StatCardAtom;