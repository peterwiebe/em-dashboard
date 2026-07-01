import { MOCK_PRS } from "../data/mockData";

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO  = import.meta.env.VITE_GITHUB_REPO;

export async function fetchPullRequests() {
  if (!TOKEN || !OWNER || !REPO) return MOCK_PRS;

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/pulls?state=open&sort=created&direction=asc`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();

  return data.map(pr => ({
    id:        pr.id,
    title:     pr.title,
    repo:      pr.base.repo.full_name,
    author:    pr.user.login,
    ageHours:  (Date.now() - new Date(pr.created_at)) / 3_600_000,
    reviewers: [], // populate via GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews
    draft:     pr.draft,
  }));
}
