import { PayrollSetupDashboard } from './components/PeopleDashboard'
import { Box } from '@mui/material'

const DashboardView = () => {
  return (
    <Box
      sx={{
        
        height: "100%",
        overflow: "auto",
      }}
    >
      <PayrollSetupDashboard />
    </Box>
  )
}

export default DashboardView