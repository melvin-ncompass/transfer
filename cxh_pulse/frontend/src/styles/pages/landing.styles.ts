import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Landing View Styles
 *
 * Extracted styles for the landing view component
 */

export const landingViewStyles = {
  // Main container
  container: {
    height: '100vh',
    width: '100%',
    bgcolor: 'background.default',
    position: 'relative',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none', // Hide scrollbar for Firefox
    '&::-webkit-scrollbar': {
      display: 'none', // Hide scrollbar for Chrome/Safari/Edge
    },
  } as SxProps<Theme>,

  // Flip card container
  flipCardContainer: (isFlipped: boolean) => ({
    perspective: '1000px',
    width: '100%',
    minHeight: isFlipped ? '75vh' : '85vh',
    position: 'relative',
    top: 0,
    left: 0,
    mb: { xs: 4 }, // Add margin bottom to prevent overlap with bottom content
    zIndex: 1,
    }) as SxProps<Theme>,

  // Flip card inner
  flipCardInner: (isFlipped: boolean, isAnimating: boolean = false) =>
    ({
      position: 'relative',
      width: '100%',
      minHeight: isFlipped ? '75vh' : '85vh',
      height: 'auto', // Allow height to grow with content
      transformStyle: 'preserve-3d',
      WebkitTransformStyle: 'preserve-3d',  // Safari prefix
      transition: 'transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1)',
      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',  // Use positive rotation (fixes Firefox)
    }) as SxProps<Theme>,

  // Hero section
  heroFace: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    mt: { xs: '-64px', md: '-72px' },
    pt: { xs: '64px', md: '72px' },
    zIndex: 1,
    } as SxProps<Theme>,

  heroContainer: {
    px: 3,
  } as SxProps<Theme>,

  heroTitle: {
    fontSize: { xs: '2.5rem', md: '3rem', lg: '3.75rem' },
    fontWeight: 700,
    color: 'common.white',
    mb: 8,
  } as SxProps<Theme>,

  heroSubtitle: {
    color: 'grey.100',
    mb: 4,
    maxWidth: '800px',
  } as SxProps<Theme>,

  heroButton: {
    px: 4,
    py: 1.5,
    fontSize: '1.125rem',
    textTransform: 'none',
    maxWidth: '250px'
  } as SxProps<Theme>,

  // Back face - Auth section
  authFace: {
    position: 'absolute',
    width: '100%',
    minHeight: '85vh',
    height: '100%', // Match parent height set by JS
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    MozBackfaceVisibility: 'hidden',  // Firefox prefix
    transform: 'rotateY(180deg)',  // Use positive rotation for back face (fixes Firefox)
    bgcolor: 'background.default',
    overflow: 'visible' as const,
  } as SxProps<Theme>,

  authStandaloneFace: {
    position: 'relative',
    width: '100%',
    minHeight: '85vh',
    height: '100%',
    bgcolor: 'background.default',
    overflow: 'visible' as const,
} as SxProps<Theme>,

  // Auth face content wrapper - allows content to determine height
  authFaceContent: {
    width: '100%',
    minHeight: '85vh',
    display: 'flex',
    // alignItems: 'center',
    justifyContent: 'center',
    pt: { xs: '80px', md: '88px' }, // Account for header height + padding
    pb: { xs: 6 }, // Extra bottom padding to prevent overlap
  } as SxProps<Theme>,

  // Back face - Data Integration section
  dataIntegrationFace: {
    position: 'absolute',
    width: '100%',
    minHeight: '85vh',
    height: '100%', // Match parent height set by JS
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    MozBackfaceVisibility: 'hidden',  // Firefox prefix
    transform: 'rotateY(180deg)',  // Use positive rotation for back face (fixes Firefox)
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    bgcolor: 'background.default',
    py: { xs: 2, md: 3 },
    px: { xs: 1, md: 0 },
    overflowY: 'visible' as const, // Let content determine scrolling
    // pb: { xs: 6 }, // Extra bottom padding to prevent overlap
  } as SxProps<Theme>,

  flippedcard: {
    py: 8,
    opacity: 0,
    animation: 'fadeIn 0.8s ease-out 0.4s forwards',
    '@keyframes fadeIn': {
      '0%': { opacity: 0, transform: 'translateY(10px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    }
  } as SxProps<Theme>,

  flipAnimation: (hideSection: boolean) => ({
    visibility: hideSection ? 'hidden' : 'visible',
    opacity: hideSection ? 0 : 1,
    pointerEvents: hideSection ? 'none' : 'auto',
    height: hideSection ? 0 : 'auto',
    overflow: 'hidden',
    transition: hideSection
      ? 'opacity 0.3s, height 0s 0.3s, visibility 0s 0.3s'
      : 'height 0s, visibility 0s, opacity 0.8s ease 0.8s',
  }) as SxProps<Theme>,

  authCard: (heroImage: string) =>
    ({
      position: 'relative',
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      borderRadius: 3,
      overflow: 'hidden',
      width: '100%',
    }) as SxProps<Theme>,

  headerWrapperStyles : { 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 1100, 
    position: 'absolute' as const, 
  },
  authCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    bgcolor: 'background.paper',
    opacity: 0.95,
  } as SxProps<Theme>,

  authCardContent: {
    position: 'relative',
    zIndex: 1,
    p: { xs: 2, md: 4 },
    pt: { xs: 3, md: 4 }, // Extra top padding to prevent header cutoff
    pb: { xs: 4, md: 4 }, // Extra bottom padding to prevent content cutoff
  } as SxProps<Theme>,

  backButton: {
    mb: 0,
    textTransform: 'none',
  } as SxProps<Theme>,

  authContainer: {
    width: '100%',
  } as SxProps<Theme>,

  // Main content
  mainContent: {
    px: 3,
    position: 'relative',
    zIndex: 2,
    } as SxProps<Theme>,

  // Section styles
  section: {
    // mb: 8,
    mt: 2,
  } as SxProps<Theme>,

  sectionTitle: {
    fontSize: { xs: '2rem', md: '2.5rem' },
    fontWeight: 700,
    mb: 2,
    mt: 1,
    textAlign: 'center',
    color: 'primary.main',
  } as SxProps<Theme>,

  sectionSubtitle: {
    textAlign: 'center',
    color: 'text.secondary',
    mb: 6,
    maxWidth: '768px',
    mx: 'auto',
  } as SxProps<Theme>,

  cardsStack: {
    mt: 4,
  } as SxProps<Theme>,

  card: {
    flex: 1,
  } as SxProps<Theme>,

  iconPrimary: {
    color: 'primary.main',
    mb: 1,
  } as SxProps<Theme>,

  dataSourceIcon: (color: string) =>
    ({
      color,
      mt: 0.5,
      flexShrink: 0,
    }) as SxProps<Theme>,

  listStack: {
    mt: 2,
  } as SxProps<Theme>,

  featureItemsStack: {
    mt: 2,
  } as SxProps<Theme>,

  // Methodology section
  methodologyCard: {
    maxWidth: '896px',
    mx: 'auto',
  } as SxProps<Theme>,

  methodologyContent: {
    pt: 3,
  } as SxProps<Theme>,

  orderedList: {
    m: 0,
    pl: 3,
    '& li': {
      mb: 2,
      '&:last-child': { mb: 0 },
    },
  } as SxProps<Theme>,

  // Footer
  footer: (dividerColor: string) =>
    ({
      textAlign: 'center',
      py: 2,
      borderTop: `1px solid ${dividerColor}`,
    }) as SxProps<Theme>,
};
