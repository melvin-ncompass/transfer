import type { RefObject } from 'react';
import { useMemo } from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { locationStyles } from '../../styles/components/location.styles';
import { Iconify } from '../iconify';


const removeLocationSuffix = (name: string): string =>
  name
    ?.replace(/\s+ward$/i, '')
    .replace(/\s+sub\s+county$/i, '')
    .trim();

const toTitleCase = (str: string): string =>
  str
    ?.toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

type LevelConfig<T> = {
  level: number;
  type: string;
  group: string;
  getItems: () => T[];
  getParentId?: (item: T) => string | undefined;
  isVisible?: () => boolean;
};

/** 
  * LocationSelector Props
  *
  * A generic hierarchical location selector component that supports up to 3 levels:
  * - Level 1: Top level (e.g., "Entire County")
  * - Level 2: Middle level (e.g., "Subcounties")
  * - Level 3: Bottom level (e.g., "Wards")
*/

export type LocationSelectorProps = {
  // Level 1 data (e.g., county)
  level1Option: { label: string | undefined, id: string | undefined };

  // Level 2 configuration and data (e.g., Subcounties)
  level2Options: { id: string; name: string }[];
  onSubcountyChange: (id: string) => void;
  selectedSubcountyId: string;

  // Level 3 configuration and data (e.g., Wards)
  level3Options: { id: string; name: string; subcountyId: string }[];
  onWardChange: (id: string) => void;
  selectedWardId: string;

  // Hierarchy data: maps level2 -> level3 (e.g., subcounty -> wards)
  // Used to look up parent when only child is selected
  hierarchyData?: Record<string, { id: string; name: string }[]>;

  onLocationSelect: (params: { subcountyId?: string; wardId?: string }) => void;

  // UI customization
  size?: 'small' | 'medium';
  maxWidth?: number | string;
  label?: string;
  placeholder?: string;
  mapContainerRef?: RefObject<HTMLDivElement | null>;
  onResetLocation?: () => void;
  // Selection mode: 'ward' shows all wards and subcounties, 'subcounty' shows only subcounties
  selectionMode?: 'ward' | 'subcounty';
};

