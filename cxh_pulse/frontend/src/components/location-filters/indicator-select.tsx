import { useMemo, useState, useRef, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Divider } from '@mui/material';
import { useGetDkhisIndicatorDateFilterQuery } from '../../api';
import { Iconify } from '../iconify';
import { indicatorSelectStyles } from '@styles/components/indicator-select.styles';
import type { IndicatorOption, IndicatorSelectProps } from '../../types/component.types';
import { usePermission } from '../../hooks/use-permissions';
import { PermissionName } from '../../types/permissions';

// ----------------------------------------------------------------------

// Special value to identify Population option
export const POPULATION_INDICATOR_VALUE = '__POPULATION__';

// Render option helper function - moved outside to prevent recreation on each render
const createRenderOption = (value: string) => (props: any, option: IndicatorOption) => {
  const { key, ...otherProps } = props;
  const isSelected = value === option.value;
  return (
    <Box
      component="li"
      key={key}
      {...otherProps}
      sx={indicatorSelectStyles.optionContainer}
    >
      {isSelected && (
        <Iconify
          icon="eva:checkmark-fill"
          width={18}
          sx={indicatorSelectStyles.selectedIcon}
        />
      )}
      {!isSelected && <Box width={18} sx={indicatorSelectStyles.emptySpace} />}
      <Typography variant="body2" sx={indicatorSelectStyles.optionText}>
        {option.label}
      </Typography>
    </Box>
  );
};

// Render population-only autocomplete - moved outside to prevent recreation on each render
const renderPopulationOnlyAutocomplete = (
  value: string,
  handleChange: (event: any, newValue: IndicatorOption | null) => void,
  handleOpen: () => void,
  handleClose: (event: any, reason: string) => void,
  isOpen: boolean,
  label: string,
  textColor: string,
  maxWidth: number,
  disablePortal: boolean,
  zIndex: number | undefined
) => {
  const populationOption: IndicatorOption = {
    label: 'Population',
    value: POPULATION_INDICATOR_VALUE,
    section: '__POPULATION__',
    isPopulation: true,
  };

  const displayValue = value === POPULATION_INDICATOR_VALUE ? populationOption : null;

  return (
    <Autocomplete<IndicatorOption>
      size="small"
      options={[populationOption]}
      value={displayValue}
      onChange={handleChange}
      onOpen={handleOpen}
      onClose={handleClose}
      open={isOpen}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val?.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={displayValue ? undefined : 'No indicator selected'}
          title={displayValue?.label || ''}
          sx={indicatorSelectStyles.textField(textColor)}
        />
      )}
      renderOption={createRenderOption(value)}
      sx={indicatorSelectStyles.autocomplete(maxWidth)}
      disableClearable={false}
      disablePortal={disablePortal}
      ListboxProps={{
        style: { zIndex: zIndex || undefined },
      }}
      slotProps={{
        popper: {
          style: { zIndex: zIndex || undefined },
          placement: 'bottom-start',
        },
        paper: {
          style: { zIndex: zIndex || undefined },
        },
      }}
    />
  );
};

/**
 * IndicatorSelect - Self-contained indicator filter component
 *
 * Fetches indicators from API and displays an Autocomplete dropdown with sections.
 * Groups indicators by section (Mother, Baby, Other, etc.)
 */
