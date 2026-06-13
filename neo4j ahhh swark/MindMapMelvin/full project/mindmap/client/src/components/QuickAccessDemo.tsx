import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Rocket } from '@mui/icons-material';

const QuickAccessDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      zIndex: 1000,
      bgcolor: 'rgba(255,255,255,0.9)',
      p: 1,
      borderRadius: 2,
      boxShadow: 2
    }}>
      <Typography variant="caption" display="block" sx={{ mb: 1, color: '#666' }}>
        🚀 New Developer?
      </Typography>
      <Button
        variant="contained"
        size="small"
        startIcon={<Rocket />}
        onClick={() => navigate('/workflow')}
        sx={{ 
          bgcolor: '#4CAF50',
          '&:hover': { bgcolor: '#45a049' },
          fontSize: '0.75rem'
        }}
      >
        View Onboarding Workflow
      </Button>
    </Box>
  );
};

export default QuickAccessDemo;