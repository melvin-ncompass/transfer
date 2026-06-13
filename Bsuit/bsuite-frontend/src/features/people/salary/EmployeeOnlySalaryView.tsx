import { TabsAtom, type TabItem } from '../../../components/tabs'
import { Box } from '@mui/system';
import PayslipView from '../org/people/directory/components/empDocs/payslips/Payslips';
import { useGetEmployeeInfoQuery } from '../api/people.api';
import TdsView from '../org/people/directory/components/empDocs/tds/TdsView';
import { useGetEmployeeQuery, useGetEmployeeSalaryTemplatePreviewQuery } from '../org/people/directory/api/directory.api';
import { useMemo } from 'react';
import { formatCurrencyByCommaSeparation } from '../../../utils/numberFormatter';
import { useGetHeaderDataQuery } from '../../company/api/company.api';
import { useGetLatestRevisedSalaryTemplateQuery } from '../org/people/directory/api/revision.api';

function EmployeeOnlySalaryView({ id }: { id?: number }) {
  const tabs: TabItem[] = [
    { label: "Salary Details", content: <EmpOnlySalaryDetails id={id!} /> },
    { label: "Documents", content: <EmployeeOnlyDocuments /> }
  ];
  return (
    <Box>
      <TabsAtom tabs={tabs} />
    </Box>
  )
}

export default EmployeeOnlySalaryView;

// ── types ────────────────────────────────────────────────────────────────────
type CommaSeparation = "US" | "IN";

interface EarningRow {
  id: number;
  name: string | undefined;
  type: string | undefined;
  value: string | null | undefined;
  monthlyAmount: string;
  annualAmount: string;
}

interface DeductionRow {
  id: number;
  name: string | undefined;
  type: string | undefined;
  value: string | null | undefined;
  monthlyAmount: string;
  annualAmount: string;
}


// ── sub-components ────────────────────────────────────────────────────────────
function Badge({ value }: { value: string | number | undefined }) {
  if (value === undefined || value === null) return <span style={styles.dash}>—</span>;
  const isPercent = typeof value === "string" && value.endsWith("%");
  return (
    <span style={isPercent ? styles.badgePercent : styles.badgeFlat}>
      {value}
    </span>
  );
}

