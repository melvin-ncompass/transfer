import { Box, Button } from "@mui/material";

interface StepLayoutProps {
  content: React.ReactNode;
  isLoading?: boolean;
  hasResponse?: boolean;
  onAction?: () => void;
}

const StepLayout: React.FC<StepLayoutProps> = ({
  content,
  isLoading = false,
  hasResponse = false,
  onAction,
}) => {
  const buttonLabel = hasResponse ? "Next Step" : "Initiate";

  return (
    <Box
      sx={{
        minHeight: "55vh",
        pt: 5,
        pb: 8,
        textAlign:"right"
      }}
    >
      
        <Box sx={{bgcolor:"#0D1117"}}>
          <Button
          variant="contained"
          sx={{
            bgcolor:  "#10B981" ,
            "&.Mui-disabled": {
              bgcolor: "#343942",
              color: "#fff",
              width: "120px",
            },
          }}
          disabled={isLoading}
          onClick={onAction}
        >
          {buttonLabel}
        </Button>
        </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          // overflow:"hidden"
        }}
      >
        <Box
          sx={{
            width: "80%",
            p: 2,
            textAlign: "left",
            borderRadius: 2,
            bgcolor: "transparent",
          }}
        >
          {content}
        </Box>
      </Box>
    </Box>
  );
};

export default StepLayout;
