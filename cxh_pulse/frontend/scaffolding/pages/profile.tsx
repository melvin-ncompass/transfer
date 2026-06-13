import { useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from '../../src/config-global';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Card,
  Avatar,
  IconButton,
  Divider,
  InputAdornment,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../src/store/store';
import { AuthUser, updateUserDetails } from '../../src/store/slices/authSlice';
import { PrimaryButton, OutlinedButton } from '../../src/components/buttons';
import { Iconify } from '../../src/components/iconify';
import { ConfirmDialog } from '../../src/components/custom-dialog';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTheme } from '@mui/material';

import {
  useChangePasswordMutation,
  useUpdateUserMutation,
  useUpdateAvatarMutation,
  useGetAvatarQuery,
} from '../../src/api';
import { ProgressSnackbar } from '../../src/components/snackbar';
import zxcvbn from 'zxcvbn';
import { useBlocker } from 'react-router-dom';

import type { ISnackBar } from '../../src/types/component.types';
import type { Blocker } from 'react-router-dom';
import { isEqual } from 'lodash';
// ----------------------------------------------------------------------

export default function Page() {
  const theme = useTheme();

  const dispatch = useDispatch();
  const [changePassword] = useChangePasswordMutation();
  const [updateUser] = useUpdateUserMutation();
  const [updateAvatar] = useUpdateAvatarMutation();
  const [customLoader, setCustomLoader] = useState(false);
  const [customLoaderPassword, setCustomLoaderPassword] = useState(false);
  const { data: avatar, isLoading: avatarLoading } = useGetAvatarQuery();

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [openCropModal, setOpenCropModal] = useState(false);

  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];

  const [snackbar, setSnackbar] = useState<ISnackBar>({
    open: false,
    message: '',
    severity: 'success',
  });
  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const user = useSelector((state: RootState) => state.auth.user);
  const selectedFile = useRef<File | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.userInfo?.avatar || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState<any>({});
  const [confirmPasswordStrength, setConfirmPasswordStrength] = useState<any>({});
  const [expandedProfile, setExpandedProfile] = useState(false);
  const [expandedPassword, setExpandedPassword] = useState(false);
  const maxLength = 50;
  const [lengthValue, setLengthValue] = useState('');
  const [showHelper, setShowHelper] = useState(false);
  const [disableBtn, setDisableBtn] = useState(true);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  const isLimitError = lengthValue.length + 1 > maxLength;
  const ismodified = hasChanges;
  const blocker = useBlocker(ismodified) as Blocker;

  const nameSave = useRef(userProfile?.userInfo?.name);

  // for initial load of data in fields and page
  useEffect(() => {
  if (user) {
    setUserProfile(user);
    nameSave.current = user.userInfo?.name;
  }
}, [user]);

  // removes only tab spaces given by user in start
  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();
    const isDataChanged = trimmedValue === nameSave.current;

    if (isDataChanged) {
      setDisableBtn(true);
    }

    if (userProfile) {
      setUserProfile({
        ...userProfile,
        userInfo: { ...userProfile.userInfo!, [name]: trimmedValue },
      });
    }

    updateNameChangesState(trimmedValue);
  };

  const setPasswordFieldsEmpty = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const updateNameChangesState = (currentName: string) => {
    setHasChanges((prev) => !isEqual(currentName, nameSave.current));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();

    // check for disable save button on Profile
    if (trimmedValue !== nameSave.current && trimmedValue.length > 0) {
      setDisableBtn(false);
      setShowHelper(true);
      updateNameChangesState(trimmedValue);
    } else {
      setDisableBtn(true);
      setShowHelper(false);
      updateNameChangesState(trimmedValue);
    }

    if (userProfile) {
      setUserProfile({
        ...userProfile,
        userInfo: { ...userProfile.userInfo!, [name]: value },
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (userProfile?.userInfo?.[name as keyof typeof userProfile.userInfo] !== value) {
      updateNameChangesState(
        userProfile?.userInfo?.[name as keyof typeof userProfile.userInfo] as string
      );
    }
    if (userProfile) {
      setUserProfile({ ...userProfile, userInfo: { ...userProfile.userInfo!, [name]: value } });
    }
  };

  useEffect(() => {
    if (blocker?.state === 'blocked') {
      setIsWarningModalOpen(true);
    }
  }, [blocker]);

  const handleConfirmLeave = (): void => {
    setPasswordFieldsEmpty();

    setIsWarningModalOpen(false);
    updateNameChangesState('');
    blocker?.proceed?.();
  };

  const handleStay = (): void => {
    setIsWarningModalOpen(false);
    blocker?.reset?.();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentFile = e.target.files?.[0];
    selectedFile.current = currentFile || null;

    if (currentFile) {
      if (!currentFile.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Please select a valid image file', severity: 'error' });
        e.target.value = '';
        return;
      }

      if (currentFile.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error',
        });
        e.target.value = '';
        return;
      }

      // Check if file is empty
      if (currentFile.size === 0) {
        setSnackbar({
          open: true,
          message: 'The selected file is empty. Please select a valid image file.',
          severity: 'error',
        });
        e.target.value = '';
        return;
      }

      // Reset all crop-related state before loading new image
      setSelectedImage(null);
      setCrop(undefined);
      setCompletedCrop(null);
      imgRef.current = null;

      // Try to read the file using FileReader
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          // FileReader.readAsDataURL always returns a string (data URL)
          if (result && typeof result === 'string' && result.startsWith('data:')) {
            // Set image first, then open modal after state update
            setSelectedImage(result);
            // Use setTimeout to ensure state update completes before opening modal
            setTimeout(() => {
              setOpenCropModal(true);
            }, 0);
          } else {
            console.error('Invalid FileReader result:', result);
            setSnackbar({
              open: true,
              message: 'Failed to load image. Invalid file format.',
              severity: 'error',
            });
          }
        } catch (error) {
          console.error('Error processing image:', error);
          setSnackbar({
            open: true,
            message: 'Failed to process image. Please try again.',
            severity: 'error',
          });
        }
        e.target.value = '';
      };
      
      reader.onerror = (errorEvent) => {
        const error = (errorEvent.target as FileReader)?.error;
        console.error('FileReader error:', error, errorEvent);
        
        let errorMessage = 'Error reading image file. ';
        
        if (error) {
          switch (error.name) {
            case 'NotReadableError':
              errorMessage += 'The file could not be read. It may be corrupted, locked, or in use by another application. Please try selecting a different image or close any applications that might be using this file.';
              break;
            case 'NotFoundError':
              errorMessage += 'The file was not found. Please select the file again.';
              break;
            case 'SecurityError':
              errorMessage += 'Security error: The file cannot be read due to browser security restrictions.';
              break;
            case 'EncodingError':
              errorMessage += 'The file encoding is not supported. Please try a different image format.';
              break;
            default:
              errorMessage += `Error: ${error.message || 'Unknown error'}. Please try again.`;
          }
        } else {
          errorMessage += 'Please try again.';
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
        e.target.value = '';
      };
      
      reader.onabort = () => {
        setSnackbar({
          open: true,
          message: 'Image reading was cancelled.',
          severity: 'warning',
        });
        e.target.value = '';
      };
      
      // Add a small delay before reading to ensure file is fully available
      try {
        // Verify file is accessible before reading
        if (currentFile.size === 0) {
          setSnackbar({
            open: true,
            message: 'The selected file is empty. Please select a valid image file.',
            severity: 'error',
          });
          e.target.value = '';
          return;
        }
        
        reader.readAsDataURL(currentFile);
      } catch (readError) {
        console.error('Error starting file read:', readError);
        setSnackbar({
          open: true,
          message: 'Failed to start reading the file. Please try again.',
          severity: 'error',
        });
        e.target.value = '';
      }
    }
  };

  const updateUserAvatar = async (blob: Blob) => {
    if (selectedFile.current) {
      const formData = new FormData();
      formData.append('file', blob);
      await updateAvatar(formData).unwrap();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCustomLoader(true);
      await updateUser({ name: userProfile?.userInfo?.name || '' }).unwrap();
      dispatch(updateUserDetails({ name: userProfile?.userInfo?.name || '' }));
      updateNameChangesState('');
      nameSave.current = userProfile?.userInfo?.name;
      setSnackbar({ open: true, message: 'Your profile has been updated successfully', severity: 'success' });
      setHasChanges(false);
      setDisableBtn(true);
    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Failed to update profile';
      setSnackbar({ open: true, message: `${errorMessage}. Please try again.`, severity: 'error' });
    } finally {
      setCustomLoader(false);
    }
  };

  const handleNewPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value.replace(/\s/g, '');
    setNewPassword(value);
    setHasChanges(true);
    updateNameChangesState(value);

    if (value) {
      const result = zxcvbn(value);
      setNewPasswordStrength(result);
    } else {
      setNewPasswordStrength({ score: 0, feedback: {} });
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value.replace(/\s/g, '');
    setConfirmPassword(value);
    setHasChanges(true);
    updateNameChangesState(value);

    if (value) {
      const result = zxcvbn(value);
      setConfirmPasswordStrength(result);
    } else {
      setConfirmPasswordStrength({ score: 0, feedback: {} });
    }
  };

  const handleChangePassword = async () => {
    if (currentPassword === newPassword) {
      setSnackbar({
        open: true,
        message: 'New password can not be the same as old',
        severity: 'warning',
      });
      setPasswordFieldsEmpty();
      setHasChanges(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Confirm with the right password',
        severity: 'warning',
      });
      setConfirmPassword('');
      setHasChanges(true);
      return;
    }

    try {
      setCustomLoaderPassword(true);
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      setSnackbar({ open: true, message: 'Your password has been updated successfully', severity: 'success' });
      setPasswordFieldsEmpty();
      setHasChanges(false);
      // setHasPasswordChanges(false);
    } catch (err: any) {
      const errorMessage =
        err.data?.message || err.message || 'Failed to update password';
      setSnackbar({ open: true, message: `${errorMessage}. Please try again.`, severity: 'error' });
    } finally {
      setCustomLoaderPassword(false);
    }
  };

  const handleCropImageSave = async () => {
    try {
      if (completedCrop && imgRef.current && canvasRef.current) {
        setIsCropping(true);
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        // Set canvas size to the cropped dimensions (scaled to natural size)
        const outputWidth = completedCrop.width! * scaleX;
        const outputHeight = completedCrop.height! * scaleY;
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw the cropped portion of the image
        ctx.drawImage(
          img,
          completedCrop.x! * scaleX,
          completedCrop.y! * scaleY,
          completedCrop.width! * scaleX,
          completedCrop.height! * scaleY,
          0,
          0,
          outputWidth,
          outputHeight
        );

        // Convert canvas.toBlob to Promise
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });

        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        selectedFile.current = new File([blob], 'avatar.png', { type: 'image/png' });
        await updateUserAvatar(selectedFile.current);
        const dataUrl = URL.createObjectURL(blob);
        setAvatarPreview(dataUrl);

        if (userProfile) {
          setUserProfile({
            ...userProfile,
            userInfo: { ...userProfile.userInfo!, avatar: dataUrl },
          });
        }

        setOpenCropModal(false);
        // Reset crop state after successful save
        setSelectedImage(null);
        setCrop(undefined);
        setCompletedCrop(null);
        imgRef.current = null;
        setSnackbar({
          open: true,
          message: 'Your profile picture has been updated successfully',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile picture. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsCropping(false);
    }
  };

  useEffect(() => {
    if (avatar) {
      setAvatarPreview(avatar);
    }
  }, [avatar]);

  const getStrengthColor = (score: number) => {
    const colors = ['error.main', 'error.main', 'warning.main', 'info.main', 'success.main'];
    return colors[score];
  };

  const isPasswordButtonDisabled = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return true;
    }

    if (newPassword !== confirmPassword) {
      return true;
    }
    return false;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleExpandPassword = () => {
    setExpandedPassword(!expandedPassword);
  };

  //to check for changes in password fields
  useEffect(() => {
    if (newPassword.length === 0 && confirmPassword.length === 0 && currentPassword.length === 0) {
      setHasChanges(false);
    }
  }, [newPassword, confirmPassword, currentPassword]);

  return (
    <>
      <title>{`Profile - ${CONFIG.appName}`}</title>

      <Stack direction="column" spacing={3} p={3} pt={0}>
        <Card sx={{ bgcolor: 'background.paper' }}>
          {/* Profile Header with Avatar */}
          <Box sx={{ p: 3 }}>
            <Stack direction={{ xs:'column', sm:'row', md:'row', lg:'row', xl: 'row' }} spacing={3} alignItems="center">
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={avatarPreview || avatar || userProfile?.userInfo?.avatar}
                  alt={userProfile?.userInfo?.name}
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    fontWeight: 600,
                    border: 4,
                    borderColor: 'background.paper',
                    boxShadow: 2,
                  }}
                >
                  {userProfile?.userInfo?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    width: 36,
                    height: 36,
                    boxShadow: 2,
                  }}
                >
                <Iconify icon="solar:pen-bold" width={20} />
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1,display: 'flex', flexDirection: { xs: 'column',sm: 'column', md: 'column' }, alignItems: {xs: 'center', sm:'flex-start', md: 'flex-start', lg: 'flex-start'}}}>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                  {userProfile?.userInfo?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {userProfile?.userInfo?.email}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {userProfile?.roleName}
                  </Typography>
                </Box>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              <Iconify icon="solar:pen-bold" width={14} sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Click the edit icon on your avatar to upload a new profile picture (Max 5MB)
            </Typography>
          </Box>

          <Divider />

          {/* Profile Details */}
          <Accordion
            expanded={expandedProfile}
            onChange={() => setExpandedProfile(!expandedProfile)}
            sx={{
              '&:before': { display: 'none' },
              boxShadow: 'none',
              bgcolor: 'transparent',
            }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              sx={{
                px: 3,
                minHeight: 56,
                '&.Mui-expanded': { minHeight: 56 },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: 'text.secondary',
                  }}
                >
                  <Iconify icon="solar:user-bold-duotone" width={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Details
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pt: 2, pb: 3 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={userProfile?.userInfo?.name|| ''}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  size="medium"
                  placeholder="Enter your full name"
                  error={isLimitError}
                  slotProps={{ htmlInput: { maxLength } }}
                  helperText={
                    showHelper === true ? (
                      isLimitError ? (
                        `Input cannot exceed ${maxLength} characters`
                      ) : (
                        <Typography variant="caption" sx={{ color: (userProfile?.userInfo?.name || '').length >= maxLength ? 'error.main' : 'text.secondary' }}>
                          {(userProfile?.userInfo?.name || '').length}/{maxLength} characters
                        </Typography>
                      )
                    ) : (
                      ''
                    )
                  }
                />
                <TextField
                  fullWidth
                  disabled
                  label="Email Address"
                  name="email"
                  value={userProfile?.userInfo?.email || ''}
                  onChange={handleChange}
                  size="medium"
                  helperText="Email cannot be changed"
                />
                <TextField
                  fullWidth
                  disabled
                  label="Role"
                  name="role"
                  value={userProfile?.roleName || 'User'}
                  size="medium"
                  helperText="Role is assigned by administrators"
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                  <PrimaryButton onClick={handleSubmit} disabled={disableBtn || customLoader} 
                    startIcon={customLoader ? <Iconify icon="svg-spinners:180-ring" width={20} /> : undefined}>
                    Save Changes
                  </PrimaryButton>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
          <Divider />

          {/* Change Password */}
          <Accordion
            expanded={expandedPassword}
            onChange={handleExpandPassword}
            TransitionProps={{}}
            sx={{
              '&:before': { display: 'none' },
              boxShadow: 'none',
              bgcolor: 'transparent',
            }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              sx={{
                px: 3,
                minHeight: 56,
                '&.Mui-expanded': { minHeight: 56 },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    color: 'text.secondary',
                  }}
                >
                  <Iconify icon="solar:shield-keyhole-bold-duotone" width={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Change Password
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pt: 2, pb: 3 }}>
              <Stack spacing={2.5}>
                <TextField
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  fullWidth
                  autoComplete='new-password'
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value.replace(/\s/g, ''));
                    setHasChanges(true);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify
                          icon="solar:shield-keyhole-bold-duotone"
                          width={24}
                          color="text.secondary"
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          <Iconify
                            icon={showCurrentPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                            width={20}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box>
                  <TextField
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    fullWidth
                    autoComplete='new-password'
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify
                            icon="solar:shield-keyhole-bold-duotone"
                            width={24}
                            color="text.secondary"
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            <Iconify
                              icon={showNewPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                              width={20}
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    slotProps={{ htmlInput: { maxLength } }}
                  />
                  {newPassword && (
                    <Box sx={{ mt: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Password Strength
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: getStrengthColor(newPasswordStrength.score),
                          }}
                        >
                          {strengthLabels[newPasswordStrength.score]}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(newPasswordStrength.score + 1) * 20}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getStrengthColor(newPasswordStrength.score),
                            borderRadius: 1,
                          },
                        }}
                      />
                      {newPasswordStrength.feedback?.warning && (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {newPasswordStrength.feedback.warning}
                        </Typography>
                      )}
                      {newPasswordStrength.feedback?.suggestions?.length > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {newPasswordStrength.feedback.suggestions[0]}
                        </Typography>
                      )}
                      {newPassword.length > 49 && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          Max limit: {maxLength}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  autoComplete='new-password'
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify
                          icon="solar:shield-keyhole-bold-duotone"
                          width={24}
                          color="text.secondary"
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {confirmPassword.length > 0 && (
                            <Iconify
                              icon={
                                !isPasswordButtonDisabled
                                  ? 'solar:check-circle-bold'
                                  : 'solar:close-circle-bold'
                              }
                              width={20}
                              color={
                                !isPasswordButtonDisabled
                                  ? `${theme.palette.success.main}`
                                  : `${theme.palette.error.main}`
                              }
                            />
                          )}
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            <Iconify
                              icon={
                                showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'
                              }
                              width={20}
                            />
                          </IconButton>
                        </Stack>
                      </InputAdornment>
                    ),
                  }}
                  slotProps={{ htmlInput: { maxLength } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                  <PrimaryButton
                    onClick={handleChangePassword}
                    disabled={isPasswordButtonDisabled || customLoaderPassword}
                    startIcon={customLoaderPassword ? <Iconify icon="svg-spinners:180-ring" width={20} /> : undefined}
                  >
                    Save Password
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

        {/* Dialog for Image crop */}
        <ConfirmDialog
          open={openCropModal}
          onClose={() => {
            setOpenCropModal(false);
            setSelectedImage(null);
            setCrop(undefined);
            setCompletedCrop(null);
          }}
          onCancel={() => {
            setOpenCropModal(false);
            setSelectedImage(null);
            setCrop(undefined);
            setCompletedCrop(null);
          }}
          title="Crop your image"
          maxWidth="md"
          content={
            selectedImage ? (
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '500px',
                  maxHeight: '500px',
                  mx: 'auto',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  minWidth={100}
                  minHeight={100}
                >
                  <img
                    key={selectedImage} // Force re-render when image changes
                    ref={imgRef}
                    src={selectedImage}
                    alt="Crop"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      width: 'auto',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      imgRef.current = img;
                      // Reset crop state before setting new crop
                      setCompletedCrop(null);
                      // Use displayed dimensions for initial crop
                      const { width, height } = img;
                      const size = Math.min(width, height) * 0.8;
                      setCrop({
                        unit: 'px',
                        width: size,
                        height: size,
                        x: (width - size) / 2,
                        y: (height - size) / 2,
                      });
                    }}
                    onError={() => {
                      setSnackbar({
                        open: true,
                        message: 'Failed to load image. Please try again.',
                        severity: 'error',
                      });
                      setOpenCropModal(false);
                      setSelectedImage(null);
                      setCrop(undefined);
                      setCompletedCrop(null);
                    }}
                  />
                </ReactCrop>
              </Box>
            ) : (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No image selected</Typography>
              </Box>
            )
          }
          action={
            <PrimaryButton
              variant="contained"
              onClick={handleCropImageSave}
              disabled={!completedCrop || isCropping}
              loading={isCropping}
            >
              {isCropping ? 'Saving...' : 'Save Crop'}
            </PrimaryButton>
          }
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/*Dialog for unsaved modifications*/}
        <ConfirmDialog
          title="Cancel profile changes ?"
          open={isWarningModalOpen}
          onClose={handleStay}
          content={
            <Typography variant="body1" color="textSecondary">
              You have some unsaved changes in profile details.
            </Typography>
          }
          action={
            <Stack display="flex" alignContent="flex-end" flexDirection="row" gap={1}>
              <PrimaryButton variant="outlined" onClick={handleStay}>
                Cancel
              </PrimaryButton>
              <PrimaryButton variant="contained" onClick={handleConfirmLeave} sx={{ minWidth: 90 }}>
                Discard
              </PrimaryButton>
            </Stack>
          }
        />
      </Stack>
      {/* </DashboardContent> */}
    </>
  );
}