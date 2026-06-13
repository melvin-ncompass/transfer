import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Config View Styles
 * 
 * Extracted styles for the configuration view component
 */

export const configViewStyles = {
    container: {
        px: 2,
    } as SxProps<Theme>,

    cardContent: {
        pl: 1,
        pr: 1,
        pt: 1,
        pb: 0,
    } as SxProps<Theme>,

    thresholdValue: {
        fontWeight: 600,
        color: 'primary.main',
    } as SxProps<Theme>,

    minLabel: {
        minWidth: 40,
    } as SxProps<Theme>,

    maxLabel: {
        minWidth: 40,
        textAlign: 'right',
        fontSize: '12px',
    } as SxProps<Theme>,

    precipMinLabel: {
        minWidth: 50,
    } as SxProps<Theme>,

    precipMaxLabel: {
        minWidth: 50,
        textAlign: 'right',
    } as SxProps<Theme>,

    slider: {
        flex: 1,
        color: 'primary.main',
        '& .MuiSlider-thumb': {
            backgroundColor: 'white',
            border: '2px solid',
            borderColor: 'primary.main',
        },
        '& .MuiSlider-track': {
            backgroundColor: 'primary.main',
        },
    } as SxProps<Theme>,

    caption: {
        fontSize: '12px',
    } as SxProps<Theme>,

    impactPreview: {
        p: 1,
        backgroundColor: 'var(--brand-surface)',
        borderRadius: 1,
    } as SxProps<Theme>,

    impactList: {
        m: 0,
        pl: 2.5,
        listStyleType: 'disc',
        fontSize: '12px',
    } as SxProps<Theme>,

    impactListNormal: {
        m: 0,
        pl: 2.5,
        listStyleType: 'disc',
    } as SxProps<Theme>,

    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        mb: 2,
    } as SxProps<Theme>,

    saveButton: {
        mt: { xs: 2 },
        minWidth: 200,
        bgcolor: 'primary.main',
        '&:hover': {
            bgcolor: 'primary.dark',
        },
    } as SxProps<Theme>,

    snackbarAlert: {
        width: '100%',
    } as SxProps<Theme>,
};
