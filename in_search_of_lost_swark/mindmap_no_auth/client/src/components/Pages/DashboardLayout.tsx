import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Card,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, useLocation } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import CreateMindmap from "../CreateMindmap";
import Sidebar from "../Sidebar";
import ProfileMenu from "../ProfileMenu";
import ProjectCard from "../ProjectCard";
import { API_BASE_URL } from "../../config/api";

const drawerWidth = 240;

interface Project {
  id: number;
  projectname: string;

}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const DashboardLayout: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(true);
  const [user, setUser] = useState<{ data: { login: string } }>({ data: { login: "" } });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const username = "local";
        const res = await fetch(
          `${API_BASE_URL}/projects/allProjects?username=${username}`
        );
        const data = await res.json();
        if (res.ok && data && Array.isArray(data.data)) {
          setProjects(data.data);
        } else if (res.ok && Array.isArray(data)) {
          setProjects(data);
        } else {
          console.warn("API did not return an array for projects", data);
          setProjects([]);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      }
    };

    // Set local user
    setUser({ data: { login: "local" } });
    sessionStorage.setItem("username", "local");
    sessionStorage.setItem("access_token", "no-auth");

    fetchProjects();

  }, []);

  /*
  const getUserInfo = async () => {
    const tokenFromURL = query.get("token");
    const res = await fetch(`${API_BASE_URL}/repo/user?token=${tokenFromURL}`);
    const userProfile = await res.json();
    setUser(userProfile);
    // console.log(userProfile)
    sessionStorage.setItem("access_token", tokenFromURL || "");
    sessionStorage.setItem("username", userProfile.data.login || "")
  }
  */


  const filteredProjects = Array.isArray(projects) ? projects.filter((project) =>
    project.projectname?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar open={openSidebar} setOpen={setOpenSidebar} />

      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${openSidebar ? drawerWidth : 0}px)`,
            ml: openSidebar ? `${drawerWidth}px` : 0,
            bgcolor: "#0D1117",
            transition: "all 0.3s ease",
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid #30353bff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {!openSidebar && (
                <IconButton
                  onClick={() => setOpenSidebar(true)}
                  sx={{ color: "#fff" }}
                  edge="start"
                >
                  <MenuIcon />
                </IconButton>
              )}

              <Typography variant="h6">NCompass</Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "#434343",
                  borderRadius: "10px",
                  ml: 10,
                  px: 1,
                  height: 35,
                  width: "500px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#fff",
                    padding: "6px",
                  }}
                />
              </Box>
            </Box>

            <ProfileMenu />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            ml: openSidebar ? `${drawerWidth}px` : 0,
            transition: "margin 0.3s ease",
            px: 4,
          }}
        >
          <Box
            sx={{
              bgcolor: "#161B22",
              color: "#fff",
              borderRadius: "12px",
              p: 2,
              textAlign: "left",
              mb: 3,
              width: "100%",
              boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", padding: "15 px" }}>
              Welcome {user?.data?.login || "Loading"}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              justifyContent: "flex-start",
              width: "100%"
            }}
          >
            {searchTerm.trim() === "" ? (
              <>
                <Card
                  sx={{
                    height: 180,
                    width: 180,
                    bgcolor: "#434343",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    borderRadius: "10%",
                  }}
                  onClick={() => setOpenCreate(true)}
                >
                  <IconButton>
                    <FaPlus fontSize="xxx-large" color="#a1a8a6ff" />
                  </IconButton>
                  <Typography variant="body1" sx={{ color: "#999999" }}>
                    Add Project
                  </Typography>
                </Card>

                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={() => navigate(`/preprocess`)}
                    onDelete={(id) => console.log("Delete project", id)}
                  />
                ))}
              </>
            ) : (
              <>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onView={(id) => navigate(`/dashboard/projects/${id}`)}
                      onDelete={(id) => console.log("Delete project", id)}
                    />
                  ))
                ) : (
                  <Typography sx={{ color: "#aaa", mt: 4 }}>
                    No projects found.
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>

        <Dialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogContent sx={{ bgcolor: "#0D1117", p: 3 }}>
            <CreateMindmap />
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
