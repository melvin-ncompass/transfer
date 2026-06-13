import { DataTable } from "../../../../components/tables/data-table/DataTables";
import { Typography, Box } from "@mui/material";
import type { MetaItem } from "../../../../types/types";

interface AdditionalInfoTableProps {
  meta: MetaItem[];
}

export default function AdditionalInfoTable({ meta }: AdditionalInfoTableProps) {
  const metaColumns = [
    {
      field: "label",
      headerName: "Label",
      flex: 1,
    },
    {
      field: "value",
      headerName: "Value",
      flex: 1,
    },
  ];

  const metaRows = meta.slice(0, 2).map((item) => ({
    label: item.key,
    value: item.value,
  }));

  return (
    <Box>
      <DataTable
        columns={metaColumns}
        rows={metaRows}
        pagination={false}
        checkboxSelection={false}
        disableRowClickSelection={true}
        tableHeight="auto"
        sx={{
          "& .MuiDataGrid-cell": {
            paddingY: "4px",
          },
          "& .MuiDataGrid-columnHeaders": {
            fontSize: "0.85rem",
            backgroundColor: "transparent",
          },
        }}
      />

      {meta.length > 2 && (
        <Typography variant="caption" color="text.secondary" mt={1} display="block">
          +{meta.length - 2} more
        </Typography>
      )}
    </Box>
  );
}
