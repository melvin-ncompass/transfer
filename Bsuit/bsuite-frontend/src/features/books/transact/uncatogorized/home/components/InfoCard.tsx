import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteUncategorizedMutation } from '../api/uncategorized.api';
import { ConfirmDialog } from '../../../../../../components/dialogs/confirm-dialog';
import { formatCurrencyByCommaSeparation, formatDateShort } from '../../../../../../utils/numberFormatter';
import { useGetHeaderDataQuery } from '../../../../../company/api/company.api';

interface InfoCardProps {
  id: number;
  accountName: string;
  accountCurrency?: string;
  date: string;
  description: string;
  credit: number;
  debit: number;
  showDeleteIcon?: boolean;
  onDeleteSuccess?: (message: string) => void;
  onDeleteError?: (message: string) => void;
}

export function InfoCard({
  id,
  accountName,
  accountCurrency = '',
  date,
  description,
  credit,
  debit,
  showDeleteIcon = false,
  onDeleteSuccess,
  onDeleteError,
}: InfoCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch header data to get commaSeparation setting
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation = (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  const [deleteUncategorized] = useDeleteUncategorizedMutation();

  // Extract currency symbol from "₹ - INR" format
  const extractCurrencySymbol = (currencyString: string) => {
    if (!currencyString) return '';
    // Split by "-" and take the first part, then trim whitespace
    const parts = currencyString.split('-');
    return parts[0].trim();
  };

  const formattedDate = formatDateShort(date);
  const currencySymbol = extractCurrencySymbol(accountCurrency);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUncategorized([id]).unwrap();
      setDeleteConfirmOpen(false);
      onDeleteSuccess?.('Transaction deleted successfully');
    } catch (error) {
      onDeleteError?.('Failed to delete transaction');
    }
  };

  return (
    <>
      <Card
      sx={{
        width:"100%",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            {/* Account Name */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: theme.palette.text.primary,
              }}
            >
              {accountName}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Date */}
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.8rem',
                }}
              >
                {formattedDate}
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                {description}
              </Typography>

              {/* Money In/Out */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  mt: 1,
                }}
              >
                {debit > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                      }}
                    >
                      Money Out:{' '}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.error.main,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                       {formatCurrencyByCommaSeparation(debit.toFixed(2), commaSeparation, currencySymbol)}
                    </Typography>
                  </Box>
                )}

                {credit > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                      }}
                    >
                      Money In:{' '}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.success.main,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {formatCurrencyByCommaSeparation(credit.toFixed(2), commaSeparation, currencySymbol)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Action Icons */}
          {showDeleteIcon ? (
            <IconButton
              onClick={handleDeleteClick}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.error.main,
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : (
            <>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.text.primary,
                  },
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: 1,
                    mt: 1,
                  },
                }}
              >
                <MenuItem
                  onClick={handleDeleteClick}
                  sx={{
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.error.light,
                    },
                  }}
                >
                  <DeleteIcon
                    fontSize="small"
                    sx={{
                      mr: 1,
                    }}
                  />
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      open={deleteConfirmOpen}
      title="Delete Transaction"
      message="Are you sure you want to delete this transaction? This action cannot be undone."
      onClose={() => setDeleteConfirmOpen(false)}
      onConfirm={handleConfirmDelete}
      confirmText="Delete"
      confirmColor="error"
    />
    </>
  );
}
