import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function ReportsList() {
  const navigate = useNavigate();

  const nameStyle = {
    py: 1.5,
    cursor: "pointer", // indicates clickable
    "&:hover": {
      color: "primary.main",
    },
  };

  const headerStyle = {
    fontWeight: 600,
    mt: 2,
    mb: 1,
  };

  // Define table data with path
  const reports = [
    {
      section: "Financial Statements",
      items: [
        {
          name: "Profit & Loss (Income Statement)",
          path: "/books/insights/profit-and-loss",
        },
        { name: "Balance Sheet", path: "/books/insights/balance-sheet" },
        { name: "Trial Balance", path: "/books/insights/trial-balance" },
        { name: "Invoice Summary", path: "/books/insights/invoice-summary" },
      ],
    },
    {
      section: "Taxes",
      items: [
        { name: "Tax Summary", path: "/books/insights/tax-summary" },
        { name: "TDS Summary", path: "/books/insights/tds-summary" },
      ],
    },
    {
      section: "Contacts",
      items: [
        {
          name: "Contact Balance Summary",
          path: "/books/insights/contact-balance-summary",
        },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader title="Reports" sx={{ pb: 1 }} />
      <CardContent sx={{ pt: 0 }}>
        {reports.map((section) => (
          <div key={section.section}>
            <Typography variant="subtitle1" sx={headerStyle}>
              {section.section}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {section.items.map((item) => (
                    <TableRow
                      hover
                      key={item.name}
                      onClick={() => navigate(item.path)}
                    >
                      <TableCell sx={nameStyle}>{item.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ReportsList;
