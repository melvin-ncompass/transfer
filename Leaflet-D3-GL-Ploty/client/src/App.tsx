import { Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import './styles/global.css';

function App() {
  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Dashboard />
    </Box>
  );
}

export default App;

