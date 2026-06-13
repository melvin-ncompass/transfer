import React, { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";

interface Project {
  id: number;
  projectname: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [openSidebar, setOpenSidebar] = useState(true);


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/projects/allProjects?username=${sessionStorage.getItem("username") || "saahithi-ncompass"
          }`
        );
        const data = await res.json();
        if (res.ok && data?.data) setProjects(data.data);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, []);

  return (
    <Box sx={{ bgcolor: "#0D1117", color: "white", minHeight: "100vh", p: 4 }}>
      <Sidebar open={openSidebar} setOpen={setOpenSidebar} />

      <Box sx={{ display: "flex", gap: 4 }}>
        <Avatar
          src="https://avatars.githubusercontent.com/u/9919?s=200&v=4"
          alt="User"
          sx={{ width: 150, height: 150, border: "2px solid #30363d" }}
        />
        <Box>
          <Typography variant="h5">Saahithi Chevuri</Typography>
          <Typography variant="body1" color="gray">
            saahithi-ncompass
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Frontend Developer | MERN Stack Enthusiast
          </Typography>
          <Typography variant="body2" color="gray" sx={{ mt: 1 }}>
            Chennai, India
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2, borderColor: "#30363d", color: "white" }}
          >
            Follow
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 4, mt: 3 }}>
        <Typography>Repositories {projects.length}</Typography>
        <Typography>Projects {projects.length}</Typography>
        <Typography>Followers 10</Typography>
        <Typography>Following 5</Typography>
      </Box>

      <Divider sx={{ bgcolor: "#30363d", my: 3 }} />

      <Tabs
        value={tab}
        onChange={(_e: any, newValue) => setTab(newValue)}
        textColor="inherit"
        // indicatorColor= "#fff"
        sx={{
          borderBottom: "1px solid #30363d",
          "& .MuiTab-root": { textTransform: "none", fontWeight: "bold" },
        }}
      >
        <Tab label="Repositories" />
        <Tab label="Projects" />
        {/* <Tab label="Stars" /> */}
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {tab === 0 && (
          <Box sx={{ display: "grid", gap: 2 }}>
            {projects.map((p) => (
              <Card
                key={p.id}
                sx={{
                  bgcolor: "#161b22",
                  color: "white",
                  border: "1px solid #30363d",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#1c2128" },
                }}
                onClick={() => navigate(`/dashboard/projects/${p.id}`)}
              >
                <CardContent>
                  <Typography variant="h6">{p.projectname}</Typography>
                  <Typography variant="body2" color="gray">
                    Project description here...
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        {tab === 1 && <Typography>...</Typography>}
        {/* {tab === 2 && <Typography>...</Typography>} */}
      </Box>
    </Box>
  );
};

export default ProfilePage;
