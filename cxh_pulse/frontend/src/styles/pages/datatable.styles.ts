import type { SxProps, Theme } from '@mui/material/styles';

/**
 * DataTable Page Styles
 * 
 * Extracted styles for the data table page
 */

export const datatablePageStyles = {
    container: {
        px: 4,
        pb: 4,
    } as SxProps<Theme>,

    dateRangeWrapper: {
        flex: 1,
        minWidth: 0,
        maxWidth: '100%',
    } as SxProps<Theme>,
};
