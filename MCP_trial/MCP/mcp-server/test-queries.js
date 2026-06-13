async function run() {
  const queries = [
    "What is this project?",
    "Draw a flowchart of how a query flows through the system",
    "Where does session persistence happen and which file owns it?",
    "How many sessions exist in the database?"
  ];
  const url = `http://localhost:3001/query`;

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    console.log(`\n===================`);
    console.log(`Query ${i+1}: ${q}`);
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, sessionId: `test_${i}`, config: { provider: 'gemini' } })
      });
      const data = await res.json();
      console.log(`Status: ${res.status} (${Date.now() - start}ms)`);
      console.log("Agents Executed: " + (data.traces?.map(t => t.agentName).join(', ') || 'None'));
      
      const finalResponseStr = JSON.stringify(data.data, null, 2);
      if (finalResponseStr) {
        console.log("Final Output Excerpt:");
        console.log(finalResponseStr.length > 300 ? finalResponseStr.substring(0, 300) + '... (truncated)' : finalResponseStr);
      } else if (data.errors?.length > 0) {
        console.log("Errors: ", data.errors);
      } else {
        console.log("Final Output: None");
        console.log(JSON.stringify(data).substring(0, 500));
      }
    } catch(err) {
      console.error('Fetch error:', err.message);
    }
  }
}

run();
