import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import CreateMindmap from "./components/CreateMindmap";
import Login from "./components/Pages/Login";
import Preprocess from "./components/Pages/Preprocess";
import DashboardLayout from "./components/Pages/DashboardLayout";
import Mindmaps from "./components/Pages/Mindmaps";
import Home from "./components/Pages/About";
import ProfilePage from "./components/Pages/Profile";
import ProjectMindmap from "./components/Pages/ProjectMindmap";
import Neo4jStyleMindmap from "./components/Mindmap/Neo4jStyleMindmap";
import MindmapIndex from "./components/Pages/MindmapIndex";


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/dashboard" element={<DashboardLayout />}></Route>
          <Route path="/create-mindmap" element={<CreateMindmap />}></Route>
          <Route path="/mindmaps" element={<Mindmaps />} />
          <Route path="/about" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />}></Route>
          <Route path="/preprocess" element={<Preprocess />}></Route>
          <Route path="/mindmap" element={<MindmapIndex />}></Route>
          <Route path="/mindmap/neo4j" element={<Neo4jStyleMindmap />}></Route>
          <Route path="/mindmap/classic" element={<ProjectMindmap />}></Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
