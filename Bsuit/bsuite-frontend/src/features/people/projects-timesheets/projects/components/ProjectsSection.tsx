import { forwardRef, useImperativeHandle, useState } from "react";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog/ConfirmDialog";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import { AddProjectModal } from "./AddProjectModal";
import { EditProjectModal } from "./EditProjectModal";
import type { TabSectionRef } from "../../../salary/structure/SalaryStructureView";
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "../api/project.api";
import type { ProjectParams, ProjectResponse } from "../types/project.types";
import { useNavigate } from "react-router-dom";

interface ProjectsSectionProps {
  searchQuery?: string;
}

export const ProjectsSection = forwardRef<TabSectionRef, ProjectsSectionProps>(
  ({ searchQuery: externalSearch = "" }, ref) => {
    const navigate = useNavigate();
    const { data: projects, isLoading } = useGetProjectsQuery();
    const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
    const [deleteProject] = useDeleteProjectMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);

    const [internalSearchQuery, setInternalSearchQuery] = useState("");
    const [snackbar, setSnackbar] = useState<{
      open: boolean;
      message: string;
      severity: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", severity: "info" });

    const searchQuery = externalSearch || internalSearchQuery;

    useImperativeHandle(ref, () => ({
      openAddModal: () => setIsAddModalOpen(true),
      search: (query: string) => setInternalSearchQuery(query),
    }));

    const showSnackbar = (
      message: string,
      severity: "success" | "error" | "info" | "warning"
    ) => setSnackbar({ open: true, message, severity });

    const handleCreateProject = async (data: ProjectParams) => {
      try {
        await createProject(data).unwrap();
        showSnackbar("Project created successfully!", "success");
        setIsAddModalOpen(false);
      } catch (error: any) {
        showSnackbar(error?.data?.message || "Failed to create project.", "error");
      }
    };

    const handleUpdateProject = async (
      id: number,
      data: Partial<ProjectParams>
    ) => {
      try {
        await updateProject({ id, body: data }).unwrap();
        showSnackbar("Project updated successfully!", "success");
        setIsEditModalOpen(false);
      } catch (error: any) {
        showSnackbar(error?.data?.message || "Failed to update project.", "error");
      }
    };

    const handleDeleteConfirm = async () => {
      if (selectedProject) {
        try {
          await deleteProject(selectedProject.id).unwrap();
          showSnackbar("Project deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error?.data?.message || "Failed to delete project.", "error");
        }
      }
      setIsConfirmDialogOpen(false);
      setSelectedProject(null);
    };

    const handleActionClick = (
      event: React.MouseEvent<HTMLButtonElement>,
      project: ProjectResponse
    ) => {
      setAnchorEl(event.currentTarget);
      setSelectedProject(project);
    };

    const handleMenuClose = () => setAnchorEl(null);

    const handleEditClick = () => {
      setIsEditModalOpen(true);
      handleMenuClose();
    };

    const handleDeleteClick = () => {
      setIsConfirmDialogOpen(true);
      handleMenuClose();
    };

    const menuItems = [
      {
        label: "Edit",
        icon: <EditIcon fontSize="small" />,
        onClick: handleEditClick,
      },
      {
        label: "Delete",
        icon: <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />,
        onClick: handleDeleteClick,
      },
    ];

    const rows = (projects ?? []).filter((p) =>
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
      {
        id: "projectName",
        label: "Project Name",
        render: (row: ProjectResponse) => (
          <Typography 
            variant="body2"
            onClick={() => navigate(`/people/projects/${row.id}`)}
            sx={{ 
              cursor: "pointer", 
              textDecoration: "underline", 
              color: "primary.main"
            }}
          >
            {row.projectName}
          </Typography>
        ),
      },
      {
        id: "billableHoursPerDay",
        label: "Billable hrs/day",
        render: (row: ProjectResponse) => (
          <Typography variant="body2">{row.billableHoursPerDay}</Typography>
        ),
      },
      {
        id: "totalEmployees",
        label: "Total Employees",
        render: (row: ProjectResponse) => (
          <Typography variant="body2">{row.totalEmployees}</Typography>
        )
      },
      {
        id: "actions",
        label: "Actions",
        width: 80,
        render: (row: ProjectResponse) => (
          <IconButton
            size="small"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              handleActionClick(e, row);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        ),
      },
    ];

    return (
      <Box sx={{ mt: 1 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <StandardTable
            columns={columns}
            rows={rows}
            loading={false}
            sticky
            emptyMessage="No projects found"
          />
        )}

        <AddProjectModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateProject}
          loading={isCreating}
        />

        <EditProjectModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProject(null);
          }}
          onSave={handleUpdateProject}
          projectInfo={selectedProject}
          loading={isUpdating}
        />

        <MenuAtom
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onCloseAll={handleMenuClose}
          items={menuItems}
        />

        <ConfirmDialog
          open={isConfirmDialogOpen}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          confirmText="Delete"
          confirmColor="error"
        />

        {snackbar.open && (
          <Snackbar
            message={snackbar.message}
            color={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            autoClose={4000}
          />
        )}
      </Box>
    );
  }
);

ProjectsSection.displayName = "ProjectsSection";
