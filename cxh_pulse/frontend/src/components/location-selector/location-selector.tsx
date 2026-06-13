// import type { RefObject } from 'react';
// import { useMemo } from 'react';
// import { Autocomplete, Box, TextField, Typography } from '@mui/material';
// import { Iconify } from '../iconify';
// import { locationStyles } from '../../styles/components/location.styles';

// // ----------------------------------------------------------------------

// /**
//  * Configuration for location hierarchy levels
//  *
//  * Example:
//  * {
//  *   level1: { label: 'County', defaultOption: 'Entire County', groupLabel: 'County' },
//  *   level2: { label: 'Subcounty', groupLabel: 'Sub-Counties' },
//  *   level3: { label: 'Ward', groupLabel: 'Wards' }
//  * }
//  */
// export type LocationLevelConfig = {
//   label: string; // Display name for this level (e.g., "Subcounty", "Ward")
//   groupLabel: string; // Group header in dropdown (e.g., "Sub-Counties", "Wards")
//   defaultOption?: string; // Default option text (e.g., "Entire County")
// };

// /**
//  * Location data structure mapping parent to children
//  *
//  * Example:
//  * {
//  *   "Kajiado East": ["Kaputiei", "Imaroro"],
//  *   "Kajiado North": ["Dalalekutuk", "Ildamat"]
//  * }
//  */
// export type LocationHierarchyData = Record<string, string[]>;

// // Helper function to remove location suffixes from names
// const removeLocationSuffix = (name: string): string => {
//   if (!name) return name;
//   return name
//     .replace(/\s+ward$/i, '')
//     .replace(/ward$/i, '')
//     .replace(/\s+sub\s+county$/i, '')
//     .replace(/subcounty$/i, '')
//     .replace(/\s+sub\s+county$/i, '')
//     .trim();
// };

// // Helper function to convert string to title case
// const toTitleCase = (str: string): string => {
//   if (!str) return str;
//   return str
//     .toLowerCase()
//     .split(' ')
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(' ');
// };

// // ----------------------------------------------------------------------

// import type { LocationOption } from '../../types/component.types';

// /**
//  * LocationSelector Props
//  *
//  * A generic hierarchical location selector component that supports up to 3 levels:
//  * - Level 1: Top level (e.g., "Entire County")
//  * - Level 2: Middle level (e.g., "Subcounties")
//  * - Level 3: Bottom level (e.g., "Wards")
//  *
//  * @example
//  * ```tsx
//  * // Simple usage with subcounties and wards
//  * <LocationSelector
//  *   // Level 2 data (subcounties)
//  *   level2Options={['Kajiado East', 'Kajiado North']}
//  *   level2Selected="Kajiado East"
//  *   onLevel2Change={setSubcounty}
//  *
//  *   // Level 3 data (wards)
//  *   level3Options={['Kaputiei', 'Imaroro']}
//  *   level3Selected="Kaputiei"
//  *   onLevel3Change={setWard}
//  *
//  *   // Hierarchy data to look up parent for child
//  *   hierarchyData={{
//  *     "Kajiado East": ["Kaputiei", "Imaroro"],
//  *     "Kajiado North": ["Dalalekutuk"]
//  *   }}
//  * />
//  * ```
//  */
// export type LocationSelectorProps = {
//   // Level 2 configuration and data (e.g., Subcounties)
//   level2Options: string[];
//   level2Selected: string;
//   onLevel2Change: (value: string) => void;
//   level2Config?: LocationLevelConfig; // Optional: defaults to Subcounty/Sub-Counties

//   // Level 3 configuration and data (e.g., Wards)
//   level3Options: string[];
//   level3Selected: string;
//   onLevel3Change: (value: string) => void;
//   level3Config?: LocationLevelConfig; // Optional: defaults to Ward/Wards

//   // Hierarchy data: maps level2 -> level3 (e.g., subcounty -> wards)
//   // Used to look up parent when only child is selected
//   hierarchyData?: LocationHierarchyData;

//   // Level 1 configuration (optional, for "Entire County" type option)
//   level1Config?: LocationLevelConfig; // Optional: defaults to County/Entire County

//   // UI customization
//   size?: 'small' | 'medium';
//   maxWidth?: number | string;
//   isFullscreen?: boolean;
//   label?: string;
//   placeholder?: string;

//   // Filter mode: controls which options are shown
//   // 'all' - show all options (default)
//   // 'subcounty' - show only subcounties (level2)
//   // 'ward' - show only wards (level3)
//   filterMode?: 'all' | 'subcounty' | 'ward';

