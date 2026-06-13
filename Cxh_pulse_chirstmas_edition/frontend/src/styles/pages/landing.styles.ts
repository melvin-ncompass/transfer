import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Landing View Styles
 * 
 * Extracted styles for the landing view component
 */

export const landingViewStyles = {
  // Main container
  container: {
    minHeight: '100vh',
    bgcolor: 'background.default',
    position: 'relative',
    overflow: 'hidden',
  } as SxProps<Theme>,

  // Flip card container
  flipCardContainer: {
    width: '100%',
    minHeight: '85vh',
    position: 'relative',
    overflow: 'hidden',
    // Shake animation when flipped
    animation: (theme) => 'none', 
    '@keyframes shake': {
      '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
      '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
      '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
      '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
    },
    // More fall variations for chaos
    '@keyframes fall-1': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(-15deg)', opacity: 0 } },
    '@keyframes fall-2': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(25deg)', opacity: 0 } },
    '@keyframes fall-3': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(-30deg)', opacity: 0 } },
    '@keyframes fall-4': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(10deg)', opacity: 0 } },
    '@keyframes fall-5': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(-5deg)', opacity: 0 } },
    '@keyframes fall-6': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(45deg)', opacity: 0 } },
    '@keyframes fall-7': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(-45deg)', opacity: 0 } },
    '@keyframes fall-8': { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(120vh) rotate(60deg)', opacity: 0 } },
    
    // Snowfall Animation
    '@keyframes snowfall': {
      '0%': { transform: 'translateY(-10px) translateX(0)', opacity: 1 },
      '100%': { transform: 'translateY(100vh) translateX(20px)', opacity: 0.3 }
    },
    
    // Santa Flying Animation
    '@keyframes santa-fly': {
      '0%': { left: '-20%', top: '20%', transform: 'rotate(5deg) scale(0.8)' },
      '25%': { top: '10%', transform: 'rotate(-5deg) scale(0.9)' },
      '50%': { top: '25%', transform: 'rotate(5deg) scale(1)' },
      '75%': { top: '15%', transform: 'rotate(-5deg) scale(0.9)' },
      '100%': { left: '120%', top: '20%', transform: 'rotate(5deg) scale(0.8)' }
    }
  } as SxProps<Theme>,

  // Flip card inner - Container
  flipCardInner: (isFlipped: boolean) => ({
    position: 'relative',
    width: '100%',
    minHeight: '85vh',
  } as SxProps<Theme>),

  // Snowflake Style
  snowflake: (index: number, isFlipped: boolean) => {
    const size = Math.random() * 5 + 3; // Random size 3-8px
    const left = Math.random() * 100; // Random horizontal position
    const duration = Math.random() * 3 + 2; // Random duration 2-5s
    const delay = Math.random() * 2; // Random delay
    
    return {
      position: 'absolute',
      top: -10,
      left: `${left}%`,
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: 'white',
      opacity: isFlipped ? 0.8 : 0,
      filter: 'blur(1px)',
      zIndex: 5, // Above background, below text
      animation: isFlipped ? `snowfall ${duration}s linear infinite ${delay}s` : 'none',
    } as SxProps<Theme>;
  },

  // Santa Container Style
  santaContainer: (isFlipped: boolean) => ({
    position: 'absolute',
    width: '200px',
    height: 'auto',
    zIndex: 20, // On top of everything
    opacity: isFlipped ? 1 : 0,
    animation: isFlipped ? 'santa-fly 8s linear forwards 1s' : 'none', // Starts after 1s delay
    pointerEvents: 'none',
  } as SxProps<Theme>),

  // Shard Styles (for the earthquake effect)
  shard: (heroImage: string, index: number, isFlipped: boolean) => {
    // 5x4 Grid of Shards (20 total)
    // Manually defined jagged polygons to cover the area roughly
    const clipPaths = [
      // Row 1 (Top)
      'polygon(0% 0%, 20% 0%, 25% 25%, 0% 20%)',
      'polygon(20% 0%, 40% 0%, 45% 20%, 25% 25%)',
      'polygon(40% 0%, 60% 0%, 55% 25%, 45% 20%)',
      'polygon(60% 0%, 80% 0%, 75% 20%, 55% 25%)',
      'polygon(80% 0%, 100% 0%, 100% 25%, 75% 20%)',
      
      // Row 2
      'polygon(0% 20%, 25% 25%, 20% 50%, 0% 45%)',
      'polygon(25% 25%, 45% 20%, 50% 45%, 20% 50%)',
      'polygon(45% 20%, 55% 25%, 60% 50%, 50% 45%)',
      'polygon(55% 25%, 75% 20%, 80% 45%, 60% 50%)',
      'polygon(75% 20%, 100% 25%, 100% 50%, 80% 45%)',
      
      // Row 3
      'polygon(0% 45%, 20% 50%, 25% 75%, 0% 70%)',
      'polygon(20% 50%, 50% 45%, 45% 70%, 25% 75%)',
      'polygon(50% 45%, 60% 50%, 65% 75%, 45% 70%)',
      'polygon(60% 50%, 80% 45%, 75% 70%, 65% 75%)',
      'polygon(80% 45%, 100% 50%, 100% 75%, 75% 70%)',
      
      // Row 4 (Bottom)
      'polygon(0% 70%, 25% 75%, 20% 100%, 0% 100%)',
      'polygon(25% 75%, 45% 70%, 40% 100%, 20% 100%)',
      'polygon(45% 70%, 65% 75%, 60% 100%, 40% 100%)',
      'polygon(65% 75%, 75% 70%, 80% 100%, 60% 100%)',
      'polygon(75% 70%, 100% 75%, 100% 100%, 80% 100%)',
    ];
    
    // Random delays for "crumbling" feel
    const delays = [
      '0.05s', '0.1s', '0.15s', '0.0s', '0.2s',
      '0.25s', '0.1s', '0.3s', '0.15s', '0.05s',
      '0.1s', '0.2s', '0.05s', '0.3s', '0.25s',
      '0.3s', '0.15s', '0.2s', '0.1s', '0.0s'
    ];
    
    // Assign random fall animation (1-8)
    const fallAnim = (index % 8) + 1;
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      clipPath: clipPaths[index] || 'none',
      zIndex: 10, 
      pointerEvents: 'none',
      opacity: isFlipped ? 1 : 0, 
      // Animate when flipped
      animation: isFlipped ? `fall-${fallAnim} 1.5s ease-in forwards ${delays[index]}` : 'none',
    } as SxProps<Theme>;
  },

  // Front face - Hero section (Static View)
  heroFace: (heroImage: string, isFlipped: boolean) => ({
    position: 'absolute',
    width: '100%',
    height: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // We hide the static background when flipped, so the shards take over
    backgroundImage: isFlipped ? 'none' : `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: 1,
    
    // Content falls with the center shard roughly
    transition: 'all 0.5s ease-in',
    opacity: isFlipped ? 0 : 1,
    transform: isFlipped ? 'translateY(50px)' : 'translateY(0)',
    pointerEvents: isFlipped ? 'none' : 'auto',
  } as SxProps<Theme>),

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
  } as SxProps<Theme>,

  // Back face - Auth section (Revealed underneath)
  authFace: (isFlipped: boolean, heroImage: string) => ({
    position: 'absolute',
    width: '100%',
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: 4,
    zIndex: 0, // Underneath the shards
    opacity: isFlipped ? 1 : 0,
    transition: 'opacity 0.5s ease-in 0.5s', // Fade in after shake
    overflow: 'hidden', // Contain the blurred edges
    
    // Use pseudo-element for blurred background to hide the "ghost" UI in the image
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${heroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: 'blur(8px)', // Blur out the fake form/text
      transform: 'scale(1.1)', // Prevent white edges from blur
      zIndex: -1,
    },
  } as SxProps<Theme>),

  authCard: (heroImage: string) => ({
    position: 'relative',
    bgcolor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  } as SxProps<Theme>),

  authCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    bgcolor: 'background.paper',
    opacity: 0.4,
  } as SxProps<Theme>,

  authCardContent: {
    position: 'relative',
    zIndex: 1,
    p: 4,
  } as SxProps<Theme>,

  backButton: {
    mb: 2,
    textTransform: 'none',
  } as SxProps<Theme>,

  authContainer: {
    minHeight: '400px',
  } as SxProps<Theme>,

  // Main content
  mainContent: {
    py: 4,
    px: 3,
  } as SxProps<Theme>,

  // Section styles
  section: {
    mb: 8,
  } as SxProps<Theme>,

  sectionTitle: {
    fontSize: { xs: '2rem', md: '2.5rem' },
    fontWeight: 700,
    mb: 2,
    textAlign: 'center',
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

  dataSourceIcon: (color: string) => ({
    color,
    mt: 0.5,
    flexShrink: 0,
  } as SxProps<Theme>),

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
  footer: (dividerColor: string) => ({
    textAlign: 'center',
    py: 2,
    borderTop: `1px solid ${dividerColor}`,
  } as SxProps<Theme>),
};
