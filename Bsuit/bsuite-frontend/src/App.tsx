import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes";
import "./App.css";

const router = createBrowserRouter(routes);
const AppContent = () => {
  return <RouterProvider router={router} />;
};

function App() {
  return<AppContent />
}

export default App;
