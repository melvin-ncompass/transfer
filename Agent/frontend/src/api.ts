export async function getConfig() {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Failed to load config');
  return res.json();
}

export async function getHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}


