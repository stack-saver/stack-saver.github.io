import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_PATH = path.join(__dirname, '..', 'data', 'tools.json');
const META_PATH = path.join(__dirname, '..', 'data', 'last-updated.json');

async function fetchGitHubRepo(repo) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'StackSaver-pSEO-Updater/1.0'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${repo}`);
  }
  return res.json();
}

async function main() {
  console.log('🔄 Fetching live GitHub repository telemetry for pSEO catalog...');
  const raw = await fs.readFile(TOOLS_PATH, 'utf8');
  const tools = JSON.parse(raw);

  let updatedCount = 0;
  for (const tool of tools) {
    if (!tool.githubRepo) continue;
    try {
      const data = await fetchGitHubRepo(tool.githubRepo);
      tool.githubStats = {
        stars: data.stargazers_count ?? tool.githubStats?.stars ?? 0,
        forks: data.forks_count ?? tool.githubStats?.forks ?? 0,
        openIssues: data.open_issues_count ?? 0,
        lastCommit: (data.pushed_at || new Date().toISOString()).slice(0, 10),
        latestRelease: tool.githubStats?.latestRelease || 'latest'
      };
      updatedCount++;
      console.log(`  ✅ ${tool.name} (${tool.githubRepo}): ⭐ ${tool.githubStats.stars.toLocaleString()} stars | Last push: ${tool.githubStats.lastCommit}`);
    } catch (err) {
      console.warn(`  ⚠️ Could not live-fetch ${tool.githubRepo} (${err.message}) — keeping cached metrics.`);
    }
  }

  await fs.writeFile(TOOLS_PATH, JSON.stringify(tools, null, 2) + '\n', 'utf8');
  const meta = {
    lastUpdatedIso: new Date().toISOString(),
    lastUpdatedDate: new Date().toISOString().slice(0, 10),
    toolsCount: tools.length,
    liveUpdatedCount: updatedCount
  };
  await fs.writeFile(META_PATH, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  console.log(`✨ Done! Updated ${updatedCount}/${tools.length} tools and saved metadata.`);
}

main().catch((err) => {
  console.error('Error in update-github-stats:', err);
  process.exit(0); // Never break CI if GitHub API has transient downtime
});
