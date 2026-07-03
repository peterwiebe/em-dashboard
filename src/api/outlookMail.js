import { MOCK_UNREAD_MAIL } from "../data/mockData";

const TOKEN = import.meta.env.VITE_MS_GRAPH_TOKEN; // same token calendar.js/teamsChat.js use

export function mapMessageToUnread(message) {
  return {
    id:        message.id,
    source:    "mail",
    title:     message.subject || "(no subject)",
    from:      message.from?.emailAddress?.name ?? message.from?.emailAddress?.address ?? "unknown",
    timestamp: message.receivedDateTime ?? null,
    link:      message.webLink ?? null,
  };
}

export async function fetchUnreadMail() {
  if (!TOKEN) return MOCK_UNREAD_MAIL;

  const params = new URLSearchParams({
    "$filter": "isRead eq false",
    "$select": "subject,from,receivedDateTime,bodyPreview,webLink",
    "$orderby": "receivedDateTime desc",
    "$top": "50",
  });
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?${params}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!res.ok) throw new Error(`MS Graph API error: ${res.status}`);
  const { value: messages } = await res.json();

  return messages.map(mapMessageToUnread);
}
