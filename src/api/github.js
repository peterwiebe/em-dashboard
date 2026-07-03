import { MOCK_PRS, MOCK_REVIEW_REQUESTED_PRS } from "../data/mockData";

const TOKEN    = import.meta.env.VITE_GITHUB_TOKEN;
const OWNER    = import.meta.env.VITE_GITHUB_OWNER;
const REPO     = import.meta.env.VITE_GITHUB_REPO;
const USERNAME = import.meta.env.VITE_GITHUB_USERNAME;

export function isPullRequestsConfigured() {
  return Boolean(TOKEN && OWNER && REPO);
}

export function isReviewRequestConfigured() {
  return Boolean(TOKEN && USERNAME);
}

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

// This is the first cache in the codebase; kept inline rather than a shared
// utility since there's exactly one consumer today (rule of three: extract
// if a second one shows up, e.g. calendar polling in D-1).
const REVIEW_CACHE_TTL_MS = 60_000;
let reviewCache = { data: null, fetchedAt: 0 };

export function mapSearchItemToPR(item) {
  const match = item.repository_url?.match(/\/repos\/([^/]+\/[^/]+)$/);
  return {
    id:        item.id,
    title:     item.title,
    repo:      match ? match[1] : item.repository_url,
    author:    item.user?.login ?? "unknown",
    ageHours:  (Date.now() - new Date(item.created_at)) / 3_600_000,
    reviewers: [], // Search API doesn't expose per-reviewer review decisions
    draft:     item.draft ?? false,
  };
}

export async function fetchReviewRequestedPRs({ force = false } = {}) {
  if (!TOKEN || !USERNAME) return MOCK_REVIEW_REQUESTED_PRS;

  const now = Date.now();
  if (!force && reviewCache.data && now - reviewCache.fetchedAt < REVIEW_CACHE_TTL_MS) {
    return reviewCache.data;
  }

  const q = `is:pr is:open review-requested:${USERNAME}`;
  const res = await fetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=50`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const { items } = await res.json();

  const prs = items.map(mapSearchItemToPR);
  reviewCache = { data: prs, fetchedAt: now };
  return prs;
}
