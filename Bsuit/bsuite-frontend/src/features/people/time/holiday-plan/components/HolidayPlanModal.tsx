

import { ModalElement } from "../../../../../components/dialogs/modal-element";
import {
    Box,
    Checkbox,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { PrimaryButton } from "../../../../../components/atom/button";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { useEffect, useState, useMemo } from "react";
import { AutocompleteElement } from "../../../../../components/atom/autocomplete";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import { Country } from "country-state-city";
import { Add, ArrowBackIos, ArrowForwardIos, Check, Close } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import {

    useCreateHolidayPlanMutation,
    useLazyGetListHolidaysQuery,
    type IHoliday,
} from "../api/holidayPlan.api";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { DatePickerElement } from "../../../../../components/atom/date-picker";

import dayjs from "dayjs";


interface HolidayPlanModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    onPlanCreated?: (planName: string) => void;
}

export const HolidayPlanModal = ({
    open,
    onClose,
    title,
    onPlanCreated,
}: HolidayPlanModalProps) => {
    const [name, setName] = useState("");
    const [country, setCountry] = useState<any>(null);
    const [year, setYear] = useState(2026);
    const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);

    // Custom Holidays State
    const [customHolidays, setCustomHolidays] = useState<IHoliday[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newHolidayDate, setNewHolidayDate] = useState<any>(null);
    const [newHolidayDescription, setNewHolidayDescription] = useState("");

    // Use lazy query to fetch manually when country/year changes
    const [triggerGetHolidays, { data: availableHolidays = [], isFetching }] =
        useLazyGetListHolidaysQuery();

    const [createPlan, { isLoading: isCreating }] = useCreateHolidayPlanMutation();

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({
        open: false,
        message: "",
        color: "info",
    });

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const showSnackbar = (message: string, color: "success" | "error" = "success") => {
        setSnackbar({ open: true, message, color });
    };

    // COUNTRY options
    const countryOptions = Country.getAllCountries().map((c: any) => ({
        label: c.name,
        value: c.isoCode,
    }));

    useEffect(() => {
        if (country?.value) {
            triggerGetHolidays({ country: country.value, year });
        }
    }, [country, year, triggerGetHolidays]);


    // Reset selected holidays and custom holidays when country or year changes
    useEffect(() => {
        setSelectedHolidays([]);
        setCustomHolidays([]);
        setIsAdding(false);
        setNewHolidayDate(null);
        setNewHolidayDescription("");
    }, [country, year]);

    // Reset ALL state when modal opens/closes (specifically when closing to clear for next open)
    useEffect(() => {
        if (!open) {
            setName("");
            setCountry(null);
            setYear(2026);
            setSelectedHolidays([]);
            setCustomHolidays([]);
            setIsAdding(false);
            setNewHolidayDate(null);
            setNewHolidayDescription("");
        }
    }, [open]);


    // Combine available and custom holidays
    const allHolidays = useMemo(() => {
        if (!country) return [];
        return [...customHolidays, ...availableHolidays];
    }, [customHolidays, availableHolidays, country]);

    const handleToggleHoliday = (description: string) => {
        setSelectedHolidays((prev) =>
            prev.includes(description) ? prev.filter((h) => h !== description) : [...prev, description]
        );
    };

    const handleToggleAll = () => {
        if (selectedHolidays.length === allHolidays.length) {
            setSelectedHolidays([]);
        } else {
            setSelectedHolidays(allHolidays.map((h) => h.description || ""));
        }
    };

    const handleSaveNewHoliday = () => {
        if (!newHolidayDate || !newHolidayDescription) {
            showSnackbar("Date and Description are required", "error");
            return;
        }

        const newHoliday: IHoliday = {
            date: dayjs(newHolidayDate).format("YYYY-MM-DD"),
            description: newHolidayDescription,
            name: newHolidayDescription, // Assuming name is same as description for custom
        };

        // Check for duplicates
        if (allHolidays.some(h => h.description === newHoliday.description)) {
            showSnackbar("A holiday with this description already exists", "error");
            return;
        }

        setCustomHolidays(prev => [newHoliday, ...prev]);
        setSelectedHolidays(prev => [...prev, newHoliday.description]); // Auto-select

        // Reset entry fields
        setNewHolidayDate(null);
        setNewHolidayDescription("");
        setIsAdding(false);
        showSnackbar("Custom holiday added");
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewHolidayDate(null);
        setNewHolidayDescription("");
    };

    const handleCreate = async () => {
        if (!name || !country) return;

        const holidaysToInclude = allHolidays.filter(
            h => h.description && selectedHolidays.includes(h.description)
        ).map(h => ({
            name: h.description,
            description: h.description,
            date: h.date
        }));

        try {


            await createPlan({
                planName: name,
                country: country.value,
                holidayList: holidaysToInclude
            }).unwrap();

            if (onPlanCreated) {
                onPlanCreated(name);
            }
            onClose();
            // Reset states
            setName("");
            setCountry(null);
            setSelectedHolidays([]);
            setCustomHolidays([]);
        } catch (error: any) {
            console.error("Failed to create plan", error);
            const errorMsg = error?.data?.message ?? error?.error ?? error?.message ?? "Failed to create holiday plan.";
            showSnackbar(errorMsg, "error");
        }
    };

    return (
        <ModalElement open={open} onClose={onClose} title={title} maxWidth="md">
            <Box p={2} display="flex" flexDirection="column" gap={2}>
                <Stack direction="row" spacing={2}>
                    <Box flex={1}>
                        <Typography variant="caption" color="text.secondary">
                            Plan Name *
                        </Typography>
                        <TextFieldElement
                            placeholder="e.g. 2026 Public Holidays"
                            label=""
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            slotProps={{
                                htmlInput: {
                                    maxLength: 355,
                                },
                            }}
                        />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="caption" color="text.secondary">
                            Country *
                        </Typography>
                        <AutocompleteElement
                            options={countryOptions}
                            value={country}
                            matchId={true}
                            onChange={(_, val) => setCountry(val)}
                            // label="Country"
                            placeholder="Select Country"
                        />
                    </Box>
                </Stack>

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    spacing={2}
                    mt={1}
                >
                    <IconButton
                        size="small"
                        onClick={() => setYear(year - 1)}
                        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                    >
                        <ArrowBackIos fontSize="small" sx={{ fontSize: 12 }} />
                    </IconButton>
                    <Typography fontWeight="bold">{year}</Typography>
                    <IconButton
                        size="small"
                        onClick={() => setYear(year + 1)}
                        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                    >
                        <ArrowForwardIos fontSize="small" sx={{ fontSize: 12 }} />
                    </IconButton>

                    <Box flex={1} />

                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="caption" color="text.secondary">
                            Selected: {selectedHolidays.length}
                        </Typography>
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setIsAdding(true)}
                            disabled={!country} // Disable if no country selected, as we need context
                        >
                            <Add />
                        </IconButton>
                    </Box>
                </Stack>


                <TableContainer
                    sx={{
                        maxHeight: "35vh",
                        minHeight: "35vh",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={
                                            allHolidays.length > 0 &&
                                            selectedHolidays.length === allHolidays.length
                                        }
                                        indeterminate={
                                            selectedHolidays.length > 0 &&
                                            selectedHolidays.length < allHolidays.length
                                        }
                                        onChange={handleToggleAll}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2">Date</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle2">Holiday</Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isAdding && (
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        {/* Placeholder for checkbox column alignment */}
                                    </TableCell>

                                    <TableCell sx={{ minWidth: 200 }}>
                                        <DatePickerElement
                                            label=""
                                            value={newHolidayDate}
                                            onChange={(date) => setNewHolidayDate(date)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <TextFieldElement
                                                placeholder="Enter Description"
                                                label=""
                                                fullWidth
                                                value={newHolidayDescription}
                                                onChange={(e) => setNewHolidayDescription(e.target.value)}
                                            />
                                            <IconButton size="small" color="success" onClick={handleSaveNewHoliday}>
                                                <Check />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={handleCancelAdd}>
                                                <Close />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}


                            {isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" >
                                        <Typography color="text.secondary" py={4} pb={22} pt={18}>
                                            <CustomCircularProgress />
                                        </Typography>

                                    </TableCell>
                                </TableRow>
                                // <CustomCircularProgress />
                            ) : availableHolidays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ borderBottom: "0px solid" }}>
                                        <Typography color="text.secondary" py={4} pt={"15vh"}>
                                            Select a country to view holidays
                                        </Typography>
                                    </TableCell>
                                    
                                </TableRow>

                            ) : (
                                allHolidays.map((holiday) => (
                                    <TableRow
                                        key={holiday.description}
                                        hover
                                        onClick={() => handleToggleHoliday(holiday.description || "")}
                                        sx={{ cursor: "pointer" }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedHolidays.includes(holiday.description || "")}
                                            />
                                        </TableCell>
                                        <TableCell>{dayjs(holiday.date).format("MMM DD, YYYY")}</TableCell>
                                        <TableCell>{holiday.description}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: 2 }}>
                <PrimaryButton
                    onClick={handleCreate}
                    disabled={isCreating || !name || !country || selectedHolidays.length === 0}
                    variant="contained"
                >
                    {isCreating ? "Saving..." : "Add"}
                </PrimaryButton>
            </Box>

            {/* Snackbar Notifications */}
            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={handleCloseSnackbar}
                    autoClose={6000}
                />
            )}
        </ModalElement>
    );
};
