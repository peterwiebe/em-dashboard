import { MOCK_TEAMS_UNREAD } from "../data/mockData";

const TOKEN = import.meta.env.VITE_MS_GRAPH_TOKEN; // same token calendar.js uses

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").trim();
}

// A chat is unread if it has a message and either it's never been read
// (no viewpoint.lastMessageReadDateTime) or the last message arrived after
// the last read time.
export function isChatUnread(chat) {
  const lastMessageAt = chat.lastMessagePreview?.createdDateTime;
  if (!lastMessageAt) return false;

  const lastReadAt = chat.viewpoint?.lastMessageReadDateTime;
  if (!lastReadAt) return true;

  return new Date(lastMessageAt) > new Date(lastReadAt);
}

export function mapChatToUnread(chat) {
  const preview = chat.lastMessagePreview;
  const previewText = preview?.body?.content ? stripHtml(preview.body.content) : "";
  return {
    id:        chat.id,
    source:    "teams",
    title:     previewText ? previewText.slice(0, 140) : "(no preview available)",
    from:      preview?.from?.user?.displayName ?? chat.topic ?? "unknown",
    timestamp: preview?.createdDateTime ?? null,
    link:      chat.webUrl ?? null,
  };
}

export async function fetchTeamsUnread() {
  if (!TOKEN) return MOCK_TEAMS_UNREAD;

  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/chats?$expand=lastMessagePreview&$top=50",
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!res.ok) throw new Error(`MS Graph API error: ${res.status}`);
  const { value: chats } = await res.json();

  return chats.filter(isChatUnread).map(mapChatToUnread);
}
