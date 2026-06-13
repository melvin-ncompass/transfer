import type { Theme, SxProps } from '@mui/material/styles';

import { useCallback } from 'react';
import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import ButtonBase from '@mui/material/ButtonBase';
import { styled, alpha as hexAlpha } from '@mui/material/styles';

import { Iconify } from '../iconify';
import { colorPickerClasses } from './classes';

// ----------------------------------------------------------------------

export type ColorPickerSlotProps = {
  item?: React.ComponentProps<typeof ItemRoot>;
  itemContainer?: React.ComponentProps<typeof ItemContainer>;
  icon?: React.ComponentProps<typeof ItemIcon>;
};

export type ColorPickerProps = Omit<React.ComponentProps<'ul'>, 'onChange'> & {
  sx?: SxProps<Theme>;
  size?: number;
  options?: string[];
  limit?: 'auto' | number;
  value?: string | string[];
  variant?: 'circular' | 'rounded' | 'square';
  onChange?: (value: string | string[]) => void;
  slotProps?: ColorPickerSlotProps;
};

// ----------------------------------------------------------------------

/**
 * Color picker component for selecting one or multiple colors
 * 
 * Supports:
 * - Single color selection (value is string)
 * - Multiple color selection (value is string array)
 * - Different variants (circular, rounded, square)
 * - Customizable size and appearance
 * - Visual feedback for selected colors
 * 
 * @example
 * ```tsx
 * // Single selection
 * const [color, setColor] = useState('#FF0000');
 * <ColorPicker 
 *   value={color} 
 *   onChange={setColor} 
 *   options={['#FF0000', '#00FF00', '#0000FF']}
 * />
 * 
 * // Multiple selection
 * const [colors, setColors] = useState(['#FF0000']);
 * <ColorPicker 
 *   value={colors} 
 *   onChange={setColors} 
 *   options={['#FF0000', '#00FF00', '#0000FF']}
 * />
 * ```
 */
export function ColorPicker({
  sx,
  value,
  onChange,
  slotProps,
  className,
  size = 36,           // Size of color swatch in pixels
  options = [],        // Array of color hex codes
  limit = 'auto',      // Maximum colors to display in a row
  variant = 'circular', // Shape of color swatches
  ...other
}: ColorPickerProps) {
  // Determine if this is single or multiple selection mode
  const isSingleSelect = typeof value === 'string';

  /**
   * Handles color selection/deselection
   * - Single mode: Replaces current color
   * - Multiple mode: Toggles color in/out of selection
   */
  const handleSelect = useCallback(
    (color: string) => {
      if (isSingleSelect) {
        // Single selection: only update if different
        if (color !== value) {
          onChange?.(color);
        }
      } else {
        // Multiple selection: toggle color
        const selected = value as string[];

        const newSelected = selected.includes(color)
          ? selected.filter((currentColor) => currentColor !== color) // Remove if present
          : [...selected, color]; // Add if not present

        onChange?.(newSelected);
      }
    },
    [onChange, value, isSingleSelect]
  );

  return (
    <ColorPickerRoot
      limit={limit}
      className={mergeClasses([colorPickerClasses.root, className])}
      sx={[
        {
          '--item-size': `${size}px`,
          '--item-radius':
            (variant === 'circular' && '50%') ||
            (variant === 'rounded' && 'calc(var(--item-size) / 6)') ||
            '0px',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {options.map((color) => {
        const hasSelected = isSingleSelect ? value === color : (value as string[]).includes(color);

        return (
          <li key={color}>
            <ItemRoot
              aria-label={color}
              onClick={() => handleSelect(color)}
              className={colorPickerClasses.item.root}
              {...slotProps?.item}
            >
              <ItemContainer
                color={color}
                hasSelected={hasSelected}
                className={colorPickerClasses.item.container}
                {...slotProps?.itemContainer}
              >
                <ItemIcon
                  color={color}
                  hasSelected={hasSelected}
                  icon="eva:checkmark-fill"
                  className={colorPickerClasses.item.icon}
                  {...slotProps?.icon}
                />
              </ItemContainer>
            </ItemRoot>
          </li>
        );
      })}
    </ColorPickerRoot>
  );
}

// ----------------------------------------------------------------------

const ColorPickerRoot = styled('ul', {
  shouldForwardProp: (prop: string) => !['limit', 'sx'].includes(prop),
})<Pick<ColorPickerProps, 'limit'>>(({ limit }) => ({
  flexWrap: 'wrap',
  flexDirection: 'row',
  display: 'inline-flex',
  '& > li': { display: 'inline-flex' },
  ...(typeof limit === 'number' && {
    justifyContent: 'flex-end',
    width: `calc(var(--item-size) * ${limit})`,
  }),
}));

const ItemRoot = styled(ButtonBase)(() => ({
  width: 'var(--item-size)',
  height: 'var(--item-size)',
  borderRadius: 'var(--item-radius)',
}));

const ItemContainer = styled('span', {
  shouldForwardProp: (prop: string) => !['color', 'hasSelected', 'sx'].includes(prop),
})<{ color: string; hasSelected: boolean }>(({ color, theme }) => ({
  alignItems: 'center',
  display: 'inline-flex',
  borderRadius: 'inherit',
  justifyContent: 'center',
  backgroundColor: color,
  width: 'calc(var(--item-size) - 16px)',
  height: 'calc(var(--item-size) - 16px)',
  border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shortest,
  }),
  variants: [
    {
      props: { hasSelected: true },
      style: {
        width: 'calc(var(--item-size) - 8px)',
        height: 'calc(var(--item-size) - 8px)',
        outline: `solid 2px ${hexAlpha(color, 0.08)}`,
        boxShadow: `4px 4px 8px 0 ${hexAlpha(color, 0.48)}`,
      },
    },
  ],
}));

const ItemIcon = styled(Iconify, {
  shouldForwardProp: (prop: string) => !['color', 'hasSelected', 'sx'].includes(prop),
})<{ color: string; hasSelected: boolean }>(({ color, theme }) => ({
  width: 0,
  height: 0,
  color: theme.palette.getContrastText(color),
  transition: theme.transitions.create(['all'], {
    duration: theme.transitions.duration.shortest,
  }),
  variants: [
    {
      props: { hasSelected: true },
      style: {
        width: 'calc(var(--item-size) / 2.4)',
        height: 'calc(var(--item-size) / 2.4)',
      },
    },
  ],
}));
