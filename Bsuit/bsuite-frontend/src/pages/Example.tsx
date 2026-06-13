// SamplePage.tsx
import { useState } from 'react';
import {
  Stack,
  Alert,
  AlertTitle,
  Avatar,
  Slider,
  Button,
  Typography,
  Box
} from '@mui/material';
import { DataGrid,type GridColDef } from '@mui/x-data-grid';

export default function SamplePage() {
  const [alertVisible, setAlertVisible] = useState(true);
  const [sliderValue, setSliderValue] = useState(30);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 }
  ];

  const rows = [
    { id: 1, name: 'Alice', status: 'high' },
    { id: 2, name: 'Bob', status: 'medium' },
    { id: 3, name: 'Charlie', status: 'low' }
  ];

  return (
    <Stack spacing={4} sx={{ p: 4 }}>
      
      {/* Alerts */}
      {alertVisible && (
        <Alert
          severity="info"
          onClose={() => setAlertVisible(false)}
        >
          <AlertTitle>Info</AlertTitle>
          This is a themed info alert.
        </Alert>
      )}
      <Button variant="contained" onClick={() => setAlertVisible(true)}>
        Show Alert
      </Button>

      {/* Avatar */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar>A</Avatar>
        <Avatar>B</Avatar>
        <Avatar>C</Avatar>
      </Stack>

      {/* Slider */}
      <Box sx={{ width: 300 }}>
        <Typography gutterBottom>Volume</Typography>
        <Slider
          value={sliderValue}
          onChange={(_, value) => setSliderValue(value as number)}
        />
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: 300, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
        />
      </Box>
    </Stack>
  );
}
