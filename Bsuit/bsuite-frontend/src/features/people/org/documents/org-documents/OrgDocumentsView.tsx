import { Box } from "@mui/material";
import { OrgDocumentLayout } from "./components/OrgDocumentLayout";

export const OrgDocumentsView = () => {
    return (
        <Box sx={{ height: "100%", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <OrgDocumentLayout />
        </Box>
    );
};