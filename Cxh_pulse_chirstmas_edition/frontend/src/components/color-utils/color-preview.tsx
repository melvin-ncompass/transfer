import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';

import { colorPreviewClasses } from './classes';

// ----------------------------------------------------------------------

export type ColorPreviewSlotProps = {
  item?: React.ComponentProps<typeof ItemRoot>;
  label?: React.ComponentProps<typeof ItemLabel>;
};

export type ColorPreviewProps = React.ComponentProps<typeof ColorPreviewRoot> & {
  limit?: number;
  size?: number;
  gap?: number;
  colors: string[];
  slotProps?: ColorPreviewSlotProps;
};

// ----------------------------------------------------------------------

/**
 * Component to display a preview of multiple colors as overlapping circles
 * 
 * Perfect for showing:
 * - Selected colors in a compact space
 * - Product available colors
 * - Tag/category colors
 * - Any list of colors with overflow indicator
 * 
 * Features:
 * - Displays colors as overlapping circles
 * - Shows "+N" label for colors beyond the limit
 * - Customizable size, gap, and limit
 * 
 * @example
 * ```tsx
 * // Show 3 colors max, with +2 indicator if more
 * <ColorPreview 
 *   colors={['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']}
 *   limit={3}
 * />
 * // Output: ⚫ ⚫ ⚫ +2
 * ```
 */
export function ColorPreview({
  sx,
  colors,        // Array of hex color codes to display
  className,
  slotProps,
  gap = 6,       // Overlap amount (negative margin between circles)
  limit = 3,     // Maximum number of color circles to show
  size = 16,     // Size of each color circle in pixels
  ...other
}: ColorPreviewProps) {
  // Get only the colors within the limit
  const colorsRange = colors.slice(0, limit);
  // Calculate how many colors are not shown
  const remainingColorCount = colors.length - limit;

  return (
    <ColorPreviewRoot
      className={mergeClasses([colorPreviewClasses.root, className])}
      sx={sx}
      {...other}
    >
      {/* Render each color as a circle */}
      {colorsRange.map((color, index) => (
        <ItemRoot
          key={color + index}
          className={colorPreviewClasses.item}
          {...slotProps?.item}
          sx={[
            {
              '--item-color': color,
              '--item-size': `${size}px`,
              '--item-gap': `${-gap}px`, // Negative for overlap effect
            },
            ...(Array.isArray(slotProps?.item?.sx)
              ? (slotProps.item?.sx ?? [])
              : [slotProps?.item?.sx]),
          ]}
        />
      ))}

      {/* Show "+N" label if there are more colors than the limit */}
      {colors.length > limit && (
        <ItemLabel
          className={colorPreviewClasses.label}
          {...slotProps?.label}
        >{`+${remainingColorCount}`}</ItemLabel>
      )}
    </ColorPreviewRoot>
  );
}

// ----------------------------------------------------------------------

const ColorPreviewRoot = styled('ul')(() => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
}));

const ItemRoot = styled('li')(({ theme }) => ({
  borderRadius: '50%',
  width: 'var(--item-size)',
  height: 'var(--item-size)',
  marginLeft: 'var(--item-gap)',
  backgroundColor: 'var(--item-color)',
  border: `solid 2px ${theme.vars.palette.background.paper}`,
  boxShadow: `inset -1px 1px 2px ${varAlpha(theme.vars.palette.common.blackChannel, 0.24)}`,
}));

const ItemLabel = styled('li')(({ theme }) => ({
  ...theme.typography.subtitle2,
}));
