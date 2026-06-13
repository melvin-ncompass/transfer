import { Stack } from "@mui/system";
import Dashboard from "../components/Dashboard";
import ReportsList from "../components/ReportsList";
import { useGetDashboardQuery } from "../api/insights.api";

function ReportsHomePage() {
  const { data } = useGetDashboardQuery();
  return (
    <Stack gap={2}>
      <>
        {data?.data?.length > 0 && <Dashboard data={data} />}
        <ReportsList />
      </>
    </Stack>
  );
}

export default ReportsHomePage;
