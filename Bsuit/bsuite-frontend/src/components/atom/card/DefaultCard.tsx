import { Card, CardContent, CardHeader, type CardProps, Divider, useTheme } from "@mui/material";
import { type ReactNode } from "react";

interface CardAtomProps extends Partial<CardProps> {
  title?: string;
  subTitle?: string;
  action?: ReactNode;
  children: ReactNode;
  divider?: boolean;
}

export const AtomCard = ({
  title,
  subTitle,
  action,
  children,
  divider = false,
  sx,
  ...rest
}: CardAtomProps) => {
    const theme = useTheme();
  return (
    <Card
      elevation={1}
      sx={{
        color:"black",
        backgroundColor:"white",
        // borderRadius: "8px",
        ...sx,
      }}
      {...rest}
    >
      {(title || action) && (
        <>
          <CardHeader
            title={title}
            subheader={subTitle}
            action={action}
            color="white"
            sx={{
              "& .MuiCardHeader-title": {
                fontSize: "1rem",
                fontWeight: 600,
                color:"black"
              },
              "& .MuiCardHeader-subheader": {
                fontSize: "0.875rem",
              },
              pb: divider ? 1 : 2,
            }}
          />
          {divider && <Divider />}
        </>
      )}

      <CardContent>{children}</CardContent>
    </Card>
  );
};