function SalaryTable({ rows }: { rows: EarningRow[] | DeductionRow[] }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: "35%" }}>Component</th>
            {/* <th style={{ ...styles.th, width: "20%" }}>Value</th> */}
            <th style={{ ...styles.th, ...styles.right, width: "22%" }}>Monthly Amount</th>
            <th style={{ ...styles.th, ...styles.right, width: "23%" }}>Annual Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={styles.emptyCell}>No data</td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id} style={idx % 2 === 0 ? {} : styles.altRow}>
                <td style={styles.td}>{row.name ?? "—"}</td>
                {/* <td style={styles.td}><Badge value={row.value!} /></td> */}
                <td style={{ ...styles.td, ...styles.right, color: "var(--color-text-secondary, #555)" }}>
                  {row.monthlyAmount}
                </td>
                <td style={{ ...styles.td, ...styles.right, color: "var(--color-text-secondary, #555)" }}>
                  {row.annualAmount}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function EmpOnlySalaryDetails({ id }: { id?: number }) {
  // Replace these hooks with your actual query hooks
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation: CommaSeparation =
    (headerData?.data?.commaSeparation as CommaSeparation) || "IN";

  const { data: employeeInfoData } = useGetEmployeeInfoQuery();
  const { data: empData } = useGetEmployeeQuery(id ? id : employeeInfoData?.data.employeeId!);
  const { data } = useGetLatestRevisedSalaryTemplateQuery(
    empData?.data?.id!.toString()!,
  );

  const earningRows: EarningRow[] = useMemo(() => {
    return (data?.data?.employeeEarnings ?? []).map((item:any) => ({
      id: item.id,
      name: item.earning?.nameInPayslip,
      type: item.earning?.calculationType,
      value:
        item.earning?.calculationType === "percentage"
          ? `${item.earning.percentage}%`
          : item.earning?.amount,
      monthlyAmount: formatCurrencyByCommaSeparation(Number(item.monthlyAmount!), commaSeparation, "₹"),
      annualAmount: formatCurrencyByCommaSeparation(Number(item?.monthlyAmount) * 12, commaSeparation, "₹"),
    }));
  }, [data?.data?.employeeEarnings, commaSeparation]);

  const deductionRows: DeductionRow[] = useMemo(() => {
    return (data?.data?.employeeDeductions ?? []).map((item:any) => ({
      id: item.id,
      name: item.deduction?.nameInPayslip,
      type: item.deduction?.calculationType,
      value:
        item.deduction?.calculationType === "percentage"
          ? `${item.deduction?.percentage}%`
          : item.deduction?.amount,
      monthlyAmount: formatCurrencyByCommaSeparation(Number(item.monthlyAmount!), commaSeparation, "₹"),
      annualAmount: formatCurrencyByCommaSeparation(Number(item?.monthlyAmount) * 12, commaSeparation, "₹"),
    }));
  }, [data?.data?.employeeDeductions, commaSeparation]);

  return (
    <div style={styles.wrap}>
      <p style={styles.sectionTitle}>Earnings</p>
      <SalaryTable rows={earningRows} />

      {deductionRows.length > 0 && (
        <>
          <p style={{ ...styles.sectionTitle, marginTop: "1.5rem" }}>Deductions</p>
          <SalaryTable rows={deductionRows} />
        </>
      )}

      <div style={styles.summaryRow}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Monthly Gross</div>
          <div style={styles.metricValue}>
            {formatCurrencyByCommaSeparation(Number(data?.data?.monthlyGross!), commaSeparation, "₹")}
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Annual Gross</div>
          <div style={styles.metricValue}>
            {formatCurrencyByCommaSeparation(Number(data?.data?.annualGross!), commaSeparation, "₹")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrap: {
    fontFamily: "inherit",
    padding: "0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 500,
    margin: "0 0 8px",
    color: "inherit",
  },
  tableWrap: {
    border: "0.5px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    fontWeight: 500,
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    borderBottom: "0.5px solid rgba(0,0,0,0.1)",
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  td: {
    padding: "9px 10px",
    borderBottom: "0.5px solid rgba(0,0,0,0.07)",
    fontSize: 13,
  },
  altRow: {
    backgroundColor: "rgba(0,0,0,0.015)",
  },
  right: {
    textAlign: "right",
  },
  emptyCell: {
    padding: "16px 10px",
    textAlign: "center",
    color: "rgba(0,0,0,0.4)",
    fontSize: 13,
  },
  badgePercent: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 99,
    fontWeight: 500,
    backgroundColor: "#e6f1fb",
    color: "#185fa5",
  },
  badgeFlat: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 99,
    fontWeight: 500,
    backgroundColor: "rgba(0,0,0,0.06)",
    color: "rgba(0,0,0,0.5)",
    border: "0.5px solid rgba(0,0,0,0.1)",
  },
  dash: {
    color: "rgba(0,0,0,0.3)",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: "1rem",
  },
  metricCard: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
    padding: "14px 16px",
    border: "0.5px solid rgba(0,0,0,0.08)",
  },
  metricLabel: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 500,
  },
};
function EmployeeOnlyDocuments() {
  const { data: empData } = useGetEmployeeInfoQuery();
  const tabs: TabItem[] = [{ label: "Payslips", content: <PayslipView empId={Number(empData?.data?.employeeId!)} /> }, { label: "TDS", content: <TdsView empId={Number(empData?.data.employeeId)} /> }];
  return (
    <Box>
      <TabsAtom tabs={tabs} />
    </Box>
  )
}

