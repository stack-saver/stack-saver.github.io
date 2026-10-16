import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
TOOLS_PATH = ROOT_DIR / "data" / "tools.json"
META_PATH = ROOT_DIR / "data" / "last-updated.json"


def fetch_github_repo(repo: str) -> dict:
    url = f"https://api.github.com/repos/{repo}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "StackSaver-pSEO-Updater/1.0",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    print("Fetching live GitHub repository telemetry for pSEO catalog...")
    tools = json.loads(TOOLS_PATH.read_text(encoding="utf-8"))

    updated_count = 0
    for tool in tools:
        repo = tool.get("githubRepo")
        if not repo:
            continue
        try:
            data = fetch_github_repo(repo)
            pushed_at = data.get("pushed_at") or datetime.now(timezone.utc).isoformat()
            tool["githubStats"] = {
                "stars": data.get("stargazers_count", tool.get("githubStats", {}).get("stars", 0)),
                "forks": data.get("forks_count", tool.get("githubStats", {}).get("forks", 0)),
                "openIssues": data.get("open_issues_count", 0),
                "lastCommit": pushed_at[:10],
                "latestRelease": tool.get("githubStats", {}).get("latestRelease", "latest"),
            }
            updated_count += 1
            stars = tool["githubStats"]["stars"]
            last_commit = tool["githubStats"]["lastCommit"]
            print(f"  [OK] {tool['name']} ({repo}): {stars:,} stars | Last push: {last_commit}")
        except Exception as exc:
            print(f"  [WARN] Could not live-fetch {repo} ({exc}) -- keeping cached metrics.")

    TOOLS_PATH.write_text(json.dumps(tools, indent=2) + "\n", encoding="utf-8")
    now_iso = datetime.now(timezone.utc).isoformat()
    meta = {
        "lastUpdatedIso": now_iso,
        "lastUpdatedDate": now_iso[:10],
        "toolsCount": len(tools),
        "liveUpdatedCount": updated_count,
    }
    META_PATH.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"Done! Updated {updated_count}/{len(tools)} tools and saved metadata.")


if __name__ == "__main__":
    main()