//   // Legacy props (for backward compatibility)
//   /** @deprecated Use level2Options instead */
//   availableSubcounties?: string[];
//   /** @deprecated Use level3Options instead */
//   availableWards?: string[];
//   /** @deprecated Use level2Selected instead */
//   selectedSubcounty?: string;
//   /** @deprecated Use level3Selected instead */
//   selectedWard?: string;
//   /** @deprecated Use onLevel2Change instead */
//   onSubcountyChange?: (value: string) => void;
//   /** @deprecated Use onLevel3Change instead */
//   onWardChange?: (value: string) => void;
//   /** @deprecated Use hierarchyData instead */
//   wardsData?: LocationHierarchyData;

//   mapContainerRef?: RefObject<HTMLDivElement | null>;
// };

// export function LocationSelector({
//   // New generic API
//   level2Options = [],
//   level2Selected = '',
//   onLevel2Change,
//   level2Config,
//   level3Options = [],
//   level3Selected = '',
//   onLevel3Change,
//   level3Config,
//   hierarchyData,
//   level1Config,
//   size = 'small',
//   maxWidth = 250,
//   isFullscreen = false,
//   label = 'Location',
//   placeholder = 'Select location...',
//   filterMode = 'all',
//   mapContainerRef,
// }: LocationSelectorProps) {
//   // Support both new and legacy API
//   const level2Opts = level2Options;
//   const level3Opts = level3Options;
//   const level2Sel = level2Selected;
//   const level3Sel = level3Selected;
//   const onLevel2 = onLevel2Change;
//   const onLevel3 = onLevel3Change;
//   const hierarchy = hierarchyData;

//   // Default configurations
//   const level1Cfg: LocationLevelConfig = level1Config || {
//     label: 'County',
//     groupLabel: 'County',
//     defaultOption: 'Entire County',
//   };

//   const level2Cfg: LocationLevelConfig = level2Config || {
//     label: 'Subcounty',
//     groupLabel: 'Sub-Counties',
//   };

//   const level3Cfg: LocationLevelConfig = level3Config || {
//     label: 'Ward',
//     groupLabel: 'Wards',
//   };
//   // Helper to find level2 (parent) for a level3 (child) using hierarchy data
//   const findLevel2ForLevel3 = useMemo(() => {
//     if (!hierarchy || !level3Sel) return null;
//     const entry = Object.entries(hierarchy).find(([_, children]) => {
//       const childrenArray = Array.isArray(children) ? children : [];
//       return childrenArray.includes(level3Sel);
//     });
//     return entry ? entry[0] : null;
//   }, [hierarchy, level3Sel]);

//   // Determine the currently selected value and its display label
//   const selectedValue = useMemo(() => {
//     // Priority: Level 3 (most specific) > Level 2 > Level 1 (default)
//     if (level3Sel && level3Sel !== '') {
//       // Find level2 for the level3 (use selected level2 if available, otherwise look it up)
//       const parentLevel2 = level2Sel || findLevel2ForLevel3 || '';
//       const level3Label = toTitleCase(removeLocationSuffix(level3Sel));

//       if (parentLevel2) {
//         // Show both parent and child when both are available (e.g., "Kajiado East > Kaputiei")
//         const level2Label = toTitleCase(removeLocationSuffix(parentLevel2));
//         return {
//           value: `level3:${level3Sel}`,
//           label: `${level2Label} > ${level3Label}`,
//           type: 'level3' as const,
//           group: level3Cfg.groupLabel,
//         };
//       }

//       // Only level3 selected, no parent found
//       return {
//         value: `level3:${level3Sel}`,
//         label: level3Label,
//         type: 'level3' as const,
//         group: level3Cfg.groupLabel,
//       };
//     }

//     if (level2Sel && level2Sel !== '') {
//       return {
//         value: `level2:${level2Sel}`,
//         label: toTitleCase(removeLocationSuffix(level2Sel)),
//         type: 'level2' as const,
//         group: level2Cfg.groupLabel,
//       };
//     }

//     // Default: Level 1 (e.g., "Entire County")
//     return {
//       value: 'level1:entire',
//       label: level1Cfg.defaultOption || 'Entire',
//       type: 'level1' as const,
//       group: level1Cfg.groupLabel,
//     };
//   }, [level2Sel, level3Sel, findLevel2ForLevel3, level1Cfg, level2Cfg, level3Cfg]);

