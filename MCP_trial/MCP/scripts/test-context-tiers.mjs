const BASE_URL = process.env.MELCP_URL ?? 'http://localhost:3001';
const API_KEY = process.env.MELCP_API_KEY;

const QUERIES = [
  {
    label: 'OVERVIEW',
    query: 'Give me a full architecture diagram of this project',
    expectedTier: 'overview',
  },
  {
    label: 'MODULE',
    query: 'Explain how the session management system works',
    expectedTier: 'module',
  },
  {
    label: 'SPECIFIC (repo)',
    query: 'What does the repo.service.ts file do and what functions does it export?',
    expectedTier: 'specific',
  },
];

const LINE = '════════════════════════════════════════';
const SUBLINE = '────────────────────────────────────────';

function safeNum(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function pctReduction(base, compared) {
  if (!base) return 'n/a';
  const pct = ((base - compared) / base) * 100;
  return `${pct.toFixed(1)}%`;
}

function calcCost(tokensPerQuery, pricePerMillion) {
  const perQuery = (tokensPerQuery / 1_000_000) * pricePerMillion;
  return {
    per1000: perQuery * 1000,
  };
}

function getAgentTokenRow(trace) {
  const t = trace?.tokensUsed ?? {};
  return {
    agentName: String(trace?.agentName ?? 'UNKNOWN'),
    prompt: safeNum(t.prompt),
    completion: safeNum(t.completion),
    total: safeNum(t.total),
  };
}

function printTable(label, elapsedMs, rows, queryComplexity, targetModule) {
  const header = `${label} query  (${elapsedMs}ms)`;
  console.log(LINE);
  console.log(header);
  console.log(SUBLINE);
  if (queryComplexity) {
    console.log(`Tier: ${queryComplexity}${targetModule ? ` | targetModule: ${targetModule}` : ''}`);
    console.log(SUBLINE);
  }

  const nameW = 20;
  const nW = 10;
  const pad = (s, w) => String(s).padEnd(w, ' ');
  const padNum = (n, w) => String(n).padStart(w, ' ');

  console.log(
    `${pad('Agent', nameW)}${pad('Prompt', nW)}${pad('Completion', nW + 2)}${pad('Total', nW)}`
  );

  let promptSum = 0;
  let completionSum = 0;
  let totalSum = 0;

  for (const row of rows) {
    promptSum += row.prompt;
    completionSum += row.completion;
    totalSum += row.total;
    console.log(
      `${pad(row.agentName, nameW)}${padNum(row.prompt, nW)}${padNum(row.completion, nW + 2)}${padNum(row.total, nW)}`
    );
  }

  console.log(SUBLINE);
  console.log(
    `${pad('TOTAL', nameW)}${padNum(promptSum, nW)}${padNum(completionSum, nW + 2)}${padNum(totalSum, nW)}`
  );
  return { promptSum, completionSum, totalSum };
}

function findAgentPrompt(rows, agentName) {
  return rows.find(r => r.agentName === agentName)?.prompt;
}

async function runOne(entry) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({
      query: entry.query,
    }),
  });
  const elapsedMs = Date.now() - started;

  let body;
  try {
    body = await response.json();
  } catch {
    body = { parseError: true };
  }

  if (!response.ok) {
    const message = body?.message || body?.error || JSON.stringify(body);
    throw new Error(`${entry.label} failed (${response.status}): ${message}`);
  }

  const traces = Array.isArray(body?.traces) ? body.traces : [];
  const rows = traces.map(getAgentTokenRow);
  const queryComplexity = body?.queryComplexity;
  const targetModule = body?.targetModule;

  if (queryComplexity && queryComplexity !== entry.expectedTier) {
    console.warn(
      `[WARN] ${entry.label}: expected tier "${entry.expectedTier}" but got "${queryComplexity}"`
    );
  }

  const totals = printTable(entry.label, elapsedMs, rows, queryComplexity, targetModule);
  return { ...entry, elapsedMs, rows, totals, queryComplexity, targetModule };
}

async function main() {
  console.log(`Testing tier contexts via ${BASE_URL}`);
  if (!API_KEY) {
    console.warn('[WARN] MELCP_API_KEY not set. Request may fail if API key guard is enabled.');
  }
  console.log('');

  const results = [];
  for (const q of QUERIES) {
    try {
      const result = await runOne(q);
      results.push(result);
    } catch (err) {
      console.error(LINE);
      console.error(`${q.label} query failed: ${err.message}`);
      console.error(LINE);
      throw err;
    }
  }

  console.log(LINE);
  console.log('SAVINGS SUMMARY');
  console.log(SUBLINE);

  const overview = results.find(r => r.label === 'OVERVIEW');
  const specific = results.find(r => r.label === 'SPECIFIC (repo)');

  if (overview && specific) {
    const overviewRepo = findAgentPrompt(overview.rows, 'REPO_AGENT');
    const specificRepo = findAgentPrompt(specific.rows, 'REPO_AGENT');
    const overviewDiagram = findAgentPrompt(overview.rows, 'DIAGRAM_AGENT');
    const specificDiagram = findAgentPrompt(specific.rows, 'DIAGRAM_AGENT');

    console.log('Overview vs Specific:');
    if (overviewRepo !== undefined && specificRepo !== undefined) {
      const repoReduction = pctReduction(specificRepo, overviewRepo);
      console.log(
        `  REPO_AGENT prompt tokens:   ${overviewRepo} vs ${specificRepo}  (${repoReduction} reduction)`
      );
    } else {
      console.log('  REPO_AGENT prompt tokens: agent not in this query');
    }
    if (overviewDiagram !== undefined && specificDiagram !== undefined) {
      const diagramReduction = pctReduction(specificDiagram, overviewDiagram);
      console.log(
        `  DIAGRAM_AGENT prompt tokens: ${overviewDiagram} vs ${specificDiagram}  (${diagramReduction} reduction)`
      );
    } else {
      console.log('  DIAGRAM_AGENT prompt tokens: agent not in this query');
    }

    const repoSaved =
      overviewRepo !== undefined && specificRepo !== undefined
        ? Math.max(0, specificRepo - overviewRepo)
        : 0;
    const diagramSaved =
      overviewDiagram !== undefined && specificDiagram !== undefined
        ? Math.max(0, specificDiagram - overviewDiagram)
        : 0;
    const estimatedSavedPerOverview = repoSaved + diagramSaved;
    console.log('');
    console.log(`Estimated tokens saved per overview query: ${estimatedSavedPerOverview}`);

    const geminiCost = calcCost(estimatedSavedPerOverview, 0.075);
    const groqCost = calcCost(estimatedSavedPerOverview, 0.05);

    console.log(
      `At $0.075 per 1M tokens (Gemini 1.5 Flash) that's $${geminiCost.per1000.toFixed(6)} per 1000 overview queries`
    );
    console.log(
      `At $0.05 per 1M tokens (Groq Llama) that's $${groqCost.per1000.toFixed(6)} per 1000 overview queries`
    );
  } else {
    console.log('Insufficient results to compute overview vs specific savings.');
  }

  console.log('\nTo run: MELCP_API_KEY=your-key node scripts/test-context-tiers.mjs');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
