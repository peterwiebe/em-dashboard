import { MOCK_CONFLUENCE } from "../data/mockData";

const DOMAIN = import.meta.env.VITE_CONFLUENCE_DOMAIN;  // e.g. "yourcompany.atlassian.net"
const EMAIL  = import.meta.env.VITE_CONFLUENCE_EMAIL;
const TOKEN  = import.meta.env.VITE_CONFLUENCE_TOKEN;
const SPACE  = import.meta.env.VITE_CONFLUENCE_SPACE ?? "ENG";

function basicAuth() {
  return btoa(`${EMAIL}:${TOKEN}`);
}

const ICON_MAP = { page:"📄", blogpost:"📝" };

export async function fetchRecentDocs() {
  if (!DOMAIN || !EMAIL || !TOKEN) return MOCK_CONFLUENCE;

  const cql = encodeURIComponent(`space=${SPACE} AND lastModified > now("-7d") ORDER BY lastModified DESC`);
  const res = await fetch(
    `https://${DOMAIN}/wiki/rest/api/content/search?cql=${cql}&expand=version,space,history.lastUpdated&limit=10`,
    { headers: { Authorization: `Basic ${basicAuth()}`, Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Confluence API error: ${res.status}`);
  const { results } = await res.json();

  return results.map(doc => ({
    icon:    ICON_MAP[doc.type] ?? "📄",
    title:   doc.title,
    space:   doc.space?.name ?? SPACE,
    author:  doc.history?.lastUpdated?.by?.displayName ?? "Unknown",
    updated: new Date(doc.history?.lastUpdated?.when).toLocaleDateString(),
  }));
}
