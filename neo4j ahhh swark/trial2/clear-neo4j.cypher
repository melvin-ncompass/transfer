// Clear Neo4j data for the current project
MATCH (p:Project {name: "phonex-buyer"})
DETACH DELETE p;

// Also clear any orphaned function nodes
MATCH (f:Function)
WHERE NOT (f)<-[:CONTAINS]-(:Project)
DELETE f;

// Verify the cleanup
MATCH (n) RETURN count(n) as remaining_nodes;
