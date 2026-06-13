import { useState } from 'react';
import { Icon } from '@iconify/react';
import { CONFIG } from '../../src/config-global';
import {
    Box,
    Card,
    CardContent,
    Divider,
    Paper,
    Stack,
    Typography,
    useTheme,
    Chip,
    TextField,
    Switch,
    Checkbox,
    Radio,
    RadioGroup,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Modal,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Drawer,
    useMediaQuery,
    alpha,
} from '@mui/material';
import {
    PrimaryButton,
    SecondaryButton,
    OutlinedButton,
    ErrorButton,
} from '../../src/components/buttons';
import { Label } from '../../src/components/label';

// ----------------------------------------------------------------------

const navigationSections = [
    {
        id: 'foundation', title: 'Foundation', subsections: [
            { id: 'colors', title: 'Colors' },
            { id: 'typography', title: 'Typography' },
        ]
    },
    {
        id: 'components', title: 'Components', subsections: [
            { id: 'buttons', title: 'Buttons' },
            { id: 'labels', title: 'Labels' },
            { id: 'tables', title: 'Tables' },
            { id: 'dialogs', title: 'Dialogs' },
            { id: 'form-elements', title: 'Form Elements' },
            { id: 'snackbars', title: 'Snackbars' },
            { id: 'chips', title: 'Chips' },
        ]
    },
];

const Sidebar = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [activeSection, setActiveSection] = useState('');

    const handleNavClick = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(sectionId);
        }
    };

    return (
        <Box
            sx={{
                width: 220,
                flexShrink: 0,
                position: 'fixed',
                height: '100vh',
                overflowY: 'auto',
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: { xs: 'none', md: 'block' },
                pt: 3,
                px: 2,
                ml: 2,
                mr: 2,
            }}
        >
            <Typography variant="subtitle1" sx={{ px: 2, mb: 2, fontWeight: 600 }}>
                Navigation
            </Typography>
            <List component="nav" disablePadding>
                {navigationSections.map((section) => (
                    <Box key={section.id}>
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => handleNavClick(section.id)}
                                selected={activeSection === section.id}
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    '&.Mui-selected': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        color: 'primary.main',
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        },
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={section.title}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: 600,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                        {section.subsections.map((subsection) => (
                            <ListItem key={subsection.id} disablePadding>
                                <ListItemButton
                                    onClick={() => handleNavClick(subsection.id)}
                                    selected={activeSection === subsection.id}
                                    sx={{
                                        pl: 4,
                                        borderRadius: 1,
                                        mb: 0.5,
                                        '&.Mui-selected': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            color: 'primary.main',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                            },
                                        },
                                    }}
                                >
                                    <ListItemText
                                        primary={subsection.title}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </Box>
                ))}
            </List>
        </Box>
    );
};

// ----------------------------------------------------------------------

const CodeBlock = ({ code }: { code: string }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2,
            bgcolor: 'grey.900',
            color: 'grey.100',
            borderRadius: 1,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
        }}
    >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
    </Paper>
);

