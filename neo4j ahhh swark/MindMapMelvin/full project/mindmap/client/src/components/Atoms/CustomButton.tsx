import React from "react";
import { Button, type ButtonProps } from "@mui/material";

interface CustomButtonProps extends ButtonProps {
  label: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ label,onClick, ...props }) => {
  return (
    <Button
      {...props}
      sx={{
        borderRadius: 2,
        textTransform: "none",
        fontWeight: "bold",
        px: 3,
        py: 1,
        ...props.sx, 
      }}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

export default CustomButton;
