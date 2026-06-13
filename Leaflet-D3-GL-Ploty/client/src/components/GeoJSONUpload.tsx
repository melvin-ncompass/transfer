import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface GeoJSONUploadProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (tableName: string) => void;
}

const GeoJSONUpload = ({ open, onClose, onSuccess }: GeoJSONUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');

      // Auto-generate table name from filename
      const name = selectedFile.name
        .replace('.geojson', '')
        .replace('.json', '')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      setTableName(name);

      // Parse and preview GeoJSON
      try {
        const text = await selectedFile.text();
        const geoJson = JSON.parse(text);
        
        if (geoJson.type === 'FeatureCollection' && geoJson.features) {
          const firstFeature = geoJson.features[0];
          setPreview({
            featureCount: geoJson.features.length,
            geometryType: firstFeature?.geometry?.type || 'Unknown',
            properties: firstFeature?.properties ? Object.keys(firstFeature.properties) : [],
            sample: firstFeature,
          });
        } else {
          setError('Invalid GeoJSON: Must be a FeatureCollection');
        }
      } catch (err) {
        setError('Invalid JSON file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !tableName) {
      setError('Please select a file and provide a table name');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableName', tableName);

      const response = await axios.post(`${API_BASE_URL}/upload/geojson`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onSuccess(tableName);
        handleClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload GeoJSON file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTableName('');
    setError('');
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon />
          <Typography variant="h6">Upload GeoJSON File</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* File Upload */}
          <Box>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ height: 100, borderStyle: 'dashed' }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <UploadIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography>
                  {file ? file.name : 'Click to select GeoJSON file'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports .geojson or .json files
                </Typography>
              </Box>
              <input
                type="file"
                hidden
                accept=".geojson,.json,application/geo+json,application/json"
                onChange={handleFileChange}
              />
            </Button>
          </Box>

          {/* Table Name */}
          <TextField
            label="Table Name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            fullWidth
            required
            helperText="Name for the database table (lowercase, no spaces)"
          />

          {/* Preview */}
          {preview && (
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle2" gutterBottom>
                📊 Preview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Features:</strong> {preview.featureCount}
                </Typography>
                <Typography variant="body2">
                  <strong>Geometry Type:</strong> {preview.geometryType}
                </Typography>
                <Typography variant="body2">
                  <strong>Properties:</strong> {preview.properties.join(', ')}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Info Box */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Supported Geometry Types:</strong>
            </Typography>
            <Typography variant="caption">
              • Point • LineString • Polygon • MultiPoint • MultiLineString • MultiPolygon
            </Typography>
          </Alert>

          {/* Error */}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || !tableName || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeoJSONUpload;