//   // Build options list with hierarchical grouping
//   const options = useMemo<LocationOption[]>(() => {
//     const opts: LocationOption[] = [];

//     // Add Level 1 option (e.g., "Entire County") - only show in 'all' mode
//     if (filterMode === 'all' && level1Cfg.defaultOption) {
//       opts.push({
//         value: 'level1:entire',
//         label: level1Cfg.defaultOption,
//         type: 'level1',
//         group: level1Cfg.groupLabel,
//       });
//     }

//     // Add Level 2 options (e.g., Subcounties) - show in 'all' or 'subcounty' mode
//     if ((filterMode === 'all' || filterMode === 'subcounty') && level2Opts.length > 0) {
//       level2Opts.forEach((item) => {
//         opts.push({
//           value: `level2:${item}`,
//           label: toTitleCase(removeLocationSuffix(item)),
//           type: 'level2',
//           group: level2Cfg.groupLabel,
//         });
//       });
//     }

//     // Add Level 3 options (e.g., Wards) - show in 'all' or 'ward' mode
//     if ((filterMode === 'all' || filterMode === 'ward') && level3Opts.length > 0) {
//       level3Opts.forEach((item) => {
//         opts.push({
//           value: `level3:${item}`,
//           label: toTitleCase(removeLocationSuffix(item)),
//           type: 'level3',
//           group: level3Cfg.groupLabel,
//         });
//       });
//     }

//     return opts;
//   }, [level2Opts, level3Opts, level1Cfg, level2Cfg, level3Cfg, filterMode]);

//   const handleChange = (_: any, newValue: LocationOption | null) => {
//     if (!newValue) {
//       // Clear all selections
//       onLevel2('');
//       onLevel3('');
//       return;
//     }

//     const [type, value] = newValue.value.split(':');

//     if (type === 'level1') {
//       // Level 1 selected: clear level 2 and 3
//       onLevel2('');
//       onLevel3('');
//     } else if (type === 'level2') {
//       // Level 2 selected: set level 2, clear level 3
//       onLevel2(value);
//       onLevel3('');
//     } else if (type === 'level3') {
//       // Level 3 selected: set level 3 (level 2 might be auto-set via hierarchy)
//       onLevel3(value);
//     }
//   };

//   return (
//     <Autocomplete<LocationOption>
//       size={size}
//       options={options}
//       value={selectedValue}
//       onChange={handleChange}
//       groupBy={(option) => option.group}
//       getOptionLabel={(option) => option.label}
//       isOptionEqualToValue={(option, value) => option.value === value.value}
//       renderInput={(params) => (
//         <TextField
//           {...params}
//           title={selectedValue.label ? selectedValue.label : ''}
//           label={label}
//           placeholder={placeholder}
//         />
//       )}
//       renderOption={(props, option) => {
//         const [, optionValue] = option.value.split(':');
//         const isSelected =
//           (option.type === 'level1' && !level2Sel && !level3Sel) ||
//           (option.type === 'level2' && level2Sel === optionValue) ||
//           (option.type === 'level3' && level3Sel === optionValue);

//         return (
//           <Box
//             component="li"
//             {...props}
//             sx={locationStyles.optionContainer}
//           >
//             {isSelected && (
//               <Iconify
//                 icon="eva:checkmark-fill"
//                 width={18}
//                 sx={locationStyles.icon}
//               />
//             )}
//             {!isSelected && <Box width={18} sx={locationStyles.emptyIcon} />}
//             <Typography variant="body2" sx={locationStyles.optionText}>
//               {option.label}
//             </Typography>
//           </Box>
//         );
//       }}
//       renderGroup={(params) => (
//         <li key={params.key}>
//           <Box
//             component="div"
//             sx={locationStyles.groupHeader}
//           >
//             {params.group}
//           </Box>
//           <Box component="ul" sx={locationStyles.listContainer}>
//             {params.children}
//           </Box>
//         </li>
//       )}
//       sx={locationStyles.autocomplete(maxWidth)}
//       disableClearable={false}
//       disablePortal={false}
//       ListboxProps={{
//         style: { zIndex: isFullscreen ? 10000 : 1000 },
//       }}
//       slotProps={{
//         popper: {
//           container: () => mapContainerRef?.current ?? document.body,
//           style: { zIndex: isFullscreen ? 10000 : 1000 },
//           placement: 'bottom-start',
//         },
//         paper: {
//           style: { zIndex: isFullscreen ? 10000 : 1000 },
//         },
//       }}
//     />
//   );
// }
