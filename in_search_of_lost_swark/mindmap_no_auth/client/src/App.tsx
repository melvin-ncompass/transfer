import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Neo4jVisualization from './components/Pages/Neo4jVisualization';
import InteractiveGraphVisualization from './components/Pages/InteractiveGraphVisualization';
import StateChartVisualizationReactFlow from './components/Pages/StateChartVisualizationReactFlow';
import StateChartVisualizationGoJS from './components/Pages/StateChartVisualizationGoJS';
import OverviewResizing from './components/Pages/OverviewResizing';
import WorkflowVisualization from './components/Pages/WorkflowVisualization';
import RealCodeWorkflowDemo from './components/Pages/RealCodeWorkflowDemo';
import DynamicWorkflowVisualization from './components/Pages/DynamicWorkflowVisualization';
import "./App.css";
import CreateMindmap from "./components/CreateMindmap";
import Login from "./components/Pages/Login";
import Preprocess from "./components/Pages/Preprocess";
import DashboardLayout from "./components/Pages/DashboardLayout";
import Mindmaps from "./components/Pages/Mindmaps";
import Home from "./components/Pages/About";
import ProfilePage from "./components/Pages/Profile";
import ProjectMindmap from "./components/Pages/ProjectMindmap";
import StepGenerateGraph from "./components/Steps/StepGenerateGraph";



function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<DashboardLayout />}></Route>
          <Route path="/dashboard" element={<DashboardLayout />}></Route>
          <Route path="/create-mindmap" element={<CreateMindmap />}></Route>
          <Route path="/mindmaps" element={<Mindmaps />} />
          <Route path="/about" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />}></Route>
          <Route path="/preprocess" element={<Preprocess />}></Route>
          <Route path="/mindmap" element={<ProjectMindmap />}></Route>
          <Route path="/graph" element={<StepGenerateGraph />}></Route>
          <Route path="/test" element={<Neo4jVisualization />}></Route>
          <Route path="/interactive" element={<InteractiveGraphVisualization />}></Route>
          <Route path="/statechart" element={<StateChartVisualizationGoJS />}></Route>
          <Route path="/statechart-reactflow" element={<StateChartVisualizationReactFlow />}></Route>
          <Route path="/statechart-gojs" element={<StateChartVisualizationGoJS />}></Route>
          <Route path="/overview-resizing" element={<OverviewResizing />}></Route>
          <Route path="/workflow" element={<WorkflowVisualization />}></Route>
          <Route path="/real-code-workflow" element={<RealCodeWorkflowDemo />}></Route>
          <Route path="/dynamic-workflow" element={<DynamicWorkflowVisualization />}></Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