const ComponentSection = ({
    title,
    description,
    code,
    children,
}: {
    title: string;
    description?: string;
    code: string;
    children: React.ReactNode;
}) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {description}
                </Typography>
            )}

            {/* Preview */}
            <Paper elevation={0} sx={{ p: 3, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                {children}
            </Paper>

            {/* Code Snippet */}
            <Accordion
                expanded={expanded}
                onChange={() => setExpanded(!expanded)}
                sx={{
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:before': { display: 'none' },
                }}
            >
                <AccordionSummary
                    expandIcon={<Icon icon="eva:arrow-ios-downward-fill" width={20} />}
                    sx={{ bgcolor: 'background.neutral' }}
                >
                    <Typography variant="body2" fontWeight={600}>
                        {expanded ? 'Hide Code' : 'Show Code'}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <CodeBlock code={code} />
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

// ----------------------------------------------------------------------

export default function StyleGuidePage() {

    const theme = useTheme();
    // Color palettes - only colors used in the app
    const colorPalettes = [
        { name: 'Primary', colors: theme.palette.primary },
        { name: 'Info', colors: theme.palette.info },
        { name: 'Success', colors: theme.palette.success },
        { name: 'Warning', colors: theme.palette.warning },
        { name: 'Error', colors: theme.palette.error },
    ];

    const greyColors = [
        { shade: '100', color: theme.palette.grey[100] },
        { shade: '200', color: theme.palette.grey[200] },
        { shade: '300', color: theme.palette.grey[300] },
        { shade: '400', color: theme.palette.grey[400] },
        { shade: '500', color: theme.palette.grey[500] },
        { shade: '600', color: theme.palette.grey[600] },
        { shade: '700', color: theme.palette.grey[700] },
        { shade: '800', color: theme.palette.grey[800] },
    ];

    return (
        <>
            <title>{`Style Guide - ${CONFIG.appName}`}</title>

            <Box sx={{ display: 'flex' }}>
                <Sidebar />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        ml: { xs: 0, md: '240px' },
                        maxWidth: { xs: '100%', md: 'calc(100% - 240px)' },
                    }}
                >
                    <Stack spacing={4}>
                        {/* Header */}
                        <Box>
                            <Typography variant="h3" gutterBottom>
                                Style Guide
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Design system and component library for {CONFIG.appName}
                            </Typography>
                        </Box>

                        {/* Foundation Section */}
                        <Card id="foundation">
                            <CardContent>
                                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                                    Foundation
                                </Typography>

                                {/* Colors */}
                                <Box id="colors" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Colors
                                    </Typography>

                                    {/* Main Color Palettes */}
                                    <Stack spacing={2} sx={{ mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Core colors used throughout the application
                                        </Typography>
                                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                            {colorPalettes.map((palette) => (
                                                <Paper
                                                    key={palette.name}
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        minWidth: 140,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: '100%',
                                                            height: 64,
                                                            borderRadius: 1,
                                                            backgroundColor: palette.colors.main,
                                                            mb: 1.5,
                                                        }}
                                                    />
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {palette.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {palette.colors.main}
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Stack>

                                    {/* Grey Scale */}
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                            Grey Scale
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {greyColors.map((grey) => (
                                                <Paper
                                                    key={grey.shade}
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        minWidth: 80,
                                                        backgroundColor: grey.color,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: parseInt(grey.shade) > 400 ? 'white' : 'text.primary',
                                                        }}
                                                    >
                                                        {grey.shade}
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* Typography */}
                                <Box id="typography">
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Typography
                                    </Typography>

                                    <Stack spacing={3}>
                                        {/* H1 */}
                                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                        H1
                                                    </Typography>
                                                    <Typography variant="h1">How can you choose a typeface?</Typography>
                                                </Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        minWidth: 280,
                                                    }}
                                                >
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "fontWeight": 800,
  "fontSize": "3.5rem",
  "lineHeight": 1.21,
  "@media (min-width:600px)": {
    "fontSize": "4rem"
  },
  "@media (min-width:900px)": {
    "fontSize": "4.5rem"
  },
  "@media (min-width:1200px)": {
    "fontSize": "5rem"
  }
}`}</pre>
                                                </Paper>
                                            </Stack>
                                        </Paper>

                                        {/* H2 */}
                                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                        H2
                                                    </Typography>
                                                    <Typography variant="h2">How can you choose a typeface?</Typography>
                                                </Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        minWidth: 280,
                                                    }}
                                                >
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "fontWeight": 800,
  "fontSize": "2.5rem",
  "lineHeight": 1.25,
  "@media (min-width:600px)": {
    "fontSize": "3rem"
  },
  "@media (min-width:900px)": {
    "fontSize": "3.5rem"
  },
  "@media (min-width:1200px)": {
    "fontSize": "4rem"
  }
}`}</pre>
                                                </Paper>
                                            </Stack>
                                        </Paper>

                                        {/* H3 */}
                                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                        H3
                                                    </Typography>
                                                    <Typography variant="h3">How can you choose a typeface?</Typography>
                                                </Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        minWidth: 280,
                                                    }}
                                                >
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "fontWeight": 700,
  "fontSize": "2rem",
  "lineHeight": 1.5,
  "@media (min-width:600px)": {
    "fontSize": "2.25rem"
  },
  "@media (min-width:900px)": {
    "fontSize": "2.5rem"
  },
  "@media (min-width:1200px)": {
    "fontSize": "3rem"
  }
}`}</pre>
                                                </Paper>
                                            </Stack>
                                        </Paper>

                                        {/* H4 */}
                                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                        H4
                                                    </Typography>
                                                    <Typography variant="h4">How can you choose a typeface?</Typography>
                                                </Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        minWidth: 280,
                                                    }}
                                                >
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "fontWeight": 700,
  "fontSize": "1.5rem",
  "lineHeight": 1.5,
  "@media (min-width:600px)": {
    "fontSize": "1.75rem"
  },
  "@media (min-width:900px)": {
    "fontSize": "2rem"
  }
}`}</pre>
                                                </Paper>
                                            </Stack>
                                        </Paper>

                                        {/* H5 */}
                                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                        H5
                                                    </Typography>
                                                    <Typography variant="h5">How can you choose a typeface?</Typography>
                                                </Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        minWidth: 280,
                                                    }}
                                                >
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "fontWeight": 700,
  "fontSize": "1.25rem",
  "lineHeight": 1.5,
  "@media (min-width:600px)": {
    "fontSize": "1.5rem"
  }
}`}</pre>
                                                </Paper>
                                            </Stack>
                                        </Paper>

                                        {/* H6 */}
                                        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                        H6
                                                    </Typography>
                                                    <Typography variant="h6">How can you choose a typeface?</Typography>
                                                </Box>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        minWidth: 280,
                                                    }}
                                                >
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "fontWeight": 700,
  "fontSize": "1.125rem",
  "lineHeight": 1.56
}`}</pre>
                                                </Paper>
                                            </Stack>
                                        </Paper>

                                        {/* Body Text */}
                                        <Box sx={{ mt: 4 }}>
                                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                                Body Text
                                            </Typography>
                                            <ComponentSection
                                                title="Body 1"
                                                description="Default body text for main content and paragraphs"
                                                code={`<Typography variant="body1">
  This is body1 text - used for main content, 
  paragraphs, and general text throughout the application.
</Typography>`}
                                            >
                                                <Typography variant="body1">
                                                    This is body1 text - used for main content, paragraphs, and general text throughout the application.
                                                </Typography>
                                            </ComponentSection>

                                            <ComponentSection
                                                title="Body 2"
                                                description="Smaller body text for supporting content"
                                                code={`<Typography variant="body2">
  This is body2 text - used for secondary content, 
  descriptions, and supporting information.
</Typography>`}
                                            >
                                                <Typography variant="body2">
                                                    This is body2 text - used for secondary content, descriptions, and supporting information.
                                                </Typography>
                                            </ComponentSection>
                                        </Box>

                                        {/* Subtitles */}
                                        <Box sx={{ mt: 4 }}>
                                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                                Subtitles
                                            </Typography>
                                            <ComponentSection
                                                title="Subtitle 1"
                                                description="Larger subtitle for section headers"
                                                code={`<Typography variant="subtitle1">
  This is subtitle1 - larger subtitle text
</Typography>`}
                                            >
                                                <Typography variant="subtitle1">
                                                    This is subtitle1 - larger subtitle text
                                                </Typography>
                                            </ComponentSection>

                                            <ComponentSection
                                                title="Subtitle 2"
                                                description="Smaller subtitle for subsections"
                                                code={`<Typography variant="subtitle2">
  This is subtitle2 - smaller subtitle text
</Typography>`}
                                            >
                                                <Typography variant="subtitle2">
                                                    This is subtitle2 - smaller subtitle text
                                                </Typography>
                                            </ComponentSection>
                                        </Box>

                                        {/* Caption & Overline */}
                                        <Box sx={{ mt: 4 }}>
                                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                                Caption & Overline
                                            </Typography>
                                            <ComponentSection
                                                title="Caption"
                                                description="Small text for labels, hints, and metadata"
                                                code={`<Typography variant="caption">
  This is caption text - used for labels and hints
</Typography>`}
                                            >
                                                <Typography variant="caption">
                                                    This is caption text - used for labels and hints
                                                </Typography>
                                            </ComponentSection>

                                            <ComponentSection
                                                title="Overline"
                                                description="Uppercase text for categories and labels"
                                                code={`<Typography variant="overline">
  This is overline text
</Typography>`}
                                            >
                                                <Typography variant="overline">
                                                    This is overline text
                                                </Typography>
                                            </ComponentSection>
                                        </Box>

                                        {/* Text Colors */}
                                        <Box sx={{ mt: 4 }}>
                                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                                Text Colors
                                            </Typography>
                                            <ComponentSection
                                                title="Color Variants"
                                                description="Apply different colors to text"
                                                code={`// Default text
<Typography variant="body1">
  Default text color
</Typography>

// Secondary text
<Typography variant="body1" color="text.secondary">
  Secondary text color
</Typography>

// Primary color
<Typography variant="body1" color="primary">
  Primary color text
</Typography>

// Success color
<Typography variant="body1" color="success.main">
  Success color text
</Typography>

// Error color
<Typography variant="body1" color="error">
  Error color text
</Typography>

// Warning color
<Typography variant="body1" color="warning.main">
  Warning color text
</Typography>

// Info color
<Typography variant="body1" color="info.main">
  Info color text
</Typography>`}
                                            >
                                                <Stack spacing={1}>
                                                    <Typography variant="body1">Default text color</Typography>
                                                    <Typography variant="body1" color="text.secondary">Secondary text color</Typography>
                                                    <Typography variant="body1" color="primary">Primary color text</Typography>
                                                    <Typography variant="body1" color="success.main">Success color text</Typography>
                                                    <Typography variant="body1" color="error">Error color text</Typography>
                                                    <Typography variant="body1" color="warning.main">Warning color text</Typography>
                                                    <Typography variant="body1" color="info.main">Info color text</Typography>
                                                </Stack>
                                            </ComponentSection>
                                        </Box>
                                    </Stack>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Components Section */}
                        <Card id="components">
                            <CardContent>
                                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                                    Components
                                </Typography>

                                {/* Buttons */}
                                <Box id="buttons" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Buttons
                                    </Typography>

                                    <ComponentSection
                                        title="Primary Button"
                                        description="For main/primary actions like form submissions"
                                        code={`import { PrimaryButton } from 'src/components/buttons';

<PrimaryButton onClick={handleSubmit}>
  Submit Form
</PrimaryButton>

// With icon
<PrimaryButton 
  startIcon={<Icon icon="eva:plus-fill" />}
  onClick={handleCreate}
>
  Add New
</PrimaryButton>

// Loading state
<PrimaryButton loading>
  Loading...
</PrimaryButton>`}
                                    >
                                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                            <PrimaryButton>Primary</PrimaryButton>
                                            <PrimaryButton startIcon={<Icon icon="eva:plus-fill" />}>
                                                With Icon
                                            </PrimaryButton>
                                            <PrimaryButton loading>Loading</PrimaryButton>
                                            <PrimaryButton disabled>Disabled</PrimaryButton>
                                        </Stack>
                                    </ComponentSection>

                                    <ComponentSection
                                        title="Outlined Button"
                                        description="For less prominent actions like Cancel buttons"
                                        code={`import { OutlinedButton } from 'src/components/buttons';

<OutlinedButton onClick={handleCancel}>
  Cancel
</OutlinedButton>`}
                                    >
                                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                            <OutlinedButton>Outlined</OutlinedButton>
                                            <OutlinedButton color="secondary">Secondary</OutlinedButton>
                                            <OutlinedButton disabled>Disabled</OutlinedButton>
                                        </Stack>
                                    </ComponentSection>
                                </Box>

                                {/* Labels */}
                                <Box id="labels" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Labels
                                    </Typography>

                                    <ComponentSection
                                        title="Label Component"
                                        description="Status badges and tags for visual categorization"
                                        code={`import { Label } from 'src/components/label';

// Soft variant (default)
<Label color="success" variant="soft">
  Active
</Label>

// Filled variant
<Label color="error" variant="filled">
  Inactive
</Label>

// Outlined variant
<Label color="warning" variant="outlined">
  Pending
</Label>

// With icons
<Label 
  color="success" 
  startIcon={<Icon icon="eva:checkmark-fill" width={16} />}
>
  Approved
</Label>`}
                                    >
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    Soft Variant
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Label color="default" variant="soft">
                                                        Default
                                                    </Label>
                                                    <Label color="primary" variant="soft">
                                                        Primary
                                                    </Label>
                                                    <Label color="success" variant="soft">
                                                        Success
                                                    </Label>
                                                    <Label color="error" variant="soft">
                                                        Error
                                                    </Label>
                                                    <Label color="warning" variant="soft">
                                                        Warning
                                                    </Label>
                                                    <Label color="info" variant="soft">
                                                        Info
                                                    </Label>
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    Filled Variant
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Label color="primary" variant="filled">
                                                        Primary
                                                    </Label>
                                                    <Label color="success" variant="filled">
                                                        Success
                                                    </Label>
                                                    <Label color="error" variant="filled">
                                                        Error
                                                    </Label>
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    With Icons
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Label
                                                        color="success"
                                                        variant="soft"
                                                        startIcon={<Icon icon="eva:checkmark-fill" width={16} />}
                                                    >
                                                        Approved
                                                    </Label>
                                                    <Label
                                                        color="error"
                                                        variant="soft"
                                                        startIcon={<Icon icon="eva:close-fill" width={16} />}
                                                    >
                                                        Rejected
                                                    </Label>
                                                    <Label
                                                        color="warning"
                                                        variant="soft"
                                                        startIcon={<Icon icon="eva:clock-outline" width={16} />}
                                                    >
                                                        Pending
                                                    </Label>
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </ComponentSection>
                                </Box>

                                {/* Tables */}
                                <Box id="tables" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Tables
                                    </Typography>

                                    <ComponentSection
                                        title="DataTable"
                                        description="Interactive table with search, pagination, and filtering. Use for managing collections."
                                        code={`import { DataTable } from 'src/components/tables/data-table';

const [filterName, setFilterName] = useState('');

<DataTable
  columns={[
    { id: 'name', label: 'Name', align: 'left' },
    { id: 'email', label: 'Email', align: 'left' },
    { id: 'role', label: 'Role', align: 'center' },
    { id: 'actions', label: 'Actions', align: 'right' },
  ]}
  rows={users}
  getRowId={(row) => row.id}
  filterName={filterName}
  onFilterName={(e) => setFilterName(e.target.value)}
  renderCells={(row) => [
    row.name,
    row.email,
    <Label color="success">{row.role}</Label>,
    <IconButton>
      <Icon icon="eva:more-vertical-fill" />
    </IconButton>,
  ]}
  action={
    <PrimaryButton 
      startIcon={<Icon icon="eva:plus-fill" />}
      onClick={handleAdd}
    >
      Add New
    </PrimaryButton>
  }
  loading={isLoading}
  rowsPerPageOptions={[5, 10, 25]}
/>`}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Features: Built-in search, pagination, custom filtering, clickable rows, action buttons
                                        </Typography>
                                    </ComponentSection>

                                    <ComponentSection
                                        title="BasicTable"
                                        description="Simple table without pagination. Use for small, static lists (< 20 items)."
                                        code={`import { BasicTable } from 'src/components/tables/basic-table';

const columns = [
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'status', label: 'Status', align: 'center' },
];

const data = [
  { id: 1, name: 'John Doe', status: 'Active' },
  { id: 2, name: 'Jane Smith', status: 'Inactive' },
];

<BasicTable
  columns={columns}
  rows={data}
  getRowId={(row) => row.id}
  renderCells={(row) => [
    row.name,
    <Label color={row.status === 'Active' ? 'success' : 'error'}>
      {row.status}
    </Label>,
  ]}
/>`}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Features: Clean minimal styling, custom cell rendering, responsive alignment
                                        </Typography>
                                    </ComponentSection>
                                </Box>

                                {/* Dialogs */}
                                <Box id="dialogs" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Dialogs
                                    </Typography>

                                    <ComponentSection
                                        title="ConfirmDialog"
                                        description="Reusable confirmation dialog for destructive actions"
                                        code={`import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'minimal-shared/hooks';

const dialog = useBoolean();

// Trigger
<ErrorButton onClick={dialog.onTrue}>
  Delete User
</ErrorButton>

// Dialog
<ConfirmDialog
  open={dialog.value}
  onClose={dialog.onFalse}
  title="Delete User"
  content="Are you sure you want to delete this user? This action cannot be undone."
  action={
    <ErrorButton onClick={handleDelete}>
      Delete
    </ErrorButton>
  }
  onCancel={dialog.onFalse}
/>`}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Always use with destructive actions. Provides consistent UX for confirmations.
                                        </Typography>
                                    </ComponentSection>

                                    <ComponentSection
                                        title="Modal Forms"
                                        description="Full-screen or centered modals for complex forms"
                                        code={`import { Modal, Box, Card, CardHeader, IconButton } from '@mui/material';
import { Iconify } from '../../src/components/iconify';

const [open, setOpen] = useState(false);

<Modal open={open} onClose={() => setOpen(false)}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 600,
      maxWidth: '90%',
    }}
  >
    <Card>
      <CardHeader
        title="Invite User"
        action={
          <IconButton onClick={() => setOpen(false)}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        }
      />
      {/* Form content here */}
    </Card>
  </Box>
</Modal>`}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Used for complex forms like InviteUserForm and CreateRoleForm. Provides full-screen overlay with card-based content.
                                        </Typography>
                                    </ComponentSection>
                                </Box>

                                {/* Snackbars */}
                                <Box id="snackbars" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Snackbars
                                    </Typography>

                                    <ComponentSection
                                        title="Snackbar Notifications"
                                        description="Toast notifications for user feedback"
                                        code={`import { Snackbar, Alert } from '@mui/material';

const [snackbarOpen, setSnackbarOpen] = useState(false);

// Success message
<Snackbar
  open={snackbarOpen}
  autoHideDuration={5000}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert 
    onClose={() => setSnackbarOpen(false)} 
    severity="success" 
    sx={{ width: '100%' }}
  >
    Action completed successfully!
  </Alert>
</Snackbar>

// Error message
<Snackbar
  open={snackbarOpen}
  autoHideDuration={6000}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert 
    onClose={() => setSnackbarOpen(false)} 
    severity="error"
    sx={{ width: '100%' }}
  >
    An error occurred. Please try again.
  </Alert>
</Snackbar>

// With state management
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'success' as 'success' | 'error',
});

const handleCloseSnackbar = () => {
  setSnackbar((prev) => ({ ...prev, open: false }));
};

// Show success
setSnackbar({
  open: true,
  message: 'Operation completed!',
  severity: 'success',
});

// Show error
setSnackbar({
  open: true,
  message: 'Operation failed!',
  severity: 'error',
});`}
                                    >
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    Severity Variants
                                                </Typography>
                                                <Stack spacing={2}>
                                                    <Alert severity="success">Success - Action completed successfully!</Alert>
                                                    <Alert severity="error">Error - Something went wrong.</Alert>
                                                    <Alert severity="warning">Warning - Please review this action.</Alert>
                                                    <Alert severity="info">Info - Here is some information.</Alert>
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    With Close Button
                                                </Typography>
                                                <Stack spacing={2}>
                                                    <Alert severity="success" onClose={() => { }}>
                                                        You can close this notification
                                                    </Alert>
                                                    <Alert severity="error" onClose={() => { }}>
                                                        Error with close button
                                                    </Alert>
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                                    <strong>Usage Guidelines:</strong>
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" component="div">
                                                    • <strong>Success:</strong> User invitations sent, role created, settings saved
                                                    <br />
                                                    • <strong>Error:</strong> Login failed, validation errors, network issues
                                                    <br />
                                                    • <strong>Warning:</strong> Unsaved changes, temporary issues
                                                    <br />
                                                    • <strong>Info:</strong> General information, tips
                                                    <br />
                                                    • Position at bottom-center for visibility
                                                    <br />
                                                    • Auto-hide after 5-6 seconds
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </ComponentSection>
                                </Box>

                                {/* Form Elements */}
                                <Box id="form-elements" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Form Elements
                                    </Typography>

                                    <ComponentSection
                                        title="Text Fields"
                                        description="Standard input fields for forms"
                                        code={`import { TextField } from '@mui/material';

<TextField 
  fullWidth 
  label="Name" 
  placeholder="Enter name..." 
/>

<TextField
  fullWidth
  required
  label="Email"
  type="email"
  helperText="We will never share your email"
/>

<TextField
  fullWidth
  error
  label="Password"
  helperText="Password is required"
/>`}
                                    >
                                        <Stack spacing={2} sx={{ maxWidth: 600 }}>
                                            <TextField fullWidth label="Standard" placeholder="Enter text..." />
                                            <TextField
                                                fullWidth
                                                required
                                                label="Required"
                                                placeholder="Enter text..."
                                            />
                                            <TextField
                                                fullWidth
                                                error
                                                label="Error"
                                                helperText="This field has an error"
                                            />
                                        </Stack>
                                    </ComponentSection>

                                    <ComponentSection
                                        title="Selection Controls"
                                        description="Switches, checkboxes, and radio buttons"
                                        code={`import { Switch, Checkbox, Radio, FormControlLabel } from '@mui/material';

// Switch
<FormControlLabel 
  control={<Switch defaultChecked />} 
  label="Enable notifications" 
/>

// Checkbox
<FormControlLabel 
  control={<Checkbox defaultChecked />} 
  label="I agree to terms" 
/>

// Radio
<RadioGroup defaultValue="option1">
  <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
  <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
</RadioGroup>`}
                                    >
                                        <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                                    Switches
                                                </Typography>
                                                <Stack spacing={1}>
                                                    <FormControlLabel control={<Switch defaultChecked />} label="Checked" />
                                                    <FormControlLabel control={<Switch />} label="Unchecked" />
                                                </Stack>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                                    Checkboxes
                                                </Typography>
                                                <Stack spacing={1}>
                                                    <FormControlLabel control={<Checkbox defaultChecked />} label="Checked" />
                                                    <FormControlLabel control={<Checkbox />} label="Unchecked" />
                                                </Stack>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                                    Radio Buttons
                                                </Typography>
                                                <RadioGroup defaultValue="option1">
                                                    <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
                                                    <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
                                                </RadioGroup>
                                            </Box>
                                        </Stack>
                                    </ComponentSection>
                                </Box>

                                {/* Chips */}
                                <Box id="chips" sx={{ mb: 5 }}>
                                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                        Chips
                                    </Typography>

                                    <ComponentSection
                                        title="Chips"
                                        description="Compact elements for tags, filters, and selections"
                                        code={`import { Chip } from '@mui/material';

// Basic chip
<Chip label="Tag" />

// Colored chips
<Chip label="Primary" color="primary" />
<Chip label="Success" color="success" />

// Outlined variant
<Chip label="Outlined" variant="outlined" color="primary" />

// Clickable
<Chip label="Filter" onClick={handleClick} />

// Deletable
<Chip label="Remove" onDelete={handleDelete} />

// With icon
<Chip 
  label="Star" 
  icon={<Icon icon="eva:star-fill" />}
  color="warning"
/>`}
                                    >
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    Filled
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Chip label="Default" />
                                                    <Chip label="Primary" color="primary" />
                                                    <Chip label="Success" color="success" />
                                                    <Chip label="Error" color="error" />
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    Outlined
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Chip label="Default" variant="outlined" />
                                                    <Chip label="Primary" color="primary" variant="outlined" />
                                                    <Chip label="Success" color="success" variant="outlined" />
                                                </Stack>
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                    Interactive
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Chip label="Clickable" onClick={() => { }} color="primary" />
                                                    <Chip label="Deletable" onDelete={() => { }} color="secondary" />
                                                    <Chip
                                                        label="With Icon"
                                                        icon={<Icon icon="eva:star-fill" width={20} />}
                                                        color="warning"
                                                    />
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </ComponentSection>
                                </Box>
                            </CardContent>
                        </Card>
                    </Stack>
                </Box>
            </Box>
        </>
    );
}
