import { Box, Stack } from "@mui/system";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { Typography } from "@mui/material";
import TipTapEditor from "../../../../home/ClockInOut/components/TiptapEditor";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { useState } from "react";
import { RepeaterElement } from "../../../../../../components/atom/form-repeater/FormRepeater";
import { PrimaryButton } from "../../../../../../components/atom/button";

// Define a type for the file repeater item
type FileRepeaterItem = { file: File | null };

function RaiseTicketModal() {
  //   state variables
  // Each item is an object with a 'file' property

  const [files, setFiles] = useState<FileRepeaterItem[]>([{ file: null }]);
  const [category, setCategory] = useState<string | null>(null);
  return (
    <Box>
      <Stack direction={"row"} display={"flex"} gap={1} mb={2}>
        <TextFieldElement label="Title" sx={{ flex: 1 }} />
        <SingleSelectElement
          label={"Category"}
          value={category!}
          onChange={(e) => {
            setCategory(e);
          }}
          options={[]}
        />
      </Stack>
      <Typography>Please share the assistance required</Typography>
      <TipTapEditor />
      <RepeaterElement<FileRepeaterItem>
        label="Attachments"
        items={files}
        setItems={setFiles}
        initialItem={{ file: null }}
        minItems={1}
        renderItem={(item, idx, onFieldChange) => (
          <FileUploadField
            label={"Upload File"}
            value={item.file}
            onChange={(file) => onFieldChange("file", file)}
            multiple={false}
          />
        )}
        canDeleteItem={() => true}
        gap={2}
        boxed={false}
      />
      <Box width={"100%"} display={"flex"} justifyContent={"end"}> <PrimaryButton>Save</PrimaryButton></Box>
    </Box>
  );
}

export default RaiseTicketModal;
