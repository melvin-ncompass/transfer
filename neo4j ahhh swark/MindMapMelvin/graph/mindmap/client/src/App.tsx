import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import "./App.css";
import CreateMindmap from "./components/CreateMindmap";
import Login from "./components/Pages/Login";
import Preprocess from "./components/Pages/Preprocess";
import DashboardLayout from "./components/Pages/DashboardLayout";
import Mindmaps from "./components/Pages/Mindmaps";
import Home from "./components/Pages/About";
import ProfilePage from "./components/Pages/Profile";
import ProjectMindmap from "./components/Pages/ProjectMindmap";
// import { ExecutionSequenceVisualization } from "./components/Pages/ExecutionSequenceVisualization";
// import { SimpleExecutionVisualization } from "./components/Pages/SimpleExecutionVisualization";
import ExecutionFlowDashboard from "./components/Pages/ExecutionFlowDashboard";


function App() {
  return (
    <div className="App">
      {/* <ExecutionFlowDashboard /> */}
      <Router>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/dashboard" element={<DashboardLayout />}></Route>
          <Route path="/create-mindmap" element={<CreateMindmap />}></Route>
          <Route path="/mindmaps" element={<Mindmaps />} />
          <Route path="/about" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />}></Route>
          <Route path="/preprocess" element={<Preprocess />}></Route>
          <Route path="/mindmap" element={<ProjectMindmap />}></Route>
          {/* <Route path="/execution-sequence" element={<ExecutionSequenceVisualization />}></Route>
          <Route path="/simple-execution" element={<SimpleExecutionVisualization />}></Route> */}
          <Route path="/execution-flow" element={<ExecutionFlowDashboard />}></Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