export function LocationSelector({
  level1Option,
  level2Options,
  level3Options,
  hierarchyData,
  selectedSubcountyId,
  selectedWardId,
  onSubcountyChange,
  onWardChange,
  onLocationSelect,
  size = 'small',
  maxWidth = 250,
  label = 'Location',
  placeholder = 'Select location...',
  mapContainerRef,
  onResetLocation,
  selectionMode = 'ward',
}: LocationSelectorProps) {

  // Determine the currently selected value and its display label
  const selectedValue = useMemo(() => {
    if (selectedWardId) {
      const ward = level3Options.find((w) => w.id === selectedWardId);
      const sub = level2Options.find((s) => s.id === ward?.subcountyId);

      return {
        value: `level3:${ward?.id}`,
        label: `${toTitleCase(removeLocationSuffix(sub?.name || ''))} > ${toTitleCase(
          removeLocationSuffix(ward?.name || '')
        )}`,
        type: 'level3',
        group: 'Wards',
        id: ward!.id,
        parentId: ward!.subcountyId,
      };
    }

    if (selectedSubcountyId) {
      const sub = level2Options.find((s) => s.id === selectedSubcountyId);

      return {
        value: `level2:${sub?.id}`,
        label: toTitleCase(removeLocationSuffix(sub?.name || '')),
        type: 'level2',
        group: 'Sub-Counties',
        id: sub!.id,
      };
    }

    return level1Option;
  }, [selectedSubcountyId, selectedWardId, level1Option, level2Options, level3Options]);


  const options = useMemo(() => {
    const opts: any[] = [];

    const levels: LevelConfig<any>[] = [
      // Level 1 — County
      {
        level: 1,
        type: 'level1',
        group: 'Counties',
        getItems: () => [level1Option],
      },

      // Level 2 — Subcounties
      {
        level: 2,
        type: 'level2',
        group: 'Sub-Counties',
        getItems: () => level2Options,
      },

      // Level 3 — Wards
      {
        level: 3,
        type: 'level3',
        group: 'Wards',
        getItems: () => {
          // In subcounty mode, don't show wards
          if (selectionMode === 'subcounty') {
            return [];
          }
          // In ward mode, show all wards (not filtered by subcounty)
          return level3Options;
        },
        getParentId: (w) => w.subcountyId,
        isVisible: () => selectionMode === 'ward', // Only show wards group in ward mode
      },

    ];

    levels.forEach(({ level, type, group, getItems, getParentId, isVisible }) => {
      if (isVisible && !isVisible()) return;

      getItems().forEach((item: any) => {
        opts.push({
          value: `${type}:${item.id ?? item.value}`,
          label: toTitleCase(removeLocationSuffix(item.name ?? item.label)),
          type,
          group,
          id: item.id,
          parentId: getParentId?.(item),
        });
      });
    });

    return opts;
  }, [
    level1Option,
    level2Options,
    level3Options,
    selectionMode,
  ]);


  const handleChange = (_: any, newValue: any, reason: string) => {

    // clearing the selection of locations
    if (reason === 'clear') {
      onResetLocation?.();
      onSubcountyChange('');
      onWardChange('');
      onLocationSelect({});
      return;
    }

    if (!newValue) return;

    if (newValue.type === 'level1') {
      onResetLocation?.();
      onSubcountyChange('');
      onWardChange('');
      onLocationSelect({});
      return;
    }

    if (newValue.type === 'level2') {
      onSubcountyChange(newValue.id);
      onWardChange('');
      onLocationSelect({ subcountyId: newValue.id });
      return;
    }

    if (newValue.type === 'level3') {
      onSubcountyChange(newValue.parentId);
      onWardChange(newValue.id);
      onLocationSelect({
        subcountyId: newValue.parentId,
        wardId: newValue.id,
      });
    }
  };

  return (
    <Autocomplete
      title={selectedValue.label}
      size={size}
      options={options}
      value={selectedValue}
      onChange={handleChange}
      groupBy={(o) => o.group}
      getOptionLabel={((o) => o.label || "")}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} />}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        const isSelected =
          //for level 3 selections (eg:wards)
          option.type === 'level3'
            ? selectedWardId === option.id
            //for level 2 selections (eg:suncounties)
            : option.type === 'level2'
              ? selectedSubcountyId === option.id ||
              level3Options.find((w) => w.id === selectedWardId)?.subcountyId === option.id
              //for level 1 selection (eg:County)
              : option.type === 'level1'
                ? !selectedSubcountyId && !selectedWardId
                : false;

        return (
          <Box
            component="li"
            key={key}
            {...otherProps}
            sx={{
              ...locationStyles.optionContainer,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {isSelected ? (
              <Iconify
                icon="eva:checkmark-fill"
                width={18}
                sx={locationStyles.icon}
              />
            ) : (
              <Box width={18} sx={locationStyles.emptyIcon} />
            )}
            <Typography
              variant="body2"
              sx={locationStyles.optionText}
            >
              {option.label}
            </Typography>
          </Box>
        );
      }}
      renderGroup={(params) => (
        <li key={params.key}>
          <Box
            component="div"
            sx={locationStyles.groupHeader}
          >
            {params.group}
          </Box>
          <Box component="ul" sx={locationStyles.listContainer}>
            {params.children}
          </Box>
        </li>
      )}
      sx={locationStyles.autocomplete(maxWidth)}
      disableClearable={false}
      disablePortal={false}
      slotProps={{
        popper: {
          container: () => mapContainerRef?.current ?? document.body,
          style: { zIndex: 1000 },
          placement: 'bottom-start',
        },
        paper: {
          style: { zIndex: 1000 },
        },
      }}
    />
  );
}