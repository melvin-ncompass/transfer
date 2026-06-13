import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Help Page Styles
 * 
 * Extracted styles for the help and documentation page
 */

export const helpPageStyles = {
    container: {
        mx: 'auto',
        p: 5,
    } as SxProps<Theme>,

    header: {
        mb: 3,
    } as SxProps<Theme>,

    title: {
        fontWeight: 'bold',
        mb: 1,
    } as SxProps<Theme>,

    cardContent: {
        pt: 3,
    } as SxProps<Theme>,

    contentWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
    } as SxProps<Theme>,

    sectionTitle: {
        fontWeight: 600,
        mb: 1,
    } as SxProps<Theme>,

    list: {
        py: 0,
    } as SxProps<Theme>,

    listItem: {
        px: 0,
        py: 0.5,
    } as SxProps<Theme>,

    forecastDescription: {
        mb: 1,
    } as SxProps<Theme>,

    useCasesWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    } as SxProps<Theme>,

    useCaseTitle: {
        fontWeight: 500,
        mb: 0.5,
    } as SxProps<Theme>,

    divider: {
        my: 2,
    } as SxProps<Theme>,

    supportSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    } as SxProps<Theme>,

    supportTitle: {
        fontWeight: 500,
    } as SxProps<Theme>,

    aboutTitle: {
        fontWeight: 500,
        mb: 1,
    } as SxProps<Theme>,
};
