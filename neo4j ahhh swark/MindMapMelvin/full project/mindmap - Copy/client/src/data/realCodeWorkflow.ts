// Real code workflow data based on GraphData - executeQuery function dependency tree
// This creates a sequential workflow from the actual codebase structure
import { graphData } from './graphData';

// Helper function to find nodes and links related to our parent function
const findRelatedNodes = () => {
  const nodes = graphData.nodes;
  const links = graphData.links;
  
  // Find the parent node - executeQuery (most used function with 81 usages)
  const parentNode = nodes.find((node: any) => 
    node.id === "src/utilities/db.ts#executeQuery"
  );
  
  // Find all functions that depend on executeQuery
  const dependentLinks = links.filter((link: any) => 
    link.target === "src/utilities/db.ts#executeQuery"
  );
  
  // Get the actual dependent functions
  const dependentNodes = dependentLinks.map((link: any) => 
    nodes.find((node: any) => node.id === link.source)
  ).filter(Boolean);
  
  // Group dependent functions by category/module for organization
  const groupedDependents = dependentNodes.reduce((acc: any, node: any) => {
    const category = node.group || 'misc';
    if (!acc[category]) acc[category] = [];
    acc[category].push(node);
    return acc;
  }, {});
  
  return { parentNode, dependentNodes, groupedDependents };
};

const { parentNode, dependentNodes, groupedDependents } = findRelatedNodes();

