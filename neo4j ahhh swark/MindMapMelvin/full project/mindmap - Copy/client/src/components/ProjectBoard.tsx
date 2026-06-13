import React from "react";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";

const projects = [
  { id: 1, title: "Layering", desc: "UI/UX design project" },
  { id: 2, title: "Drawing Board", desc: "Collaborative whiteboard" },
  { id: 3, title: "App Wireframe", desc: "Mobile app prototype" },
  { id: 4, title: "Team Meeting", desc: "Sprint planning board" },
];

const ProjectsPage: React.FC = () => {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: "1fr",
        sm: "repeat(2, 1fr)",
        md: "repeat(3, 1fr)",
        lg: "repeat(4, 1fr)",
      }}
      gap={3}
    >
      {projects.map((p) => (
        <Card key={p.id} sx={{ bgcolor: "#f3f4f6" }}>
          <CardContent>
            <Typography variant="h6">{p.title}</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {p.desc}
            </Typography>
            <Button variant="contained" size="small">
              Open
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ProjectsPage;
