import express from "express";
import neo4j from "neo4j-driver";

const app = express();
const PORT = 3000;

// Serve static frontend
app.use(express.static("public"));

// Connect to Neo4j
const driver = neo4j.driver(
  "bolt://localhost:7687",                     // or "neo4j+s://<cloud-URL>"
  neo4j.auth.basic("neo4j", "password")        // update with your creds
);

app.get("/graph", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(
      "MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 25"
    );

    const nodes = {};
    const links = [];

    result.records.forEach(record => {
      const a = record.get("a");
      const b = record.get("b");
      const r = record.get("r");

      nodes[a.identity.toString()] = {
        key: a.identity.toString(),
        label: a.labels[0]
      };
      nodes[b.identity.toString()] = {
        key: b.identity.toString(),
        label: b.labels[0]
      };

      links.push({
        from: a.identity.toString(),
        to: b.identity.toString(),
        rel: r.type
      });
    });

    res.json({
      nodeDataArray: Object.values(nodes),
      linkDataArray: links
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching graph");
  } finally {
    await session.close();
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