// Professional workflow data based on real code structure
export const realCodeWorkflowData = {
  "nodes": [
    // Start Node
    {
      "id": "start",
      "key": "start",
      "name": "Start Code Execution",
      "text": "Start Code Execution",
      "type": "start",
      "category": "process",
      "isParentNode": true,
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 0,
      "description": "Begin execution flow in the codebase - all operations start here."
    },
    
    // Database Connection Setup
    {
      "id": "setup-db",
      "key": "setup-db", 
      "name": "Initialize Database",
      "text": "Initialize Database",
      "type": "process",
      "category": "infrastructure",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Set up database connections and prepare query execution environment."
    },
    
    // Core Database Operation - Our Parent Node
    {
      "id": "execute-query",
      "key": "execute-query",
      "name": "Execute Database Query",
      "text": "Execute Database Query", 
      "type": "process",
      "category": "core",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": `Core database function used by ${dependentNodes.length} other functions. Central query execution point.`
    },
    
    // Decision Point - Query Type
    {
      "id": "query-type",
      "key": "query-type",
      "name": "Determine Query Type",
      "text": "Determine Query Type", 
      "type": "decision",
      "category": "decision",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Analyze the type of database operation needed based on calling function."
    },
    
    // Business Logic Operations
    {
      "id": "business-logic-ops",
      "key": "business-logic-ops",
      "name": "Business Logic Operations",
      "text": "Business Logic Operations",
      "type": "process",
      "category": "business-logic", 
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 2,
      "description": `Execute business operations (${groupedDependents['business-logic']?.length || 0} functions depend on this path)`
    },
    
    // Utility Operations
    {
      "id": "utility-ops",
      "key": "utility-ops",
      "name": "Utility Operations",
      "text": "Utility Operations", 
      "type": "process",
      "category": "util",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 2,
      "description": `Execute utility functions (${groupedDependents['util']?.length || 0} functions depend on this path)`
    },
    
    // Service Operations
    {
      "id": "service-ops",
      "key": "service-ops",
      "name": "Service Operations",
      "text": "Service Operations",
      "type": "process",
      "category": "service",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 2,
      "description": `Execute service layer functions (${groupedDependents['service']?.length || 0} functions depend on this path)`
    },
    
    // Query Processing
    {
      "id": "process-results",
      "key": "process-results",
      "name": "Process Query Results",
      "text": "Process Query Results",
      "type": "process",
      "category": "processing",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Transform and validate query results before returning to calling functions."
    },
    
    // Error Handling Decision
    {
      "id": "error-check",
      "key": "error-check",
      "name": "Check for Errors",
      "text": "Check for Errors",
      "type": "decision",
      "category": "decision",
      "hasChildren": true,
      "everExpanded": false,
      "isExpanded": false,
      "level": 1,
      "description": "Validate query execution and handle any errors that occurred."
    },
    
    // Success Path
    {
      "id": "return-results",
      "key": "return-results",
      "name": "Return Results",
      "text": "Return Results",
      "type": "process", 
      "category": "completion",
      "hasChildren": false,
      "level": 1,
      "description": "Successfully return processed data to the calling function."
    },
    
    // Error Path
    {
      "id": "handle-error",
      "key": "handle-error",
      "name": "Handle Error",
      "text": "Handle Error",
      "type": "process",
      "category": "error", 
      "hasChildren": false,
      "level": 1,
      "description": "Process and log errors, return appropriate error response."
    },
    
    // End Node
    {
      "id": "end",
      "key": "end",
      "name": "Query Complete",
      "text": "Query Complete",
      "type": "end",
      "category": "process",
      "hasChildren": false,
      "level": 0,
      "description": `Database operation completed. Results returned to one of ${dependentNodes.length} possible calling functions.`
    }
  ],
  
  "links": [
    // Main flow sequence
    { "key": "link-1", "from": "start", "to": "setup-db", "source": "start", "target": "setup-db", "type": "flow", "category": "main" },
    { "key": "link-2", "from": "setup-db", "to": "execute-query", "source": "setup-db", "target": "execute-query", "type": "flow", "category": "main" },
    { "key": "link-3", "from": "execute-query", "to": "query-type", "source": "execute-query", "target": "query-type", "type": "flow", "category": "main" },
    
    // Query type branches
    { "key": "link-4", "from": "query-type", "to": "business-logic-ops", "source": "query-type", "target": "business-logic-ops", "type": "decision", "category": "branch", "label": "Business Logic" },
    { "key": "link-5", "from": "query-type", "to": "utility-ops", "source": "query-type", "target": "utility-ops", "type": "decision", "category": "branch", "label": "Utilities" },
    { "key": "link-6", "from": "query-type", "to": "service-ops", "source": "query-type", "target": "service-ops", "type": "decision", "category": "branch", "label": "Services" },
    
    // Convergence to processing
    { "key": "link-7", "from": "business-logic-ops", "to": "process-results", "source": "business-logic-ops", "target": "process-results", "type": "flow", "category": "main" },
    { "key": "link-8", "from": "utility-ops", "to": "process-results", "source": "utility-ops", "target": "process-results", "type": "flow", "category": "main" },
    { "key": "link-9", "from": "service-ops", "to": "process-results", "source": "service-ops", "target": "process-results", "type": "flow", "category": "main" },
    
    // Continue main flow
    { "key": "link-10", "from": "process-results", "to": "error-check", "source": "process-results", "target": "error-check", "type": "flow", "category": "main" },
    { "key": "link-11", "from": "error-check", "to": "return-results", "source": "error-check", "target": "return-results", "type": "decision", "category": "branch", "label": "Success" },
    { "key": "link-12", "from": "error-check", "to": "handle-error", "source": "error-check", "target": "handle-error", "type": "decision", "category": "branch", "label": "Error" },
    { "key": "link-13", "from": "return-results", "to": "end", "source": "return-results", "target": "end", "type": "flow", "category": "main" },
    { "key": "link-14", "from": "handle-error", "to": "end", "source": "handle-error", "target": "end", "type": "flow", "category": "main" },
    
    // Feedback loops
    { "key": "link-15", "from": "end", "to": "execute-query", "source": "end", "target": "execute-query", "type": "feedback", "category": "feedback", "label": "New Query" }
  ],

  // Expandable children data with real code functions
  "expandableData": {
    "setup-db": [
      {
        "id": "db-connection",
        "key": "db-connection",
        "name": "Establish Connection",
        "text": "Establish Connection",
        "type": "process",
        "category": "infrastructure",
        "hasChildren": false,
        "level": 2,
        "description": "Create database connection pool and validate connectivity."
      },
      {
        "id": "db-config",
        "key": "db-config", 
        "name": "Load Configuration",
        "text": "Load Configuration",
        "type": "process",
        "category": "infrastructure",
        "hasChildren": false,
        "level": 2,
        "description": "Load database configuration settings and environment variables."
      }
    ],

    "execute-query": [
      {
        "id": "validate-query",
        "key": "validate-query",
        "name": "Validate Query",
        "text": "Validate Query",
        "type": "process",
        "category": "core",
        "hasChildren": false,
        "level": 2,
        "description": "Validate SQL syntax and parameters before execution."
      },
      {
        "id": "execute-sql",
        "key": "execute-sql",
        "name": "Execute SQL",
        "text": "Execute SQL",
        "type": "process",
        "category": "core",
        "hasChildren": false,
        "level": 2,
        "description": `Execute the actual database query (Complexity: ${parentNode?.complexity || 'Unknown'})`
      },
      {
        "id": "log-query",
        "key": "log-query",
        "name": "Log Query",
        "text": "Log Query",
        "type": "process",
        "category": "core",
        "hasChildren": false,
        "level": 2,
        "description": "Log query execution for monitoring and debugging."
      }
    ],

    "business-logic-ops": (groupedDependents['business-logic'] || []).slice(0, 5).map((node: any, index: number) => ({
      "id": `business-${index}`,
      "key": `business-${index}`,
      "name": node.name || `Business Function ${index + 1}`,
      "text": node.name || `Business Function ${index + 1}`,
      "type": "process",
      "category": "business-logic",
      "hasChildren": false,
      "level": 3,
      "description": `${node.filePath} - Complexity: ${node.complexity} (${node.usedByCount} dependents)`
    })),

    "utility-ops": (groupedDependents['util'] || []).slice(0, 5).map((node: any, index: number) => ({
      "id": `util-${index}`,
      "key": `util-${index}`,
      "name": node.name || `Utility Function ${index + 1}`,
      "text": node.name || `Utility Function ${index + 1}`,
      "type": "process",
      "category": "util",
      "hasChildren": false,
      "level": 3,
      "description": `${node.filePath} - Complexity: ${node.complexity} (${node.usedByCount} dependents)`
    })),

    "service-ops": (groupedDependents['service'] || []).slice(0, 5).map((node: any, index: number) => ({
      "id": `service-${index}`,
      "key": `service-${index}`,
      "name": node.name || `Service Function ${index + 1}`,
      "text": node.name || `Service Function ${index + 1}`,
      "type": "process",
      "category": "service",
      "hasChildren": false,
      "level": 3,
      "description": `${node.filePath} - Complexity: ${node.complexity} (${node.usedByCount} dependents)`
    })),

    "process-results": [
      {
        "id": "transform-data",
        "key": "transform-data",
        "name": "Transform Data",
        "text": "Transform Data",
        "type": "process",
        "category": "processing",
        "hasChildren": false,
        "level": 2,
        "description": "Transform raw database results into expected format."
      },
      {
        "id": "validate-data",
        "key": "validate-data", 
        "name": "Validate Results",
        "text": "Validate Results",
        "type": "process",
        "category": "processing",
        "hasChildren": false,
        "level": 2,
        "description": "Validate data integrity and business rules compliance."
      }
    ],

    "error-check": [
      {
        "id": "check-sql-error",
        "key": "check-sql-error",
        "name": "Check SQL Errors",
        "text": "Check SQL Errors",
        "type": "decision",
        "category": "decision",
        "hasChildren": false,
        "level": 2,
        "description": "Check for SQL execution errors or constraint violations."
      },
      {
        "id": "check-data-error",
        "key": "check-data-error",
        "name": "Check Data Errors",
        "text": "Check Data Errors",
        "type": "decision",
        "category": "decision",
        "hasChildren": false,
        "level": 2,
        "description": "Validate returned data meets expected format and constraints."
      }
    ]
  },

  // Real code statistics
  "metadata": {
    "parentFunction": parentNode?.name || "executeQuery",
    "filePath": parentNode?.filePath || "src/utilities/db.ts",
    "complexity": parentNode?.complexity || 22,
    "usedByCount": parentNode?.usedByCount || 81,
    "totalDependents": dependentNodes.length,
    "categories": Object.keys(groupedDependents),
    "description": `Real code workflow based on the ${parentNode?.name || 'executeQuery'} function which is central to ${dependentNodes.length} other functions in the codebase.`
  }
};