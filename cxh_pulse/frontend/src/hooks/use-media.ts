import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * Default Breakpoints
 * 
 * Can be overridden with arguments
 * ex - 
 * useMedia(
 *  { 
 *    SMALL: 600, 
 *    MEDIUM: 1024,
 *  }); 
 **/
export const DEFAULT_BREAKPOINTS = {
  EXTRA_SMALL: 0,
  SMALL: 750,
  MAP: 780,
  MEDIUM: 950,
  LARGE: 1685,
};

export const useMedia = (overrides?: Partial<typeof DEFAULT_BREAKPOINTS>) => {
  const BP = { ...DEFAULT_BREAKPOINTS, ...overrides };

  const isExtraSmallScreen = useMediaQuery(`(max-width:${BP.EXTRA_SMALL}px)`);
  const isSmallScreen = useMediaQuery(`(max-width:${BP.SMALL}px)`);
  const isSmallMap = useMediaQuery(`(max-width:${BP.MAP}px)`);
  const isMediumScreen = useMediaQuery(`(max-width:${BP.MEDIUM}px)`);
  const isLargeScreen = useMediaQuery(`(max-width:${BP.LARGE}px)`);

  return {
    isExtraSmallScreen,
    isSmallScreen,
    isSmallMap,
    isMediumScreen,
    isLargeScreen,
  };
};
