// Client wrapper around the Vite dev-server middleware from A-1
// (vite-plugins/local-state-plugin.js), which only exists under `npm run
// dev` — not in a production build/preview, since it's registered via
// configureServer, not configurePreviewServer. Fine for this single-user,
// dev-server-only tool.
const STATE_ENDPOINT = "/api/state";

export async function load() {
  const res = await fetch(STATE_ENDPOINT);
  if (!res.ok) throw new Error(`Local state API error: ${res.status}`);
  return res.json();
}

export async function save(state) {
  const res = await fetch(STATE_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`Local state API error: ${res.status}`);
  return res.json();
}
