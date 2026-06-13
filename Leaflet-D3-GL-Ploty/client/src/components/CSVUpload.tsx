import { useState, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface CSVUploadProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (tableName: string) => void;
}

const CSVUpload = ({ open, onClose, onSuccess }: CSVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [latColumn, setLatColumn] = useState('');
  const [lngColumn, setLngColumn] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess(false);

    // Auto-generate table name from filename
    const name = selectedFile.name
      .replace('.csv', '')
      .replace(/[^a-z0-9_]/gi, '_')
      .toLowerCase();
    setTableName(name);

    // Preview CSV
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      setColumns(headers);

      // Auto-detect lat/lng columns
      const detectedLat = headers.find(h => /^(lat|latitude|y)$/i.test(h.trim()));
      const detectedLng = headers.find(h => /^(lon|lng|long|longitude|x)$/i.test(h.trim()));
      
      if (detectedLat) setLatColumn(detectedLat);
      if (detectedLng) setLngColumn(detectedLng);

      // Preview first 5 rows
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i]?.trim() || '';
        });
        return row;
      });
      setPreview(previewData);
    } catch (err) {
      setError('Failed to parse CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file || !tableName) {
      setError('Please select a file and enter a table name');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableName', tableName);
      if (latColumn) formData.append('latColumn', latColumn);
      if (lngColumn) formData.append('lngColumn', lngColumn);

      const response = await axios.post(`${API_BASE_URL}/upload/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setUploadInfo(response.data);
      
      if (onSuccess) {
        onSuccess(tableName);
      }

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTableName('');
    setPreview([]);
    setColumns([]);
    setLatColumn('');
    setLngColumn('');
    setError('');
    setSuccess(false);
    setUploadInfo(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon />
          <Typography variant="h6">Upload CSV File</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* File Selection */}
        <Box sx={{ mb: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Select CSV File
          </Button>
          {file && (
            <Chip
              label={file.name}
              onDelete={() => setFile(null)}
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        {/* Table Name */}
        {file && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Table Name"
              value={tableName}
              onChange={(e) => setTableName(e.target.value.toLowerCase())}
              helperText="Name of the database table to create"
              disabled={uploading}
            />
          </Box>
        )}

        {/* Column Selection for Geometry */}
        {columns.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Geometry Columns (Optional)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Latitude Column</InputLabel>
                <Select
                  value={latColumn}
                  label="Latitude Column"
                  onChange={(e) => setLatColumn(e.target.value)}
                  disabled={uploading}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {columns.map((col) => (
                    <MenuItem key={col} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Longitude Column</InputLabel>
                <Select
                  value={lngColumn}
                  label="Longitude Column"
                  onChange={(e) => setLngColumn(e.target.value)}
                  disabled={uploading}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {columns.map((col) => (
                    <MenuItem key={col} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {latColumn && lngColumn && (
              <Alert severity="info" sx={{ mt: 1 }}>
                PostGIS geometry column will be created automatically
              </Alert>
            )}
          </Box>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Preview (First 5 rows)
            </Typography>
            <Box
              sx={{
                maxHeight: 200,
                overflow: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1,
                backgroundColor: '#f5f5f5',
              }}
            >
              <pre style={{ margin: 0, fontSize: '12px' }}>
                {JSON.stringify(preview, null, 2)}
              </pre>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {columns.length} columns detected
            </Typography>
          </Box>
        )}

        {/* Progress */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Uploading and processing CSV...
            </Typography>
          </Box>
        )}

        {/* Success Message */}
        {success && uploadInfo && (
          <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2">
              Successfully uploaded {uploadInfo.rowCount} rows to table "{uploadInfo.tableName}"
            </Typography>
            {uploadInfo.hasGeometry && (
              <Typography variant="caption">
                PostGIS geometry created from {uploadInfo.geometryColumns.lat} and{' '}
                {uploadInfo.geometryColumns.lng}
              </Typography>
            )}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
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

export default CSVUpload;

