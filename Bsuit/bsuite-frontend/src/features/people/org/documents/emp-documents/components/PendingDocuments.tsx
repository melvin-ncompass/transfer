import { useState, useMemo, useEffect } from "react";
import { Badge, Box, Stack } from "@mui/material";
import { ForwardToInbox } from "@mui/icons-material";
import { CollapsibleRowsTableAtom } from "../../../../../../components/tables/standard-table/CollapsibleRowsTableAtom";
import { useGetPendingDocumentsForEmployeeQuery } from "../../../../me/documents/api/empdoc.api";
import { Chip } from "../../../../../../components/atom/chips";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { useNotifyEmployeeDocumentsMutation } from "../api/employee-doc.api";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useSearchParams } from "react-router-dom";

type TabOption = "byEmployee" | "byDocument";

export function PendingDocumentsPage() {
  const [searchParams] = useSearchParams();
  const activeTabDocs = Number(searchParams.get("employeeDocsTab")) || 0;

  const [activeTab, setActiveTab] = useState<TabOption>("byEmployee");
  const { data, isLoading, refetch } = useGetPendingDocumentsForEmployeeQuery();

  useEffect(() => {
    if (activeTabDocs === 0) {
      refetch();
    }
  }, [activeTabDocs, refetch]);
  const [notify] = useNotifyEmployeeDocumentsMutation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const handleNudge = async (row: any) => {
    try {
      const payload: any = {
        employeeId: row.employeeId,
      };

      if (row.documentTypeId) {
        payload.documentTypeId = [row.documentTypeId];
      }

      if (activeTab === "byEmployee" && row.detailsId) {
        payload.detailsId = [row.detailsId];
      }

      await notify({ toNotify: [payload] }).unwrap();
      showSnack("Reminder sent successfully", "success");
    } catch (error: any) {
      showSnack(error?.data?.message || "Failed to send reminder", "error");
    }
  };

  const handleNudgeAll = async (parentRow: any) => {
    try {
      let toNotify = [];

      if (activeTab === "byDocument") {
        const uniqueEmployeeIds = Array.from(new Set(parentRow.children?.map((child: any) => child.employeeId)));
        toNotify = uniqueEmployeeIds.map(empId => ({
          employeeId: empId as number,
          documentTypeId: [parentRow.documentTypeId]
        }));
      } else {
        const groupedByDocType = (parentRow.children || []).reduce((acc: any, child: any) => {
          const typeId = child.documentTypeId;
          if (!acc[typeId]) {
            acc[typeId] = {
              employeeId: child.employeeId,
              detailsId: [],
              documentTypeId: [typeId],
            };
          }
          if (child.detailsId) {
            acc[typeId].detailsId.push(child.detailsId);
          }
          return acc;
        }, {});

        toNotify = Object.values(groupedByDocType).map((item: any) => {
          if (item.detailsId.length === 0) {
            const { detailsId, ...rest } = item;
            return rest;
          }
          return item;
        });
      }

      if (toNotify.length === 0) return;

      await notify({ toNotify }).unwrap();
      showSnack("Reminders sent successfully", "success");
    } catch (error: any) {
      showSnack(error?.data?.message || "Failed to send reminders", "error");
    }
  };

  const rows = useMemo(() => {
    if (!data) return [];

    if (activeTab === "byEmployee") {
      return Object.entries(data.groupedByEmployee).map(([empId, info]: [string, any]) => ({
        id: empId,
        name: info.employeeName,
        employeeId: parseInt(empId),
        children: [
          ...info.rejected.map((doc: any) => ({
            id: `rej-${doc.id}`,
            detailsId: doc.id,
            employeeId: parseInt(empId),
            documentTypeId: doc.documentType?.id,
            employee: info.employeeName,
            jobTitle: info.employeeDesignation,
            document: doc.documentType?.documentTypeName,
            department: info.employeeDepartment,
            status: "Rejected",
          })),
          ...info.pending.map((doc: any) => ({
            id: `pen-${doc.id}`,
            documentTypeId: doc.id,
            employeeId: parseInt(empId),
            employee: info.employeeName,
            jobTitle: info.employeeDesignation,
            document: doc.documentTypeName,
            department: info.employeeDepartment,
            status: "Pending",
          })),
        ],
      })).filter((info: any) => info.children.length > 0);
    }

    return Object.entries(data.groupedByDocuments).map(([docId, info]: [string, any]) => ({
      id: docId,
      name: info.documentTypeName,
      documentTypeId: parseInt(docId),
      children: [
        ...info.rejected.map((doc: any) => ({
          id: `rej-${doc.id}`,
          detailsId: doc.id,
          employeeId: doc.employee?.id,
          documentTypeId: parseInt(docId),
          employee: doc.employeeName,
          jobTitle: doc.employeeDesignation,
          document: info.documentTypeName,
          department: doc.employeeDepartment,
          status: "Rejected",
        })),
        ...info.pending.map((emp: any) => ({
          id: `pen-${emp.employeeId}`,
          employeeId: emp.employeeId,
          documentTypeId: parseInt(docId),
          employee: emp.employeeName,
          jobTitle: emp.employeeDesignation,
          document: info.documentTypeName,
          department: emp.employeeDepartment,
          status: "Pending",
        })),
      ],
    })).filter((info: any) => info.children.length > 0);
  }, [data, activeTab]);

  const columns = [
    {
      label: "Employee / Document",
      field: "employee",
      render: (_v: any, row: any, ctx: any) => ctx?.isChild ? row.employee : row.name,
    },
    { label: "Document", field: "document" },
    {
      label: "Status",
      field: "status",
      render: (_v: any, row: any) =>
        row.status ? <Chip label={row.status} color={row.status === "Pending" ? "warning" : "error"} /> : null,
    },
    {
      label: "Actions",
      field: "actions",
      align: "right",
      render: (_v: any, row: any, ctx: any) =>
        ctx?.isChild ? (
          <PrimaryIconButton
            icon={<ForwardToInbox sx={{ width: 18 }} />}
            title="Send Reminder"
            color="primary"
            variant="outlined"
            onClick={() => handleNudge(row)}
          />
        ) : null,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ flexShrink: 0, pb: 1 }}>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <Chip
            label="Group by Employee"
            size="small"
            onClick={() => setActiveTab("byEmployee")}
            color={activeTab === "byEmployee" ? "primary" : "secondary"}
          />
          <Chip
            label="Group by Document"
            size="small"
            onClick={() => setActiveTab("byDocument")}
            color={activeTab === "byDocument" ? "primary" : "secondary"}
          />
        </Stack>
      </Box>

      <Box mt={2} sx={{ flex: 1, minHeight: 0, width: "100%", overflowX: "auto" }}>
        <CollapsibleRowsTableAtom
          columns={columns}
          rows={rows}
          emptyChildrenMessage="No data available"
          
          renderParentActions={(row) => (
            <Box sx={{ mt: 0.2 }}>
              <Badge
                badgeContent={row.children?.length ?? 0}
                color="success"
                overlap="circular"
                max={99}
              >
                <PrimaryIconButton
                  icon={<ForwardToInbox sx={{ width: 18 }} />}
                  title={`Send Reminder to all (${row.children?.length ?? 0})`}
                  color="primary"
                  onClick={() => handleNudgeAll(row)}
                />
              </Badge>
            </Box>
          )}
          ariaLabel="Pending Documents"
        />
      </Box>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </Box>
  );
}