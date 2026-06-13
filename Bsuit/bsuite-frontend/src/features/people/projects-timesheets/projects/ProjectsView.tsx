import { forwardRef } from "react";
import type { TabSectionRef } from "../../salary/structure/SalaryStructureView";
import { ProjectsSection } from "./components/ProjectsSection";

const ProjectsView = forwardRef<TabSectionRef>((_, ref) => {
  return <ProjectsSection ref={ref} />;
});

ProjectsView.displayName = "ProjectsView";

export default ProjectsView;
