import { MOCK_SLACK_UNREAD } from "../data/mockData";

const TOKEN = import.meta.env.VITE_SLACK_TOKEN;

// Scoped to unread DMs and group DMs only (not full channel unread counts,
// which are noisy — see spec Risks). True "@mention" detection would need
// Slack's Events API (a persistent webhook subscription), which doesn't fit
// a client-only fetch-on-load dashboard; that's a documented limitation,
// not something this function attempts.
async function slackFetch(endpoint, params = {}) {
  const url = new URL(`https://slack.com/api/${endpoint}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

// `from` is left as the raw Slack user ID (for IMs) or channel name (for
// group DMs) rather than resolved to a display name — that would need an
// extra users.info call per unique sender, deferred as a follow-up rather
// than done here.
export function mapConversationToUnread(conversation, latestMessage) {
  return {
    id:        conversation.id,
    source:    "slack",
    title:     latestMessage?.text ? latestMessage.text.slice(0, 140) : "(no preview available)",
    from:      conversation.user ?? conversation.name ?? "unknown",
    timestamp: latestMessage?.ts ? new Date(Number(latestMessage.ts) * 1000).toISOString() : null,
    link:      `https://app.slack.com/client/${conversation.team_id ?? ""}/${conversation.id}`,
  };
}

export async function fetchSlackUnread() {
  if (!TOKEN) return MOCK_SLACK_UNREAD;

  const { channels } = await slackFetch("conversations.list", { types: "im,mpim" });

  const unread = [];
  for (const conversation of channels) {
    const { channel } = await slackFetch("conversations.info", { channel: conversation.id });
    if (!channel.unread_count) continue;

    const { messages } = await slackFetch("conversations.history", { channel: conversation.id, limit: "1" });
    unread.push(mapConversationToUnread(conversation, messages?.[0]));
  }
  return unread;
}
