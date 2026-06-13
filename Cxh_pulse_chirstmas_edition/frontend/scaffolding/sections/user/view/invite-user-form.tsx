import { useState, useEffect, useCallback } from 'react';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  CardHeader,
  FormControl,
  IconButton,
  MenuItem,
  Modal,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material';

import { Iconify } from '../../../../src/components/iconify';
import { useInviteUserMutation, useGetRolesQuery, type Role } from '../../../../src/api';
import { ISnackBar } from '../../../../src/types/component.types';
import { PrimaryButton } from '../../../../src/components/buttons';

export function InviteUserForm({
  open,
  onClose,
  onSuccess,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (err: string) => void;
}) {
  const [inviteUser, { isLoading }] = useInviteUserMutation();
  const { data: roles, isLoading: rolesLoading } = useGetRolesQuery();
  const [error, setError] = useState<string | null>(null);
  const [lengthValue, setLengthValue] = useState('');
  const maxLength = 50;
  const isLimitError = lengthValue.length + 1 > maxLength;
  const [showHelper, setShowHelper] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
  });

  //name specific to track count
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (value.length > 0) {
      setShowHelper(true);
    } else {
      setShowHelper(false);
    }
    setLengthValue(e.target.value);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();
    setForm((prev) => ({ ...prev, [name]: trimmedValue }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!form.email) {
      return;
    }

    try {
      const { role, ...rest } = form;
      const roleNames = [role];
      await inviteUser({
        ...rest,
        roleNames,
      }).unwrap();
      setForm({ name: '', email: '', role: '' });
      onSuccess?.();
      onClose();
    } catch (roleError: any) {
      console.error('Failed to send invitation:', roleError);
      onError?.(roleError.data?.message || 'Failed to send invitation');
    }
  };

  useEffect(() => {
    if (!open) {
      setForm({ name: '', email: '', role: '' });
      setError(null);
      setLengthValue('');
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0,0,0,0.32)',
        },
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& .MuiPaper-root': {
          // width: '600px',
          maxWidth: 'none',
        },
        '& .MuiDialog-paper': {
          width: '600px',
          maxWidth: 'none',
        },
      }}
    >
      <Stack
        sx={{
          pl: 2,
          pr: 2,
          pt: 2,
          pb: 3,
          backgroundColor: 'var(--brand-surface)',
          color: 'var(--brand-text)',
          borderRadius: 1,
          width: '450px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          boxShadow: 24,
          position: 'relative',
          // ensure form inputs and labels use brand text color
          '& .MuiInputBase-root, & .MuiFormLabel-root, & .MuiSelect-select, & .MuiTypography-root':
            {
              color: 'var(--brand-text)',
            },
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="close"
          sx={{ position: 'absolute', top: 16, right: 16 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
        <CardHeader title="Invite User" sx={{ mb: 2, color: 'inherit' }} />
        <Stack spacing={3} sx={{ pt: 2, pr: 2, pl: 2 }} component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={form.name}
            onChange={handleNameChange}
            onBlur={handleBlur}
            placeholder="User Name"
            type="text"
            error={isLimitError}
            slotProps={{ htmlInput: { maxLength } }}
            helperText={
              showHelper === true
                ? isLimitError
                  ? `Input cannot exceed ${maxLength} characters`
                  : `${lengthValue.length}/${maxLength} characters`
                : ''
            }
            required
          />
          <TextField
            fullWidth
            label="Email address"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="user@example.com"
            type="email"
            required
          />
          <TextField
            fullWidth
            select
            label="Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            disabled={rolesLoading}
            helperText={rolesLoading ? 'Loading roles...' : ''}
          >
            {roles && roles.length > 0 ? (
              roles.map((role) => (
                <MenuItem key={role.id} value={role.name}>
                  {role.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No roles available
              </MenuItem>
            )}
          </TextField>
          <PrimaryButton
            type="submit"
            variant="contained"
            size="large"
            loading={isLoading}
            disabled={!form.name || !form.email || !form.role}
          >
            Send invitation
          </PrimaryButton>
        </Stack>
      </Stack>
    </Modal>
  );
}
