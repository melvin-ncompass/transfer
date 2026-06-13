import React from "react";
import { Button, type ButtonProps } from "@mui/material";

interface CustomButtonProps extends ButtonProps {
  label: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ label, ...props }) => {
  return (
    <Button
      {...props}
      sx={{
        borderRadius: 2,
        textTransform: "none",
        fontWeight: "bold",
        px: 3,
        py: 1,
        ...props.sx, // allow overrides
      }}
    >
      {label}
    </Button>
  );
};

export default CustomButton;
