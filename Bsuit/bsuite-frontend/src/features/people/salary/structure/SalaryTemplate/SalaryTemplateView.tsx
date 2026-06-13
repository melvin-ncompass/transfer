import { Box } from "@mui/system";
import SalaryTemplateTable from "./components/SalaryTemplateTable";
import { useImperativeHandle, forwardRef } from "react";
import { useNavigate } from "react-router-dom";

// -----
// Types
// -----
export type SalaryTemplateViewRef = {
  openAddModal: () => void;
};

const SalaryTemplateView = forwardRef<SalaryTemplateViewRef>((_, ref) => {
  // -----
  // Hooks
  // -----
  const navigate = useNavigate();

  // Function to Navigate on Add Click
  useImperativeHandle(ref, () => ({
    openAddModal: () => navigate("/people/salary/template/add"),
  }));

  return (
    <Box sx={{ height: "100%", pb: 2 }}>
      {/* Table */}
      <SalaryTemplateTable />
    </Box>
  );
});

export default SalaryTemplateView;