export function IndicatorSelect({
  value,
  onChange,
  label = 'Indicator',
  placeholder = 'Search indicator...',
  disablePortal = true,
  zIndex,
  maxWidth = 250,
  defaultIndex,
  textColor = 'var(--brand-text)',
  enablePopulationOption = false,
}: IndicatorSelectProps) {
  // Check for MANAGE_KHIS permission
  // const hasKhisPermission = usePermission(PermissionName.KHIS);

  // Fetch indicators data from API - skip if no KHIS permission
  const { data: indicatorsData, isLoading } = useGetDkhisIndicatorDateFilterQuery();

  // Track value when dropdown opens to restore if user clears but doesn't select
  const valueWhenOpenedRef = useRef<string>('');
  const wasClearedRef = useRef<boolean>(false);
  const hasAutoSelectedRef = useRef<boolean>(false);
  const hasAutoSelectedPopulationRef = useRef<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  // Create indicator options with sections from API
  const indicatorOptions = useMemo<IndicatorOption[]>(() => {
    const options: IndicatorOption[] = [];

    if (indicatorsData && Array.isArray(indicatorsData)) {
      indicatorsData.forEach((indicatorOption: any) => {
        options.push({
          label: indicatorOption.indicatorName,
          value: indicatorOption.indicatorId,
          section: indicatorOption.category,
          isPopulation: false,
        });
      });
    }

    // Sort by section
    const sortedOptions = options.sort((a, b) => (a.section || '').localeCompare(b.section || ''));

    // Add Population option at the end if enabled
    if (enablePopulationOption) {
      sortedOptions.push({
        label: 'Population',
        value: POPULATION_INDICATOR_VALUE,
        section: '__POPULATION__', // Special section for population
        isPopulation: true,
      });
    }

    return sortedOptions;
  }, [indicatorsData, enablePopulationOption]);

  // Auto-select indicator by index when options are loaded
  useEffect(() => {
    if (
      defaultIndex !== undefined &&
      !hasAutoSelectedRef.current &&
      indicatorOptions.length > 0 &&
      !value &&
      !isLoading
    ) {
      // Convert 1-based index to 0-based array index
      const index = defaultIndex - 1;
      if (index >= 0 && index < indicatorOptions.length) {
        const selectedOption = indicatorOptions[index];
        if (selectedOption) {
          onChange(selectedOption.value);
          hasAutoSelectedRef.current = true;
        }
      }
    }
  }, [defaultIndex, indicatorOptions, value, isLoading, onChange]);

  // Auto-select population if no indicators available and population is enabled
  useEffect(() => {
    if (
      enablePopulationOption &&
      !hasAutoSelectedPopulationRef.current &&
      !isLoading &&
      !value &&
      indicatorOptions.length > 0
    ) {
      // Check if there are no regular indicators (only population option exists)
      const hasRegularIndicators = indicatorOptions.some(opt => !opt.isPopulation);

      if (!hasRegularIndicators) {
        // Only population option exists, auto-select it
        const populationOption = indicatorOptions.find(opt => opt.isPopulation);
        if (populationOption) {
          onChange(populationOption.value);
          hasAutoSelectedPopulationRef.current = true;
        }
      }
    }
  }, [enablePopulationOption, indicatorOptions, value, isLoading, onChange]);

  // Handle change - track if user cleared
  const handleChange = (_: any, newValue: IndicatorOption | null) => {
    if (newValue) {
      // User selected something - update value and clear the cleared flag
      wasClearedRef.current = false;
      onChange(newValue.value);
    } else {
      // User cleared - set flag but don't update value yet
      wasClearedRef.current = true;
    }
  };

  // Handle open - store current value
  const handleOpen = () => {
    valueWhenOpenedRef.current = value;
    wasClearedRef.current = false;
    setIsOpen(true);
  };

  // Handle close - if value was cleared and user didn't select, restore previous
  const handleClose = (_: any, reason: string) => {
    setIsOpen(false);
    // If user cleared (wasClearedRef is true) but didn't select a new option,
    // restore the previous value
    if (wasClearedRef.current && reason !== 'selectOption' && valueWhenOpenedRef.current) {
      // User cleared and closed without selecting - restore previous value
      onChange(valueWhenOpenedRef.current);
    }
    wasClearedRef.current = false;
  };

  // If user doesn't have KHIS permission, only show population option if enabled
  // Otherwise show disabled field
  // if (!hasKhisPermission) {
  //   // If population option is enabled, show it as the only option
  //   if (enablePopulationOption) {
  //     return renderPopulationOnlyAutocomplete(
  //       value,
  //       handleChange,
  //       handleOpen,
  //       handleClose,
  //       isOpen,
  //       label,
  //       textColor,
  //       maxWidth,
  //       disablePortal,
  //       zIndex
  //     );
  //   }

  //   // No population option and no KHIS permission - show disabled field
  //   return (
  //     <TextField
  //       size="small"
  //       label={label}
  //       disabled
  //       placeholder="No access to indicators"
  //       value=""
  //       sx={indicatorSelectStyles.textField(textColor)}
  //     />
  //   );
  // }

  if (isLoading) {
    return (
      <Box sx={indicatorSelectStyles.loadingContainer(maxWidth)}>
        <CircularProgress size={20} />
        <TextField size="small" label={label} disabled placeholder="Loading..." sx={indicatorSelectStyles.loadingTextField} />
      </Box>
    );
  }

  // Show component even if no options (will show loading or empty state)
  const displayValue = value ? indicatorOptions.find((opt) => opt.value === value) || null : null;
  const displayPlaceholder = placeholder || (value ? undefined : 'No indicator selected');

  return (
    <Autocomplete<IndicatorOption>
      size="small"
      options={indicatorOptions}
      value={displayValue}
      onChange={handleChange}
      onOpen={handleOpen}
      onClose={handleClose}
      open={isOpen}
      groupBy={(option) => option.section || ''}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val?.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={displayPlaceholder}
          title={displayValue?.label || ''}
          sx={indicatorSelectStyles.textField(textColor)}
        />
      )}
      renderOption={createRenderOption(value)}
      renderGroup={(params) => {
        // Check if this is the population section (needs divider before it)
        const isPopulationSection = params.group === '__POPULATION__';
        const hasOptionsBefore = indicatorOptions.some(
          opt => opt.section !== '__POPULATION__' && !opt.isPopulation
        );

        return (
          <li key={params.key}>
            {/* Add divider before population section if there are other options */}
            {isPopulationSection && hasOptionsBefore && (
              <Divider sx={indicatorSelectStyles.divider} />
            )}
            <Box
              component="div"
              sx={isPopulationSection ? indicatorSelectStyles.groupHeaderPopulation : indicatorSelectStyles.groupHeader}
            >
              {params.group}
            </Box>
            <Box component="ul" sx={indicatorSelectStyles.groupList}>
              {params.children}
            </Box>
          </li>
        );
      }}
      sx={indicatorSelectStyles.autocomplete(maxWidth)}
      disableClearable={false}
      disablePortal={disablePortal}
      ListboxProps={{
        style: { zIndex: zIndex || undefined },
      }}
      slotProps={{
        popper: {
          style: { zIndex: zIndex || undefined },
          placement: 'bottom-start',
        },
        paper: {
          style: { zIndex: zIndex || undefined },
        },
      }}
    />
  );
}
