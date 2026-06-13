// Professional workflow data for repository onboarding - sequential flow with expand/collapse
export const workflowData = {
  "nodes": [
    // Start Node
    {
      "id": "start",
      "key": "start",
      "name": "Start",
      "text": "Start",
      "type": "start",
      "category": "process",
      "isParentNode": true,
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 0,
      "description": "Welcome to the MindMap Repository! Begin your developer journey here."
    },
    
    // Initial Steps
    {
      "id": "join-team",
      "key": "join-team", 
      "name": "Join Team",
      "text": "Join Team",
      "type": "process",
      "category": "onboarding",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Get access credentials, join team channels, meet your mentor."
    },
    
    {
      "id": "setup-environment",
      "key": "setup-environment",
      "name": "Setup Environment", 
      "text": "Setup Environment",
      "type": "process",
      "category": "development",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Install Node.js, Git, Neo4j, VS Code and clone the repository."
    },
    
    // Learning Path Decision
    {
      "id": "choose-path",
      "key": "choose-path",
      "name": "Choose Learning Path",
      "text": "Choose Learning Path", 
      "type": "decision",
      "category": "decision",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Choose your focus area based on your interests and role."
    },
    
    // Frontend Path
    {
      "id": "frontend-path",
      "key": "frontend-path",
      "name": "Frontend Focus",
      "text": "Frontend Focus",
      "type": "process",
      "category": "frontend", 
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 2,
      "description": "Learn React, TypeScript, GoJS visualization, and Material-UI components."
    },
    
    // Backend Path
    {
      "id": "backend-path",
      "key": "backend-path",
      "name": "Backend Focus",
      "text": "Backend Focus", 
      "type": "process",
      "category": "backend",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 2,
      "description": "Learn NestJS framework, Neo4j graph database, and API development."
    },
    
    // Full-Stack Path  
    {
      "id": "fullstack-path",
      "key": "fullstack-path",
      "name": "Full-Stack Focus",
      "text": "Full-Stack Focus",
      "type": "process",
      "category": "fullstack",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 2,
      "description": "Learn both frontend and backend technologies with focus on integration."
    },
    
    // Testing Phase
    {
      "id": "hands-on-testing",
      "key": "hands-on-testing",
      "name": "Hands-on Testing",
      "text": "Hands-on Testing",
      "type": "process",
      "category": "testing",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Test the application features, create projects, and generate mind maps."
    },
    
    // Contribution Phase
    {
      "id": "ready-contribute",
      "key": "ready-contribute",
      "name": "Ready to Contribute",
      "text": "Ready to Contribute",
      "type": "decision",
      "category": "decision",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Feel confident about the codebase? Choose your contribution type."
    },
    
    // Review Process
    {
      "id": "code-review",
      "key": "code-review",
      "name": "Code Review",
      "text": "Code Review",
      "type": "process",
      "category": "quality",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Submit pull request and get feedback from senior developers."
    },
    
    // Final Steps
    {
      "id": "deployment",
      "key": "deployment",
      "name": "Deployment",
      "text": "Deployment",
      "type": "process", 
      "category": "deployment",
      "hasChildren": false,
      "level": 1,
      "description": "Your changes are merged and deployed. Celebrate your contribution!"
    },
    
    {
      "id": "mentor-others",
      "key": "mentor-others",
      "name": "Mentor Others",
      "text": "Mentor Others",
      "type": "process",
      "category": "mentoring", 
      "hasChildren": false,
      "level": 1,
      "description": "Help new developers through this same journey. Pay it forward!"
    },
    
    // End Node
    {
      "id": "end",
      "key": "end",
      "name": "Expert Developer",
      "text": "Expert Developer",
      "type": "end",
      "category": "process",
      "hasChildren": false,
      "level": 0,
      "description": "Congratulations! You're now an expert contributor to the MindMap repository."
    }
  ],
  
  "links": [
    // Main flow sequence
    { "key": "link-1", "from": "start", "to": "join-team", "source": "start", "target": "join-team", "type": "flow", "category": "main" },
    { "key": "link-2", "from": "join-team", "to": "setup-environment", "source": "join-team", "target": "setup-environment", "type": "flow", "category": "main" },
    { "key": "link-3", "from": "setup-environment", "to": "choose-path", "source": "setup-environment", "target": "choose-path", "type": "flow", "category": "main" },
    
    // Learning path branches
    { "key": "link-4", "from": "choose-path", "to": "frontend-path", "source": "choose-path", "target": "frontend-path", "type": "decision", "category": "branch", "label": "Frontend" },
    { "key": "link-5", "from": "choose-path", "to": "backend-path", "source": "choose-path", "target": "backend-path", "type": "decision", "category": "branch", "label": "Backend" },
    { "key": "link-6", "from": "choose-path", "to": "fullstack-path", "source": "choose-path", "target": "fullstack-path", "type": "decision", "category": "branch", "label": "Full-Stack" },
    
    // Convergence to testing
    { "key": "link-7", "from": "frontend-path", "to": "hands-on-testing", "source": "frontend-path", "target": "hands-on-testing", "type": "flow", "category": "main" },
    { "key": "link-8", "from": "backend-path", "to": "hands-on-testing", "source": "backend-path", "target": "hands-on-testing", "type": "flow", "category": "main" },
    { "key": "link-9", "from": "fullstack-path", "to": "hands-on-testing", "source": "fullstack-path", "target": "hands-on-testing", "type": "flow", "category": "main" },
    
    // Continue main flow
    { "key": "link-10", "from": "hands-on-testing", "to": "ready-contribute", "source": "hands-on-testing", "target": "ready-contribute", "type": "flow", "category": "main" },
    { "key": "link-11", "from": "ready-contribute", "to": "code-review", "source": "ready-contribute", "target": "code-review", "type": "flow", "category": "main" },
    { "key": "link-12", "from": "code-review", "to": "deployment", "source": "code-review", "target": "deployment", "type": "flow", "category": "main" },
    { "key": "link-13", "from": "deployment", "to": "mentor-others", "source": "deployment", "target": "mentor-others", "type": "flow", "category": "main" },
    { "key": "link-14", "from": "mentor-others", "to": "end", "source": "mentor-others", "target": "end", "type": "flow", "category": "main" },
    
    // Feedback loops
    { "key": "link-15", "from": "end", "to": "ready-contribute", "source": "end", "target": "ready-contribute", "type": "feedback", "category": "feedback", "label": "Next Project" }
  ],

  // Expandable children data - will be loaded when nodes are expanded
  "expandableData": {
    "join-team": [
      {
        "id": "get-credentials",
        "key": "get-credentials",
        "name": "Get Access Credentials",
        "text": "Get Access Credentials",
        "type": "process",
        "category": "onboarding",
        "hasChildren": false,
        "level": 2,
        "description": "Obtain GitHub access, database credentials, and development tools."
      },
      {
        "id": "meet-mentor",
        "key": "meet-mentor", 
        "name": "Meet Your Mentor",
        "text": "Meet Your Mentor",
        "type": "process",
        "category": "onboarding",
        "hasChildren": false,
        "level": 2,
        "description": "Introduction meeting with your assigned mentor and team overview."
      },
      {
        "id": "not-ready",
        "key": "not-ready",
        "name": "Not Ready Yet",
        "text": "Not Ready Yet",
        "type": "decision",
        "category": "decision",
        "hasChildren": false,
        "level": 2,
        "description": "Need more time? That's okay, take your time to get settled."
      }
    ],

    "setup-environment": [
      {
        "id": "install-tools",
        "key": "install-tools",
        "name": "Install Development Tools",
        "text": "Install Development Tools", 
        "type": "process",
        "category": "development",
        "hasChildren": false,
        "level": 2,
        "description": "Install Node.js 18+, Git, VS Code, Neo4j Desktop."
      },
      {
        "id": "clone-repo",
        "key": "clone-repo",
        "name": "Clone Repository",
        "text": "Clone Repository",
        "type": "process",
        "category": "development",
        "hasChildren": false,
        "level": 2,
        "description": "Clone the mindmap repository and set up local development."
      },
      {
        "id": "setup-help",
        "key": "setup-help",
        "name": "Need Setup Help",
        "text": "Need Setup Help",
        "type": "decision",
        "category": "decision",
        "hasChildren": false,
        "level": 2,
        "description": "Having trouble with setup? Ask your mentor or check documentation."
      }
    ],

    "frontend-path": [
      {
        "id": "learn-react",
        "key": "learn-react",
        "name": "Learn React Components",
        "text": "Learn React Components",
        "type": "process",
        "category": "frontend",
        "hasChildren": false,
        "level": 3,
        "description": "Study project structure, component patterns, hooks, and state management."
      },
      {
        "id": "learn-gojs", 
        "key": "learn-gojs",
        "name": "Master GoJS Visualization",
        "text": "Master GoJS Visualization",
        "type": "process",
        "category": "frontend",
        "hasChildren": false,
        "level": 3,
        "description": "Learn interactive diagrams, node templates, layouts, and user interactions."
      },
      {
        "id": "frontend-practice",
        "key": "frontend-practice",
        "name": "Practice UI Development", 
        "text": "Practice UI Development",
        "type": "process",
        "category": "frontend",
        "hasChildren": false,
        "level": 3,
        "description": "Build small components, experiment with styling and interactions."
      }
    ],

    "backend-path": [
      {
        "id": "learn-nestjs",
        "key": "learn-nestjs",
        "name": "Learn NestJS Framework",
        "text": "Learn NestJS Framework",
        "type": "process",
        "category": "backend",
        "hasChildren": false,
        "level": 3,
        "description": "Study modules, controllers, services, authentication, and API design."
      },
      {
        "id": "learn-neo4j",
        "key": "learn-neo4j",
        "name": "Master Neo4j Database",
        "text": "Master Neo4j Database", 
        "type": "process",
        "category": "backend",
        "hasChildren": false,
        "level": 3,
        "description": "Learn graph concepts, Cypher queries, relationships, and data modeling."
      },
      {
        "id": "backend-practice",
        "key": "backend-practice",
        "name": "Practice API Development",
        "text": "Practice API Development",
        "type": "process",
        "category": "backend", 
        "hasChildren": false,
        "level": 3,
        "description": "Create endpoints, work with database queries, test APIs."
      }
    ],

    "fullstack-path": [
      {
        "id": "understand-integration",
        "key": "understand-integration",
        "name": "Learn API Integration",
        "text": "Learn API Integration",
        "type": "process",
        "category": "integration",
        "hasChildren": false,
        "level": 3,
        "description": "Understand how frontend and backend communicate through REST APIs."
      },
      {
        "id": "api-flow",
        "key": "api-flow",
        "name": "Data Flow Understanding", 
        "text": "Data Flow Understanding",
        "type": "process",
        "category": "integration",
        "hasChildren": false,
        "level": 3,
        "description": "Understand end-to-end data flow from user interaction to database."
      }
    ],

    "hands-on-testing": [
      {
        "id": "test-features",
        "key": "test-features",
        "name": "Test All Features",
        "text": "Test All Features",
        "type": "process",
        "category": "testing",
        "hasChildren": false,
        "level": 2,
        "description": "Create projects, upload code, generate visualizations, test interactions."
      },
      {
        "id": "found-bugs",
        "key": "found-bugs", 
        "name": "Found Issues",
        "text": "Found Issues",
        "type": "decision",
        "category": "decision",
        "hasChildren": false,
        "level": 2,
        "description": "Discovered bugs or issues? Great! Report them and help improve the system."
      }
    ],

    "ready-contribute": [
      {
        "id": "ui-task",
        "key": "ui-task",
        "name": "UI Enhancement", 
        "text": "UI Enhancement",
        "type": "process",
        "category": "contribution",
        "hasChildren": false,
        "level": 2,
        "description": "Improve user interface, add animations, enhance responsiveness."
      },
      {
        "id": "feature-task",
        "key": "feature-task",
        "name": "New Feature",
        "text": "New Feature",
        "type": "process",
        "category": "contribution",
        "hasChildren": false,
        "level": 2,
        "description": "Develop new functionality, add visualization options, create tools."
      },
      {
        "id": "bug-fix",
        "key": "bug-fix",
        "name": "Bug Fix",
        "text": "Bug Fix", 
        "type": "process",
        "category": "contribution",
        "hasChildren": false,
        "level": 2,
        "description": "Fix reported issues, improve error handling, enhance stability."
      },
      {
        "id": "need-more-time",
        "key": "need-more-time",
        "name": "Need More Learning",
        "text": "Need More Learning",
        "type": "decision",
        "category": "decision",
        "hasChildren": false,
        "level": 2,
        "description": "Need more time? That's perfectly fine. Keep exploring and learning."
      }
    ],

    "code-review": [
      {
        "id": "review-passed",
        "key": "review-passed",
        "name": "Review Approved",
        "text": "Review Approved",
        "type": "process",
        "category": "quality",
        "hasChildren": false,
        "level": 2,
        "description": "Great work! Your code has been approved and will be merged."
      },
      {
        "id": "needs-changes",
        "key": "needs-changes",
        "name": "Needs Revisions",
        "text": "Needs Revisions",
        "type": "decision",
        "category": "decision",
        "hasChildren": false,
        "level": 2,
        "description": "Some changes requested. Address feedback and resubmit."
      }
    ]
  }
};