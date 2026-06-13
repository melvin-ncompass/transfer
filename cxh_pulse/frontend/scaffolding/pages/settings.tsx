import { useEffect, useState, useRef } from 'react';
import { CONFIG } from '../../src/config-global';
import { Box, Card, Stack, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, Divider, IconButton, InputAdornment } from '@mui/material';
import { ConfirmDialog } from '../../src/components/custom-dialog';
import { useSnackbar } from 'notistack';
import { DashboardContent } from '../../src/layouts/dashboard';
import { PrimaryButton, OutlinedButton } from '../../src/components/buttons';
import { Iconify } from '../../src/components/iconify';
import { ProgressSnackbar } from '../../src/components/snackbar';
import { useRouter } from '../../src/routes/hooks';
import { useAppDispatch } from '../../src/store/hooks';
import { useChangePasswordMutation, useGetSettingsQuery, useGetStoragePathQuery, useUpdateSettingsMutation, useUpdateStoragePathMutation, useGetBrandingQuery, useUpdateBrandingMutation } from '../../src/api';
import { useBranding } from '../../src/contexts/branding-context';
import { useBlocker } from 'react-router-dom';

import type { ISnackBar } from '../../src/types/component.types';
import type { Location, Blocker } from 'react-router-dom';

// ----------------------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [changePassword] = useChangePasswordMutation();
  const [snackbar, setSnackbar] = useState<ISnackBar>({ open: false, message: '', severity: 'success' });
  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));
  const [openConfirm, setOpenConfirm] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number | ''>('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [useTLS, setUseTLS] = useState(true);
  const [storagePath, setStoragePath] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [ isWarningModalOpen , setIsWarningModalOpen] = useState(false);

  // Track original values
  const [originalEmailSettings, setOriginalEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '' as number | '',
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
  });
  const [originalStoragePath, setOriginalStoragePath] = useState('');
  const [expandedEmail, setExpandedEmail] = useState(false);
  const [expandedStorage, setExpandedStorage] = useState(false);
  const [expandedBranding, setExpandedBranding] = useState(false);
  
  // Branding state
  const [logo, setLogo] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#FFFFFF');
  // Local state for immediate visual feedback during color dragging
  const [foregroundPreview, setForegroundPreview] = useState('#000000');
  const [backgroundPreview, setBackgroundPreview] = useState('#FFFFFF');
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const foregroundColorInputRef = useRef<HTMLInputElement>(null);
  const backgroundColorInputRef = useRef<HTMLInputElement>(null);
  const foregroundUpdateTimeoutRef = useRef<number | null>(null);
  const backgroundUpdateTimeoutRef = useRef<number | null>(null);
  const [originalBranding, setOriginalBranding] = useState({
    logo: '',
    foreground: '#000000',
    background: '#FFFFFF',
  });

  const { data: settings, isLoading: settingsLoading } = useGetSettingsQuery('email');
  const { data: storagePathData, isLoading: storagePathLoading } = useGetStoragePathQuery();
  const { data: brandingData, isLoading: brandingLoading } = useGetBrandingQuery();
  const [updateSettings, {isLoading: updateSettingsLoading}] = useUpdateSettingsMutation();
  const [updateStoragePath] = useUpdateStoragePathMutation();
  const [updateBranding, {isLoading: updateBrandingLoading}] = useUpdateBrandingMutation();
  const { refresh: refreshBranding } = useBranding();

  // Check if email settings have changed
  const hasEmailChanges = 
    smtpHost !== originalEmailSettings.smtpHost ||
    smtpPort !== originalEmailSettings.smtpPort ||
    smtpUser !== originalEmailSettings.smtpUser ||
    smtpPass !== originalEmailSettings.smtpPass ||
    fromEmail !== originalEmailSettings.fromEmail;

  // Check if storage path has changed
  const hasStorageChanges = storagePath !== originalStoragePath;

  // Check if branding has changed
  const hasBrandingChanges = 
    logo !== originalBranding.logo ||
    foreground !== originalBranding.foreground ||
    background !== originalBranding.background;

  // Check if password fields are filled
  const hasPasswordInput = currentPassword.trim() !== '' && newPassword.trim() !== '';

  const hasChanges = hasEmailChanges || hasStorageChanges || hasBrandingChanges || hasPasswordInput;
  const blocker = useBlocker(hasChanges) as Blocker;

  const handleDeactivate = () => {
    // Handle deactivation logic here
    setSnackbar({ open: true, message: 'Account deactivation request has been received. An admin will review your request.', severity: 'success' });
    setOpenConfirm(false);
  };

  const handleCancelEmail = () => {
    setSmtpHost(originalEmailSettings.smtpHost);
    setSmtpPort(originalEmailSettings.smtpPort);
    setSmtpUser(originalEmailSettings.smtpUser);
    setSmtpPass(originalEmailSettings.smtpPass);
    setFromEmail(originalEmailSettings.fromEmail);
  };

  const handleSaveEmail = async () => {
    const settingsData = {
      smtpHost,
      smtpPort,
      username: smtpUser,
      password: smtpPass,
      fromEmail,
    };

    try {
      await updateSettings(settingsData as any).unwrap();
      setSnackbar({ open: true, message: 'Email configuration has been saved successfully', severity: 'success' });
      // Update original values after successful save
      setOriginalEmailSettings({
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        fromEmail,
      });
    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Failed to save email configuration';
      setSnackbar({ open: true, message: `${errorMessage}. Please try again.`, severity: 'error' });
    }
  };

  const handleCancelStorage = () => {
    setStoragePath(originalStoragePath);
  };

  // update blocker state
   useEffect(() => {
    if (blocker?.state === "blocked" && hasChanges) {
      setIsWarningModalOpen(true);
    }
  }, [blocker, hasChanges]);

   const handleConfirmLeave = (): void => {
    setIsWarningModalOpen(false);
    // setHasChanges(false); 
    blocker?.proceed?.();
  };

    const handleStay = (): void => {
    setIsWarningModalOpen(false);
    blocker?.reset?.(); 
  };


  const handleSaveStorage = async () => {
    if (!storagePath) {
      setSnackbar({ open: true, message: 'Please select a storage path', severity: 'warning' });
      return;
    }

    try {
      await updateStoragePath({ path: storagePath }).unwrap();
      setSnackbar({ open: true, message: `Storage path has been updated to "${storagePath}"`, severity: 'success' });
      // Update original value after successful save
      setOriginalStoragePath(storagePath);
    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Failed to save storage path';
      setSnackbar({ open: true, message: `${errorMessage}. Please try again.`, severity: 'error' });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Please select a valid image file', severity: 'error' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Image size should be less than 5MB', severity: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogo(result);
        setLogoPreview(result);
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo('');
    setLogoPreview('');
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = '';
    }
  };

  const handleSaveBranding = async () => {
    try {
      await updateBranding({ 
        logo: logo || undefined,
        fgcolor: foreground,
        bgcolor: background 
      }).unwrap();
      setSnackbar({ open: true, message: 'Branding settings have been saved and applied successfully', severity: 'success' });
      // Update original values after successful save
      setOriginalBranding({
        logo,
        foreground,
        background,
      });
      // Refresh branding context to apply changes immediately
      refreshBranding();
    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Failed to save branding settings';
      setSnackbar({ open: true, message: `${errorMessage}. Please try again.`, severity: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setSnackbar({ open: true, message: 'Please fill out both password fields.', severity: 'warning' });
      return;
    }
    if (currentPassword === newPassword) {
      setSnackbar({ open: true, message: 'New password can not be the same as old', severity: 'error' });
      setCurrentPassword('');
      setNewPassword('');
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      setSnackbar({ open: true, message: 'Your password has been updated successfully', severity: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      const errorMessage =
        err.data?.message || err.message || 'Failed to update password';
      setSnackbar({ open: true, message: `${errorMessage}. Please try again.`, severity: 'error' });
    }
  };

  useEffect(() => {
    if (settings) {
      const emailSettings = {
        smtpHost: settings?.smtpHost || '',
        smtpPort: settings?.smtpPort || '' as number | '',
        smtpUser: settings?.username || '',
        smtpPass: settings?.password || '',
        fromEmail: settings?.fromEmail || '',
      };
      
      setSmtpHost(emailSettings.smtpHost);
      setSmtpPort(emailSettings.smtpPort);
      setSmtpUser(emailSettings.smtpUser);
      setSmtpPass(emailSettings.smtpPass);
      setFromEmail(emailSettings.fromEmail);
      setUseTLS(settings?.useTLS || true);
      setStoragePath(settings?.storagePath || '');
      
      // Store original values
      setOriginalEmailSettings(emailSettings);
    }
  }, [settings]);

  useEffect(() => {
    if (storagePathData) {
      const path = storagePathData.storagePath !== "undefined" ? storagePathData.storagePath : '';
      setStoragePath(path);
      setOriginalStoragePath(path);
    }
  }, [storagePathData]);

  useEffect(() => {
    if (brandingData) {
      const fgColor = brandingData?.fgcolor || '#000000';
      const bgColor = brandingData?.bgcolor || '#FFFFFF';
      const logoValue = brandingData?.logo || '';
      
      setForeground(fgColor);
      setBackground(bgColor);
      setForegroundPreview(fgColor);
      setBackgroundPreview(bgColor);
      setLogo(logoValue);
      if (logoValue) {
        setLogoPreview(logoValue);
      }
      
      // Store original values
      setOriginalBranding({
        logo: logoValue,
        foreground: fgColor,
        background: bgColor,
      });
    }
  }, [brandingData]);

  useEffect(() => {
    // Cleanup animation frames on unmount
      if (foregroundUpdateTimeoutRef.current) {
        cancelAnimationFrame(foregroundUpdateTimeoutRef.current);
      }
      if (backgroundUpdateTimeoutRef.current) {
        cancelAnimationFrame(backgroundUpdateTimeoutRef.current);
      }
  }, []);


  return (
    <>
      <title>{`Settings - ${CONFIG.appName}`}</title>

    <Stack direction="column" spacing={3} p={3} pt={0}>
        <Stack spacing={3}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <Accordion 
              expanded={expandedEmail} 
              onChange={() => setExpandedEmail(!expandedEmail)}
              sx={{ 
                '&:before': { display: 'none' },
                boxShadow: 'none',
                bgcolor: 'transparent'
              }}
            >
              <AccordionSummary 
                expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                sx={{ 
                  px: 3,
                  minHeight: 56,
                  '&.Mui-expanded': { minHeight: 56 }
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: 'text.secondary'
                  }}>
                    <Iconify icon="solar:letter-bold-duotone" width={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Email Configuration</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pt: 2, pb: 3 }}>
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="SMTP Host"
                      fullWidth
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      size="medium"
                      InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                    <TextField
                      label="SMTP Port"
                      type="number"
                      fullWidth
                      value={smtpPort}
                      onChange={(e) =>
                        setSmtpPort(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      size="medium"
                      InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Username"
                      fullWidth
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      size="medium"
                      InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      size="medium"
                      InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                  </Stack>
                  <TextField
                    label="From Email"
                    fullWidth
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    size="medium"
                    InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                    <PrimaryButton onClick={handleSaveEmail} disabled={!hasEmailChanges || updateSettingsLoading}
                      startIcon={ updateSettingsLoading ? <Iconify icon="svg-spinners:180-ring" width={20} /> : undefined}
                    >
                      Save email settings
                    </PrimaryButton>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Divider />

            {/* <Accordion 
              expanded={expandedStorage} 
              onChange={() => setExpandedStorage(!expandedStorage)}
              sx={{ 
                '&:before': { display: 'none' },
                boxShadow: 'none',
                bgcolor: 'transparent'
              }}
            >
              <AccordionSummary 
                expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                sx={{ 
                  px: 3,
                  minHeight: 56,
                  '&.Mui-expanded': { minHeight: 56 }
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: 'text.secondary'
                  }}>
                    <Iconify icon="solar:gallery-bold-duotone" width={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Image Storage</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pt: 2, pb: 3 }}>
                <Stack spacing={3}>
                  <TextField
                    label="Storage Path"
                    placeholder="/uploads/images"
                    fullWidth
                    value={storagePath}
                    onChange={(e) => setStoragePath(e.target.value)}
                    size="medium"
                    InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
                    inputProps={{ sx: { '&::placeholder': { fontSize: '0.875rem' } } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                    <PrimaryButton onClick={handleSaveStorage} disabled={!hasStorageChanges}>
                      Save storage path
                    </PrimaryButton>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion> */}

            <Divider />

            <Accordion 
              expanded={expandedBranding} 
              onChange={() => setExpandedBranding(!expandedBranding)}
              sx={{ 
                '&:before': { display: 'none' },
                boxShadow: 'none',
                bgcolor: 'transparent'
              }}
            >
              <AccordionSummary 
                expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                sx={{ 
                  px: 3,
                  minHeight: 56,
                  '&.Mui-expanded': { minHeight: 56 }
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: 'text.secondary'
                  }}>
                    <Iconify icon="solar:gallery-bold-duotone" width={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Branding</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pt: 2, pb: 3 }}>
                <Stack spacing={3}>
                  {/* <Box>
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                      Logo
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {logoPreview ? (
                        <Box
                          component="img"
                          src={logoPreview}
                          alt="Logo preview"
                          sx={{
                            width: 120,
                            height: 120,
                            objectFit: 'contain',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1,
                            bgcolor: 'background.neutral',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.neutral',
                          }}
                        >
                          <Iconify icon="solar:gallery-bold-duotone" width={40} sx={{ color: 'text.disabled' }} />
                        </Box>
                      )}
                      <Stack spacing={1}>
                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          style={{ display: 'none' }}
                        />
                        <PrimaryButton
                          variant="outlined"
                          onClick={() => logoFileInputRef.current?.click()}
                          startIcon={<Iconify icon="solar:gallery-bold-duotone" />}
                        >
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </PrimaryButton>
                        {logoPreview && (
                          <OutlinedButton
                            onClick={handleRemoveLogo}
                            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                            sx={{ color: 'error.main', borderColor: 'error.main' }}
                          >
                            Remove
                          </OutlinedButton>
                        )}
                      </Stack>
                    </Stack>
                  </Box> */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                        Foreground Color
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 40,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: foregroundPreview,
                            flexShrink: 0,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            foregroundColorInputRef.current?.click();
                          }}
                        />
                        <TextField
                          fullWidth
                          value={foreground}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow hex color format
                            if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                              setForeground(value);
                              setForegroundPreview(value);
                            }
                          }}
                          size="medium"
                          placeholder="#000000"
                        />
                        <input
                          ref={foregroundColorInputRef}
                          type="color"
                          value={foregroundPreview}
                          onInput={(e) => {
                            const value = (e.target as HTMLInputElement).value;
                            // Update preview immediately for visual feedback
                            setForegroundPreview(value);
                            // Cancel any pending animation frame
                            if (foregroundUpdateTimeoutRef.current) {
                              cancelAnimationFrame(foregroundUpdateTimeoutRef.current as any);
                            }
                            // Use requestAnimationFrame for smooth, throttled updates
                            foregroundUpdateTimeoutRef.current = requestAnimationFrame(() => {
                              setForeground(value);
                            }) as any;
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            setForegroundPreview(value);
                            // Cancel any pending animation frame and update immediately
                            if (foregroundUpdateTimeoutRef.current) {
                              cancelAnimationFrame(foregroundUpdateTimeoutRef.current as any);
                            }
                            setForeground(value);
                          }}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '100%',
                            marginTop: 8,
                            opacity: 0,
                            width: 1,
                            height: 1,
                            pointerEvents: 'none',
                            zIndex: -1,
                          }}
                        />
                      </Stack>
                    </Box>
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                        Background Color
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 40,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: backgroundPreview,
                            flexShrink: 0,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            backgroundColorInputRef.current?.click();
                          }}
                        />
                        <TextField
                          fullWidth
                          value={background}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow hex color format
                            if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                              setBackground(value);
                              setBackgroundPreview(value);
                            }
                          }}
                          size="medium"
                          placeholder="#FFFFFF"
                        />
                        <input
                          ref={backgroundColorInputRef}
                          type="color"
                          value={backgroundPreview}
                          onInput={(e) => {
                            const value = (e.target as HTMLInputElement).value;
                            // Update preview immediately for visual feedback
                            setBackgroundPreview(value);
                            // Cancel any pending animation frame
                            if (backgroundUpdateTimeoutRef.current) {
                              cancelAnimationFrame(backgroundUpdateTimeoutRef.current);
                            }
                            // Use requestAnimationFrame for smooth, throttled updates
                            backgroundUpdateTimeoutRef.current = requestAnimationFrame(() => {
                              setBackground(value);
                            });
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBackgroundPreview(value);
                            // Cancel any pending animation frame and update immediately
                            if (backgroundUpdateTimeoutRef.current) {
                              cancelAnimationFrame(backgroundUpdateTimeoutRef.current);
                            }
                            setBackground(value);
                          }}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '100%',
                            marginTop: 8,
                            opacity: 0,
                            width: 1,
                            height: 1,
                            pointerEvents: 'none',
                            zIndex: -1,
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                    <PrimaryButton onClick={handleSaveBranding} disabled={!hasBrandingChanges || updateBrandingLoading} 
                      startIcon={ updateBrandingLoading ? <Iconify icon="svg-spinners:180-ring" width={20} /> : undefined}
                    >
                      Save branding settings
                    </PrimaryButton>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Card>
          <ProgressSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={handleCloseSnackbar}
          />
        </Stack>
      </Stack>

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onCancel={() => setOpenConfirm(false)}
        title="Deactivate Account"
        content="Are you sure you want to deactivate your account? This will immediately disable your account and remove your information from our services."
        action={
          <PrimaryButton
            onClick={handleDeactivate}
            sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
          >
            Confirm deactivation
          </PrimaryButton>
        }
        maxWidth="xs"
      />

        {/*Dialog for unsaved modifications*/}
        <ConfirmDialog 
          title='Cancel settings changes ?'
          open={isWarningModalOpen}
          onClose={handleStay}
                  content={
                    <Typography variant='inherit' color='textSecondary'>
                      You have some unsaved changes in settings.
                    </Typography>
                  }
                  action={
                  <Stack display='flex' alignContent='flex-end' flexDirection='row' gap={1}>
                    <PrimaryButton 
                    variant='outlined' 
                    onClick={handleStay}
                    >
                      Cancel
                    </PrimaryButton>
                    <PrimaryButton
                      variant="contained"
                      onClick={handleConfirmLeave}
                      sx={{ minWidth: 90}}
                    >
                      Discard
                    </PrimaryButton>
                  </Stack>
                  }
                />

    </>
  );
}
