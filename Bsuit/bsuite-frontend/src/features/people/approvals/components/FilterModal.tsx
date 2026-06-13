import { Box, Stack } from "@mui/material";
import { MultiSelectElement } from "../../../../components/atom/select-field/MultiSelect";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import { Checkbox } from "../../../../components/atom/check-box";
import { DatePickerElement } from "../../../../components/atom/date-picker";

export const FilterModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    return (
        <ModalElement
            open={open}
            height={300}
            title={"Filter Approvals"}
            onClose={() => {
                onClose();
            }}
            sx={{
                "& .MuiDialog-paper": { width: { xs: "98vw", sm: 800, }, margin: 2 },
                height: "95vh"
            }}
        >
            <Stack spacing={2} width="100%">
                <MultiSelectElement
                    value={[]}
                    width="100%"
                    label="Select Employees"
                    options={[]}
                    onChange={() => { }}
                />
                <Box display="flex" justifyContent="space-between" mt={2} flexDirection="row">
                    <Checkbox
                        label="Pick start date"
                        checked={false}
                        onChange={(e) => { }}
                    />
                    <DatePickerElement width={300} />
                </Box>
                <Box display="flex" justifyContent="space-between" mt={2} flexDirection="row">
                    <Checkbox
                        label="Pick end date"
                        checked={false}
                        onChange={(e) => { }}
                    />
                    <DatePickerElement width={300}/>
                </Box>

            </Stack>
        </ModalElement>
    );
}