import { useState } from "react";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Chip,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArticleIcon from "@mui/icons-material/Article";
import type { PayrunEmployee, PayrunStatus } from "../api/payrun.api";
import { PayslipModal } from "./PayslipModal";
import { StandardTable } from "../../../../../../components/tables/standard-table";

interface EmployeePayrollTableProps {
  employees: PayrunEmployee[];
  payrunId: number;
  status: PayrunStatus;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export function EmployeePayrollTable({
  employees,
  payrunId,
  status,
}: EmployeePayrollTableProps) {
  const [payslipEmployee, setPayslipEmployee] = useState<{
    employeeId: number;
    employeeName: string;
  } | null>(null);

  const statusColor = (s: PayrunStatus) => {
    switch (s) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "paid":
        return "success";
      case "partially_paid":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <>
      <Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Employee Summary
          </Typography>
          <Chip
            label={status.replace("_", " ").toUpperCase()}
            color={statusColor(status) as "success" | "error" | "warning" | "default"}
            size="small"
            sx={{ textTransform: "capitalize", fontWeight: 600 }}
          />
        </Box>

        <StandardTable
          sticky
          sx={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: { xs: 420, md: 560 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
          columns={[
            {
              id: "employeeCode",
              label: "ID",
              width: 120,
              render: (row: any) => row.displayEmployeeCode ?? "",
            },
            {
              id: "employeeName",
              label: "Name",
              width: 260,
              render: (row: any) => row.employeeName ?? "",
            },
            {
              id: "paidDays",
              label: "Paid Days",
              align: "center",
              width: 120,
              render: (row: any) => row.paidDays ?? "",
            },
            {
              id: "gross",
              label: "Gross",
              align: "right",
              width: 160,
              render: (row: any) => formatCurrency(row.gross ?? 0),
            },
            {
              id: "netPay",
              label: "Net Pay",
              align: "right",
              width: 160,
              render: (row: any) => formatCurrency(row.netPay ?? 0),
            },
            {
              id: "payslip",
              label: "Payslip",
              align: "center",
              width: 120,
              render: (row: any) => {
                const resolvedEmployeeId = Number(row.payrollNumericEmployeeId);
                const canViewPayslip =
                  Number.isFinite(resolvedEmployeeId) && resolvedEmployeeId > 0;
                return (
                  <Tooltip title={canViewPayslip ? "View Payslip" : "Payslip unavailable"}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() =>
                      setPayslipEmployee({
                        employeeId: resolvedEmployeeId,
                        employeeName: row.employeeName,
                      })
                    }
                    disabled={!canViewPayslip}
                  >
                    <ReceiptLongIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                );
              },
            },
            {
              id: "tds",
              label: "TDS Sheet",
              align: "center",
              width: 140,
              render: () => (
                <Tooltip title="View TDS Sheet">
                  <IconButton size="small" color="secondary">
                    <ArticleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ),
            },
          ]}
          rows={employees.map((emp, idx) => ({
            id: emp.id ?? idx,
            payrollNumericEmployeeId: emp.id,
            displayEmployeeCode:
              emp.employeeCode ??
              (typeof emp.employeeId === "string" ? emp.employeeId : undefined) ??
              (emp.employeeId != null && typeof emp.employeeId === "number"
                ? String(emp.employeeId)
                : undefined) ??
              emp.employeeNumber ??
              "",
            employeeName: emp.name,
            paidDays: emp.noOfPaidDays,
            gross: emp.monthlyGross,
            netPay: emp.netPay,
          }))}
        />
      </Box>

      {payslipEmployee && (
        <PayslipModal
          open={Boolean(payslipEmployee)}
          onClose={() => setPayslipEmployee(null)}
          payrunId={payrunId}
          employeeId={payslipEmployee.employeeId}
          employeeName={payslipEmployee.employeeName}
          isPayrunPaid={status === "paid"}
          readOnlyIncomeTax={
            status !== "draft" && status !== "created" && status !== "rejected"
          }
        />
      )}
    </>
  );
}
